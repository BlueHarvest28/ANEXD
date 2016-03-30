package main

import (
	"log"
	"sync"
	"errors"
	"github.com/googollee/go-socket.io"
)

/*
	Main data structure for the API to store struct instances of Lobby
	When mutating the map structure, mutual exclusion locks should be used.
*/
type Manager struct {
	sync.RWMutex
	lobbies map[string]*Lobby
}

/*
	Struct used for storing parameters about the Application that a lobby is to run.
	Obtained from the API on creation of a lobby (data obtained from database).
*/
type Game struct {
	connType, host, port string
	gameId, maxUsers int
}

/*
	Function to instantiate a new Manager struct for storing Lobby instance pointers.
	Returns a pointer to the created Manager.
*/
func newManager() *Manager {
	m := Manager{
		lobbies: make(map[string]*Lobby),
	}
	return &m
}

/*
	Adds the Lobby stored at the param pointer to the respective Manager map.
	Uses Mutual Exclusion Locks.
*/
func (m *Manager) addLobby(lobby *Lobby) error {
	m.Lock()
	defer m.Unlock()
	lobbyId := lobby.lobbyId
	if _, ok := m.lobbies[lobbyId]; ok {
		return errors.New("manager.addLobby: lobby already exists with given ID.")
	}
	m.lobbies[lobbyId] = lobby
	return nil
}

/*
	Removes the Lobby stored at the parameter Key (lobby ID).
	Uses Mutual Exclusion Locks.
*/
func (m *Manager) removeLobby(lobbyId string) error {
	m.Lock()
	defer m.Unlock()
	if _, ok := m.lobbies[lobbyId]; !ok {
		return errors.New("manager.removeLobby: lobby with given ID does not exist.")
	}
	delete(m.lobbies, lobbyId)
	return nil
}

/*
	On Socket.IO connection to the server, this is the only event accessible.
	Client should emit whether they are an Application Server, a Desktop, or Mobile
	user respectively.
*/
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

/*
	Used to give access to an Application server to connect to a lobby.
*/
func (m *Manager) serverSetup(socket *socketio.Socket) {
	(*socket).On("connectlobby", func(lobbyid string) {
		l, ok := m.lobbies[lobbyid]
		if !ok {
			(*socket).Emit("connectlobby", false)
			log.Printf("manager.serverSetup: lobby with id %s does not exist.", lobbyid)
			return
		}
		l.command <-ServerSocket{
			Socket: socket,
		}
	})
	(*socket).Emit("client", true)
}

/*
	Used to give access to a desktop user to host a lobby.
*/
func (m *Manager) desktopSetup(socket *socketio.Socket) {
	(*socket).On("hostlobby", func(msg map[string]interface{}) {
		lobbyid := msg["lobbyid"].(string)
		l, ok := m.lobbies[lobbyid]
		if !ok {
			(*socket).Emit("hostlobby", false)
			log.Printf("manager.desktopSetup: lobby with id %s does not exist.", lobbyid)
			return
		}
		l.command <-HostLobby{
			Username: msg["username"].(string),
			Socket: socket,
		}
	})
	(*socket).Emit("client", true)
}

/*
	Used to give access to a mobile user to join a lobby.
*/
func (m *Manager) mobileSetup(socket *socketio.Socket) {
	(*socket).On("joinlobby", func(msg map[string]interface{}) {
		lobbyid := msg["lobbyid"].(string)
		l, ok := m.lobbies[lobbyid]
		if !ok {
			(*socket).Emit("joinlobby", false)
			log.Printf("manager.mobileSetup: lobby with id %s does not exist.", lobbyid)
			return
		}
		l.command <-JoinLobby{
			Username: msg["username"].(string),
			Socket: socket,
		}
	})
	(*socket).Emit("client", true)
}