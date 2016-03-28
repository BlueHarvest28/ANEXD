package main

import (
	//"fmt"
	"log"
	"errors"
	"sync"
	"time"
	"net"
	"bytes"
	"net/http"
	"encoding/json"
	"github.com/googollee/go-socket.io"
)

type Lobby struct {
	sync.RWMutex
	lobbyId string
	game Game
	started bool
	users []*User
	send chan MessageServer //[]byte for TCP?
	command chan Command //Message type?
	quit chan int
	timeout chan bool
	tcpConn *net.TCPConn
	socket *socketio.Socket
}

/*
	lobbyid string
	Game{connType, host, port string gameId, maxUsers int
	}
*/
func newSession(l string, g Game) *Lobby {
	lobby := Lobby {
		lobbyId: l,
		game: g,
		started: false,
		users: make([]*User, 0, g.maxUsers + 1),
		send: make(chan MessageServer),
		command: make(chan Command),
		quit: make(chan int),
	}
	go lobby.commandHandler()
	return &lobby
}

func (l *Lobby) addNewUser(uname string, s *socketio.Socket) error {
	l.Lock()
	defer l.Unlock()
	if len(l.users) == cap(l.users) {
		return errors.New("Lobby: lobby is full")
	}
	for i := 0; i < len(l.users); i++ {
		if uname == l.users[i].username {
			return errors.New("Lobby: user already exists with username entered")
		}
	}
	index := len(l.users)
	p := float64(index)
	user := newSessionUser(p, uname, l, s)
	err := (*user.socket).Join(l.lobbyId)
	if err != nil {
		return err
	}
	if index > 0 {
		user.anonSetup()
	} else { //index is 0, so new user is a host
		user.hostSetup()
	}
	l.users = append(l.users, user)
	l.command <- Update{}
	return nil
}

/*
	Removes a player from the users slice - No Memory Leak:
	Example: Removing index 2 from: 			 [0][1][2][3][4]
										 Append: [0][1]   [3][4]
	Final memory block still has redundant data: [0][1][3][4][4]
							 Overwrite with nil: [0][1][3][4][nil]
*/
func (l *Lobby) removeUser(p float64) error {
	l.Lock()
	defer l.Unlock()
	player := int(p)
	if player >= len(l.users) || player < 0 {
		return errors.New("Lobby: Player to remove invalid index")
	}
	l.users, l.users[len(l.users)-1] = append(l.users[:player], l.users[player+1:]...), nil
	//Update all player numbers greater than deleted index
	for i := player; i < len(l.users); i++ {
		l.users[i].player = float64(i)
	}
	l.command <- Update{}
	return nil
}

func (l *Lobby) updateLobby() {
	var list []LobbyUser
	//players := l.users[1:]
	for _, p := range l.users {
		player := LobbyUser{
			Nickname: p.username,
			Ready: p.ready,
		}
		list = append(list, player)
	}
	l.users[0].send <- LobbyUsers{
		Room: l.lobbyId,
		List: list,
	}
}

func (l *Lobby) connectTcp() error {
	addr := l.game.host + ":" + l.game.port
	tcpAddr, err := net.ResolveTCPAddr("tcp", addr)
	if err != nil {
		return err
	}
	conn, err := net.DialTCP("tcp", nil, tcpAddr)
	if err != nil {
		return err
	}
	l.tcpConn = conn
	go l.sendHandler()
	go l.tcpHandler()
	return nil
}

func (l *Lobby) connectSocketio() error {
	l.timeout = make(chan bool, 1)
	//call http function to server
	postSocketRequest(l.game.host, l.lobbyId)
		
	go func() {
		time.Sleep(30 * time.Second)
		l.timeout <- true
	}()
	select {
		case failure := <-l.timeout:
		if failure { //no response from server
			return errors.New("connectSocketio: No response from application server (timed out).")
		}
	}
	//successfully received socket
	go l.sendHandler()
	l.socketioHandler()
	return nil
}

//POST Request
//http://stackoverflow.com/questions/31662411/specify-port-number-in-http-request-node-js
func postSocketRequest(uri string, lid string) {
	url := uri
    log.Println("sent post to url: ", url)

    var jsonStr = []byte(`{"lobbyId":"` + lid + `"}`)
    req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonStr))
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        log.Printf("Error with Post request, %v", err)
    }
    defer resp.Body.Close()
}

func (l *Lobby) createSession() {
	room := l.lobbyId
	//create timeout for request
	l.timeout = make(chan bool, 1)
	//request new game with parameters
	l.send <- NewSession{
		Event: "newsession",
		Players: float64(len(l.users)),
		MaxPlayers: float64(cap(l.users)),
	}
	l.users[0].send <- GameStart{
		Room: room,
		Complete: false,
		Failed: false,
		Feedback: "Requested a new session to game server, awaiting response.",
	}
	go func() {
		time.Sleep(30 * time.Second)
		l.timeout <- true
	}()
	select {
		case failure := <-l.timeout:
		if failure { //timed out
			l.users[0].send <- GameStart{
				Room: room,
				Complete: false,
				Failed: true,
				Feedback: "No response from server in time for created session.",
			}
		} else { //response from server on time
			l.users[0].send <- GameStart{
				Room: room,
				Complete: true,
				Failed: false,
				Feedback: "Server successfully created session.",
			}
		}
	}
}

func (l *Lobby) sendHandler() {
	if l.game.connType == "tcp" {
		for {
			select {
				case message := <-l.send:
				go message.tcp(l)
				case <-l.quit:
				return
			}
		}
	} else { //l.game.connType == "socketio"
		for {
			select {
				case message := <-l.send:
				go message.socketio(l)
				case <-l.quit:
				return
			}
		}
	}
}

func (l *Lobby) tcpHandler() {
	decoder := json.NewDecoder(l.tcpConn)
	for {
		var sMsg ServerMessage
		err := decoder.Decode(&sMsg)
		if err != nil {
			log.Print(err)
		}
		//check event
		switch sMsg.Event {
			case "msgplayer":
			l.command <- MsgPlayer{
				Player: int(sMsg.Player),
				Msg: sMsg.Msg,
			}
			case "msgall":
			l.command <- MsgAll{
				Msg: sMsg.Msg,
			}
			case "created":
			l.command <- Created{}
		}
	}
}

func (l *Lobby) socketioHandler() {
	(*l.socket).On("msgplayer", func(sMsg ServerMessage) {
		l.command <- MsgPlayer{
			Player: int(sMsg.Player),
			Msg: sMsg.Msg,
		}
	})
	(*l.socket).On("msgall", func(sMsg ServerMessage) {
		l.command <- MsgAll {
			Msg: sMsg.Msg,
		}
	})
}

func (l *Lobby) commandHandler() {
	for {
		select {
			case command := <-l.command:
			go command.execute(l)
			case <-l.quit:
			return
		}
	}
}

/*
	End all running goroutines for lobby
*/
func (l *Lobby) terminate() {
	close(l.quit)

}