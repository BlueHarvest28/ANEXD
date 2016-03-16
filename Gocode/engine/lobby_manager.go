package main

import (
	//"fmt"
	"log"
	"errors"
	"sync"
	//"encoding/json"
	"github.com/googollee/go-socket.io"
)

type Manager struct {
	sync.RWMutex
	sessions map[int]*Session
	hosts map[int]*HostUser //map of active session hosts
}

type Game struct {
	host, port string
	maxUsers int
}

/*
	JSON data structs used in websocket message processing
*/

type JoinLobby struct {
	Nickname   string    `json:"nickname"`
	Lobbyid    int       `json:"lobbyid"`
}

func (g Game) MaxUsers() int {
	return g.maxUsers
}

func newManager() *Manager {
	m := Manager{
		sessions: make(map[int]*Session),
		hosts: make(map[int]*HostUser),
	}
	return &m
}

func (m Manager) createSession(hostId int, hostname string, game Game, sessionId int) error {
	host, err := newHostUser(hostId, hostname)
	if err != nil {
		log.Print(err)
		return err
	}
	session, err := newSession(game, sessionId, host)
	if err != nil {
		log.Print(err)
		return err
	}
	m.Lock()
	defer m.Unlock()
	err = m.addHost(hostId, host)
	if err != nil {
		log.Print(err)
		return err
	}
	err = m.addSession(sessionId, session)
	if err != nil {
		log.Print(err)
		return err
	}
	return nil
}

//ADD ERROR CHECKS LATER
func (m Manager) destroySession(hostId int, sessionId int) error {
	m.Lock()
	defer m.Unlock()
	m.removeHost(hostId)
	m.removeSession(sessionId)
	return nil
}

func (m Manager) addSession(sId int, sess *Session) error {
	_, ok := m.sessions[sId]
	if !ok {
		return errors.New("manager: user already has open session.")
	}
	m.sessions[sId] = sess
	return nil
}

func (m Manager) removeSession(sId int) error {
	_, ok := m.sessions[sId]
	if !ok {
		return errors.New("manager: session does not exist.")
	}
	delete(m.sessions, sId)
	return nil
}

func (m Manager) addHost(hId int, host *HostUser) error {
	h, ok := m.hosts[hId]
	if ok {
		if h.Sess != nil {
			return errors.New("manager: host already has open session.")
		}
	} else {
		m.hosts[hId] = host
	}
	return nil
}

func (m Manager) removeHost(hId int) error {
	_, ok := m.hosts[hId]
	if !ok {
		return errors.New("manager: active host does not exist.")
	}
	delete(m.hosts, hId)
	return nil
}

/*
	Socket handler function for associating connections with lobbies
*/
func (m Manager) sessionHandler(socket socketio.Socket) {
	//namespace := fmt.Sprintf("/%s", socket.Id())
	//Associates Desktop Socket with HostUser instance
	log.Print("user connected MingLee")
	err := socket.Join("bulbasroom")
	if err != nil {
		log.Print(err)
	}
	socket.On("hostlobby", func(hostid int) {
		log.Printf("hostlobby attempted, data in: %v", hostid)
		/*jsonTings := make([]LobbyUser, 0, 5)
		p1 := LobbyUser{
			Player: 1,
			Nickname: "james",
			Ready: true,
		}
		p2 := LobbyUser{
			Player: 2,
			Nickname: "jimmy",
			Ready: true,
		}
		p3 := LobbyUser{
			Player: 3,
			Nickname: "bobo",
			Ready: false,
		}
		jsonTings = append(jsonTings, p1, p2, p3)
		*/
		/*px := LobbyUser{
			Player: 6,
			Nickname: "DansGame",
			Ready: true,		
		}
		jsonData, err := json.Marshal(px)
		if err != nil {
			log.Print("yolo swaggerino")
		}
		socket.Emit("hoobahooba", jsonData)
		socket.Emit("hoobahooba", socket.Rooms())
		socket.BroadcastTo("bulbasroom", "gamestart", "sup bruh")
		*/
		h, ok := m.hosts[hostid]
		if !ok {
			socket.Emit("disconnect")
			log.Print("manager: could not find HostUser")
			return
		}
		h.SetSocket(socket)
		h.Setup()
	})
	//Creates and adds an AnonUser to the respective Lobbyid
	socket.On("joinlobby", func(msg map[string]interface{}) {
		//var data JoinLobby
		//err := json.Unmarshal(msg, &data)
		//if err != nil {
		//	socket.Emit("disconnect")
		//	log.Print(err)
		//	return
		//}
		//check if session exists
		s, ok := m.sessions[msg["lobbyid"].(int)]
		if !ok {
			socket.Emit("disconnect")
			log.Print("manager: lobby does not exist")
			return
		}
		//create AnonUser instance
		a := newAnonUser(msg["nickname"].(string))
		err = s.addAnonUser(msg["nickname"].(string), a)
		if err != nil {
			socket.Emit("disconnect")
			log.Panic(err)
		}
		a.SetSocket(socket)
		a.Setup()
	})
}