package main

import (
	"log"
	"errors"
	"sync"
	"encoding/json"
	"github.com/googollee/go-socket.io"
)

type Manager struct {
	sync.RWMutex
	sessions map[int]*Session
	hosts map[int]*HostUser //map of active session hosts
}

type Game struct {
	uri, port string
	maxUsers int
}

/*
	JSON data structs used in websocket message processing
*/

type JoinLobby struct {
	Nickname   string    `json:"nickname"`
	Lobbyid    int       `json:"lobbyid"`
}

func newManager() *Manager {
	m := Manager{
		sessions: make(map[int]*Session),
		hosts: make(map[int]*HostUser),
	}
	return &m
}

func (m Manager) createSession(hostId int, hostname string, game Game, sessionId int) error {
	log.Printf("yh bruv 1.0")
	host, err := newHostUser(hostId, hostname)
	if err != nil {
		log.Print(err)
		return err
	}
	log.Printf("yh bruv 1")
	session, err := newSession(game, sessionId, host)
	if err != nil {
		log.Print(err)
		return err
	}
	log.Printf("yh bruv 2")
	m.Lock()
	defer m.Unlock()
	err = m.addHost(hostId, host)
	if err != nil {
		log.Print(err)
		return err
	}
	log.Printf("yh bruv 3")
	err = m.addSession(sessionId, session)
	if err != nil {
		log.Print(err)
		return err
	}
	log.Printf("yh bruv 4")
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
	socket.On("hostlobby", func(hostid int) {
		h, ok := m.hosts[hostid]
		if !ok {
			socket.Emit("disconnect")
			log.Panic("manager: could not find HostUser")
		}
		h.SetSocket(socket)
		h.Setup()
	})
	//Creates and adds an AnonUser to the respective Lobbyid
	socket.On("joinlobby", func(msg []byte) {
		var data JoinLobby
		err := json.Unmarshal(msg, &data)
		if err != nil {
			socket.Emit("disconnect")
			log.Panic(err)
		}
		//check if session exists
		s, ok := m.sessions[data.Lobbyid]
		if !ok {
			socket.Emit("disconnect")
			log.Panic("manager: lobby does not exist")
		}
		//create AnonUser instance
		a := newAnonUser(data.Nickname)
		err = s.addAnonUser(data.Nickname, a)
		if err != nil {
			socket.Emit("disconnect")
			log.Panic(err)
		}
		a.SetSocket(socket)
		a.Setup()
	})
}