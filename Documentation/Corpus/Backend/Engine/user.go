package main

import (
	"fmt"
	"github.com/googollee/go-socket.io"
)

/*
	Main struct for a User instance in a lobby, storing all variables required 
	for User functionality.
*/
type User struct {
	player float64 //json decodes to float64
	username string
	ready bool
	lobby *Lobby
	send chan MessageUser
	quit chan bool
	socket *socketio.Socket
}

/*
	Instantiates and returns a pointer to a new User.
*/
func newSessionUser(p float64, uname string, l *Lobby, s *socketio.Socket) *User {
	user := User{
		player: p,
		username: uname,
		ready: false,
		lobby: l,
		send: make(chan MessageUser),
		quit: make(chan bool),
		socket: s,
	}
	return &user
}

/*
	If a User has connected to a lobby as a host, this function will be
	executed, setting up all Socket.IO events required by a host according 
	to the Message Data Specification document.
*/
func (u *User) hostSetup() {
	(*u.socket).Join(fmt.Sprintf("%d", u.lobby.lobbyId))
	go u.sendHandler()
	(*u.socket).On("setready", func(r bool) {
		u.ready = r
		u.lobby.command <- Update{}
	})
	(*u.socket).On("kick", func(r RemovedUser) {
		u.lobby.command <- r
	})
	(*u.socket).On("getappid", func() {
		u.send <- GetAppId{
			Appid: float64(u.lobby.game.gameId),
		}
	})
	(*u.socket).On("start", func() {
		u.lobby.command <- Start{}
	})
	(*u.socket).On("launch", func() {
		u.lobby.command <- Launch{}
	})
	(*u.socket).On("msg", func(msg map[string]interface{}) {
		u.lobby.send <- MsgServer{
			Player: u.player,
			Msg: msg,
		}
	})
}

/*
	If a User has connected to a lobby as a mobile user, this function will be
	executed, setting up all Socket.IO events required by a mobile user according 
	to the Message Data Specification document.
*/
func (u *User) anonSetup() {
	(*u.socket).Join(fmt.Sprintf("%d", u.lobby.lobbyId))
	go u.sendHandler()
	(*u.socket).On("setready", func(r bool) {
		u.ready = r
		u.lobby.command <- Update{}
	})
	(*u.socket).On("leave", func() {
		u.lobby.command <- RemovedUser{
			Player: u.player,
		}
	})
	(*u.socket).On("getappid", func() {
		u.send <- GetAppId{
			Appid: float64(u.lobby.game.gameId),
		}
	})
	(*u.socket).On("msg", func(msg map[string]interface{}) {
		u.lobby.send <- MsgServer{
			Player: u.player,
			Msg: msg,
		}
	})
}

/*
	Handler function for outbound messages to the User, sent over Socket.IO.
*/
func (u *User) sendHandler() {
	for {
		select {
			case message := <-u.send:
			go message.process(u)
			case <-u.quit:
			break
		}
	}
}

/*
	Function called to prevent any goroutine leaks when User removed.
*/
func (u *User) terminate() {
	close(u.quit)
}