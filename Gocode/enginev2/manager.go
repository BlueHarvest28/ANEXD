package main

import (
	"log"
	"sync"
	"errors"
	"github.com/googollee/go-socket.io"
)

type Manager struct {
	sync.RWMutex
	lobbies map[string]*Lobby
}

type Game struct {
	connType, host, port string
	gameId, maxUsers int
}

func newManager() *Manager {
	m := Manager{
		lobbies: make(map[string]*Lobby),
	}
	return &m
}

func (m *Manager) addLobby(lobbyId string, lobby *Lobby) error {
	m.Lock()
	defer m.Unlock()
	if _, ok := m.lobbies[lobbyId]; ok {
		return errors.New("manager.addLobby: lobby already exists with given ID.")
	}
	m.lobbies[lobbyId] = lobby
	return nil
}

func (m *Manager) removeLobby(lobbyId string) error {
	m.Lock()
	defer m.Unlock()
	if _, ok := m.lobbies[lobbyId]; !ok {
		return errors.New("manager.removeLobby: lobby with given ID does not exist.")
	}
	delete(m.lobbies, lobbyId)
	return nil
}

func (m *Manager) socketSetup(socket socketio.Socket) {
	socket.On("client", func(client string) {
		switch client {
			case "server":
			m.serverSetup(&socket)
			case "desktop":
			m.desktopSetup(&socket)
			case "mobile":
			m.mobileSetup(&socket)
		}
	})
}

func (m *Manager) serverSetup(socket *socketio.Socket) {
	(*socket).On("lobby", func(lobbyid string) {
		m.Lock()
		defer m.Unlock()
		l, ok := m.lobbies[lobbyid]
		if !ok {
			(*socket).Emit("lobby", false)
			log.Printf("manager.serverSetup: lobby with id %s does not exist.", lobbyid)
			return
		}
		l.command <-ServerSocket{
			Socket: socket,
		}
	})
}

//MAKE FUNCTION INTO MESSAGE OBJECT PROCESSES
func (m *Manager) desktopSetup(socket *socketio.Socket) {
	(*socket).On("hostlobby", func(msg map[string]interface{}) {
		m.Lock()
		defer m.Unlock()
		lobbyid := msg["lobbyid"].(string)
		username := msg["username"].(string)
		l, ok := m.lobbies[lobbyid]
		if !ok {
			(*socket).Emit("hostlobby", false)
			log.Printf("manager.desktopSetup: lobby with id %s does not exist.", lobbyid)
			return
		}
		if len(l.users) != 0 {
			(*socket).Emit("hostlobby", false)
			log.Printf("manager.desktopSetup: lobby id entered %s already has a host user.", lobbyid)
			return
		}
		err := l.addNewUser(username, socket)
		if err != nil {
			(*socket).Emit("hostlobby", false)
			log.Print(err)
			return
		}
		(*socket).Emit("hostlobby", true)
	})
}

//MAKE FUNCTION INTO MESSAGE OBJECT PROCESSES
func (m *Manager) mobileSetup(socket *socketio.Socket) {
	(*socket).On("joinlobby", func(msg map[string]interface{}) {
		m.Lock()
		defer m.Unlock()
		lobbyid := msg["lobbyid"].(string)
		username := msg["username"].(string)
		l, ok := m.lobbies[lobbyid]
		if !ok {
			(*socket).Emit("joinlobby", false)
			log.Printf("manager.mobileSetup: lobby with id %s does not exist.", lobbyid)
			return
		}
		if len(l.users) == 0 {
			(*socket).Emit("joinlobby", false)
			log.Printf("manager.desktopSetup: lobby id entered %s does not have a host user.", lobbyid)
			return
		}
		err := l.addNewUser(username, socket)
		if err != nil {
			(*socket).Emit("joinlobby", false)
			log.Print(err)
			return
		}
		(*socket).Emit("hostlobby", true)
	})
}