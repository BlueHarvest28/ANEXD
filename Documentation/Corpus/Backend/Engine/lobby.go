package main

import (
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

/*
	Main data struct for a lobby instance, contains a slice storing
	points to all User instances connected to the lobby.
	
	Functions that operate on the slice must use Mutual Exclusion Locks.
*/
type Lobby struct {
	sync.RWMutex
	lobbyId string
	game Game
	started bool
	users []*User
	send chan MessageServer
	command chan Command
	quit chan int
	timeout chan bool
	tcpConn *net.TCPConn
	socket *socketio.Socket
}

/*
	Struct for creating a JSON object to be emitted within a JSON array of
	users currently in the lobby.
*/
type LobbyUser struct {
	Nickname string                 `json:"nickname"`
	Ready	 bool	                `json:"ready"`
}

/*
	Function to instantiate a new Lobby struct, runs the instance's
	commandHandler() goroutine, which listens on the command channel
	for instructions to manipulate the data held in the struct.
	
	Returns a pointer to the instance created.
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

/*
	Called by a "hostlobby" or "joinlobby" Socket.IO event from the front-end.
	Uses mutual exclusion locks to modify the data structure.
	Checks whether the lobby is full or username already exists in lobby.
	Calls newSessionUser() function to instantiate a new User struct
	Joins the Socket.IO lobby Room and sets up Socket.IO events for User, 
	respective of the type.
	
	Adds a new User instance to the lobby data structure.
*/
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
	l.users = append(l.users, user)
	if index == 0 {
		user.hostSetup()
		go l.pollUpdate()
	} else {
		user.anonSetup() //index is not 0, so new user is a mobile player
	}
	return nil
}

/*
	This function should not be run if the started bool is true, as 
	player numbers should be fixed at that point.
	Removes a player from the users slice
	No Memory Leak:
	Example: Removing index 2 from: 			 [0][1][2][3][4]
										 Append: [0][1]   [3][4]
	Final memory block still has redundant data: [0][1][3][4][4]
							 Overwrite with nil: [0][1][3][4][nil]
*/
func (l *Lobby) removeUser(p float64) error {
	if l.started {
		return errors.New("Lobby.removeUser: Lobby has started so cannot remove user.")
	}
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

/*
	Function to be called as a goroutine, to constantly emit a lobby update.
	While not necessary if connections are all consistent, if a user misses 
	an event based update (such as on a user join/leave), this function 
	keeps polling on time intervals.
*/
func (l *Lobby) pollUpdate() {
	for {
		if !l.started {
			l.updateLobby()
			time.Sleep(3 * time.Second)
		} else {
			break
		}
	}
}

/*
	Creates an array of objects (to be JSON Marshaled later) representing
	the current users in the lobby, and their ready status.
*/
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

/*
	Connects an Application Server to this session via TCP.
*/
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

/*
	Connects an Application Server to this session via client sided Socket.IO
*/
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

/*
	Function by Alex Austin:
	POST Request to an Application Server to inform them to initiate a Socket.IO 
	connection, with the lobbyid to associate the received socket with this lobby.
	http://stackoverflow.com/questions/31662411/specify-port-number-in-http-request-node-js
*/
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

/*
	Once a connection with the Application server is established, 
	this function attempts to create a lobby instance (on the Application Server)
	and prepare the server with the respective lobby parameters, such as player count.
	Sends a response to the host user to report success over Socket.IO message.
*/
func (l *Lobby) createSession() {
	room := l.lobbyId
	//create timeout for request
	l.timeout = make(chan bool, 1)
	//request new game with parameters
	l.send <- NewSession{
		Event: "new",
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

/*
	Handler function for outbound messages to the Application server, sent 
	over the respective connection instance, over tcp, ws or Socket.IO.
*/
func (l *Lobby) sendHandler() {
	if l.game.connType == "tcp" {
		for {
			select {
				case message := <-l.send:
				go message.tcp(l)
				case <-l.quit:
				break
			}
		}
	} else { //l.game.connType == "socketio"
		for {
			select {
				case message := <-l.send:
				go message.socketio(l)
				case <-l.quit:
				break
			}
		}
	}
}

/*
	Handler function for inbound messages from the Application server, received 
	over the respective TCP connection instance.
*/
func (l *Lobby) tcpHandler() {
	decoder := json.NewDecoder(l.tcpConn)
	for {
		select {
			case <-l.quit:
			break
			default:
			var sMsg ServerMessage
			err := decoder.Decode(&sMsg)
			if err != nil {
				log.Print(err)
			}
			l.command <- sMsg
		}
	}
}

/*
	Handler setup function for inbound messages from the Application server, received 
	over the respective Socket.IO connection instance.
*/
func (l *Lobby) socketioHandler() {
	(*l.socket).On("out", func(sMsg ServerMessage) {
		l.command <- sMsg
	})
}

/*
	Handler function for processing commands to change the lobby struct data.
*/
func (l *Lobby) commandHandler() {
	for {
		select {
			case command := <-l.command:
			go command.execute(l)
			case <-l.quit:
			break
		}
	}
}

/*
	End all running goroutines for lobby, prevent goroutine leaks to ensure
	garbage collection when the lobby is removed.
*/
func (l *Lobby) terminate() {
	l.started = true
	close(l.quit)
}