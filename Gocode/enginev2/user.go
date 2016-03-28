package main

import (
	"fmt"
	//"log"
	//"errors"
	//"encoding/json"
	"github.com/googollee/go-socket.io"
)

type User struct {
	player float64 //json decodes to float64
	username string
	ready bool
	lobby *Lobby
	send chan UserMessage
	quit chan bool
	socket *socketio.Socket
}

func newSessionUser(p float64, uname string, l *Lobby, s *socketio.Socket) *User {
	user := User{
		player: p,
		username: uname,
		ready: false,
		lobby: l,
		send: make(chan UserMessage),
		quit: make(chan bool),
		socket: s,
	}
	return &user
}

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
	(*u.socket).On("msg", func(msg map[string]interface{}) {//Change to "msg"
		u.lobby.send <- MsgServer{
			Player: u.player,
			Msg: msg,
		}
	})
}

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
	(*u.socket).On("msg", func(msg map[string]interface{}) {//Change to "msg"
		u.lobby.send <- MsgServer{
			Player: u.player,
			Msg: msg,
		}
	})
}

func (u *User) sendHandler() {
	for {
		select {
			case message := <-u.send:
			go message.process(u)
			case <-u.quit:
			return
		}
	}
}

func (u *User) terminate() {
	close(u.quit)
}