package main

import (
	"fmt"
	"log"
	//"net"
	"encoding/json"
	"github.com/googollee/go-socket.io"
)

/*
	Messages sent to the application server over the connection.
	Received by lobby.send
	MAYBE MAKE ALL INTO ONE STRUCT (MsgServer) <- ALL SO FAR HAVE SAME FUNCTIONALITY
	ONLY POSSIBLE IF SERVER REACTS ON EVENT: FIELD IN JSON RATHER THAN SOCKET EVENT
*/
type MessageServer interface {
	tcp(l *Lobby)
	socketio(l *Lobby)
}

type MsgServer struct {
	Player float64                  `json:"player"`
	Msg map[string]interface{}      `json:"msg"`
}

func (m MsgServer) tcp(l *Lobby) {
	jsonMsg, err := json.Marshal(m)
	if err != nil {
		log.Print(err)
		return
	}
	(*l.tcpConn).Write(jsonMsg)
}

func (m MsgServer) socketio(l *Lobby) {
	(*l.socket).Emit("msgserver", m)
}

type NewSession struct {
	Event string					`json:"event"`
	Players float64                 `json:"players"`
	MaxPlayers float64              `json:"maxplayers"`
}

func (n NewSession) tcp(l *Lobby) {
	jsonMsg, err := json.Marshal(n)
	if err != nil {
		log.Print(err)
		return
	}
	(*l.tcpConn).Write(jsonMsg)
}

func (n NewSession) socketio(l *Lobby) {
	(*l.socket).Emit("newsession", n)
}

type Launch struct {
	Event string                    `json:"event"`
}

func (la Launch) tcp(l *Lobby) {
	jsonMsg, err := json.Marshal(la)
	if err != nil {
		log.Print(err)
		return
	}
	(*l.tcpConn).Write(jsonMsg)
}

func (la Launch) socketio(l *Lobby) {
	(*l.socket).Emit("launch", la)
}

type LobbyUser struct {
	Nickname string                 `json:"nickname"`
	Ready	 bool	                `json:"ready"`
}

/*
	Commands received by the lobby for accessing/changing the lobby data structure.
*/
type Command interface {
	execute(l *Lobby)
}

type ServerMessage struct {
	Event string                    `json:"event,omitempty"`
	Player float64                  `json:"player,omitempty"`
	Msg map[string]interface{}      `json:"msg,omitempty"`
}

/*
	MsgPlayer uses multiple interface implementation for both Command and UserMessage
*/
type MsgPlayer struct {
	Player int
	Msg map[string]interface{}
}

func (m MsgPlayer) execute(l *Lobby) {
	if m.Player >= len(l.users) || m.Player < 0 {
		log.Print("MsgPlayer: invalid player index")
		return
	}
	l.users[m.Player].send <- m
}

type MsgAll struct {
	Room string
	Msg map[string]interface{}
}

func (m MsgAll) execute(l *Lobby) {
	m.Room = l.lobbyId
	l.users[0].send <- m
}

type HostLobby struct {
	Username string
	Socket *socketio.Socket
}

func (h HostLobby) execute(l *Lobby) {
	if len(l.users) != 0 {
		(*h.Socket).Emit("hostlobby", false)
		log.Print("manager.desktopSetup: lobby id entered already has a host user.")
		return
	}
	err := l.addNewUser(h.Username, h.Socket)
	if err != nil {
		(*h.Socket).Emit("hostlobby", false)
		log.Print(err)
		return
	}
	(*h.Socket).Emit("hostlobby", true)
}

type JoinLobby struct {
	Username string
	Socket *socketio.Socket
}

func (j JoinLobby) execute(l *Lobby) {
	if len(l.users) == 0 {
		(*j.Socket).Emit("joinlobby", false)
		log.Print("manager.desktopSetup: lobby id entered does not have a host user.")
		return
	}
	err := l.addNewUser(j.Username, j.Socket)
	if err != nil {
		(*j.Socket).Emit("joinlobby", false)
		log.Print(err)
		return
	}
	(*j.Socket).Emit("joinlobby", true)
}

type Update struct {}

func (u Update) execute(l *Lobby) {
	l.updateLobby()
}

type ServerSocket struct {
	Socket *socketio.Socket
}

//*** check locks
func (s ServerSocket) execute(l *Lobby) {
	if l.timeout != nil {
		if l.socket == nil {
			l.Lock()
			l.socket = s.Socket
			l.Unlock()
			(*l.socket).Emit("connectlobby", true)
		}
		l.timeout <- false
	}
}

type Start struct {}

func (s Start) execute(l *Lobby) {
	room := l.lobbyId
	var err error
	//establish connection
	if l.game.connType == "tcp" {
		if l.tcpConn == nil {
			err = l.connectTcp()
		}
	} else { //l.game.connType == "socketio"
		if l.socket == nil {
			err = l.connectSocketio()
		}
	}
	if err != nil {
		log.Print(err)
		l.users[0].send <- GameStart{
			Room: room,
			Complete: false,
			Failed: true,
			Feedback: "Unable to connect to application server.",
		}
		return
	}
	l.users[0].send <- GameStart{
		Room: room,
		Complete: false,
		Failed: false,
		Feedback: "Connected to application server.",
	}
	l.createSession()
}

type Created struct {}

func (c Created) execute(l *Lobby) {
	if l.timeout != nil {
		l.timeout <- false
	}
}

func (la Launch) execute(l *Lobby) {
	l.started = true
	la.Event = "launch"
	l.send <- la
}

type RemovedUser struct {
	Player float64                  `json:"-"`
	Username string                 `json:"username"`
	Reason string                   `json:"reason,omitempty"`
}

func (r RemovedUser) execute(l *Lobby) {
	kicked := false
	if r.Player == 0 { //kicked by username
		kicked = true
		for i := 1; i < len(l.users); i++ {
			if r.Username == l.users[i].username {
				r.Player = float64(i)
				break
			}
		}
	}
	if r.Player == 0 { //if still not set, does not exist
		log.Print("RemovedUser: User not found in session.")
		l.users[0].send <- Kick{
			Response: false,
			Feedback: fmt.Sprintf("%s was not found in lobby.", r.Username),
		}
		return
	}
	err := l.removeUser(r.Player)
	if err != nil {
		log.Print(err)
		l.users[0].send <- Kick{
			Response: false,
			Feedback: fmt.Sprintf("%s was unable to be removed.", r.Username),
		}
		return
	}
	if kicked {
		l.users[0].send <- Kick{
			Response: true,
			Feedback: fmt.Sprintf("%s was removed from the lobby.", r.Username),
		}
	}
	//message removed user:
	if r.Reason != "" {
		l.users[int(r.Player)].send <- Kicked{
			Reason: r.Reason,
		}
	}
	l.users[int(r.Player)].send <- Leave{}
}

/*
	Messages between an individual User processing functions.
*/
type UserMessage interface {
	process(u *User)
}

type Leave struct {}

func (l Leave) process(u *User) {
	(*u.socket).Emit("leave")//, "You have been removed from the lobby.")
	(*u.socket).Emit("disconnect")
}

type GetAppId struct {
	Appid float64
}

func (g GetAppId) process(u *User) {
	(*u.socket).Emit("getappid", g.Appid)
}

type Kicked struct {
	Reason string
}

func (k Kicked) process(u *User) {
	(*u.socket).Emit("kicked", k.Reason)
}

type Kick struct {
	Response bool                   `json:"response"`
	Feedback string                 `json:"feedback"`
}

func (k Kick) process(u *User) {
	(*u.socket).Emit("kick", k)
}

type GameStart struct {
	Room string                     `json:"-"`
	Complete bool                   `json:"complete"`
	Failed bool                     `json:"failed"`
	Feedback string                 `json:"feedback"`
}

func (g GameStart) process(u *User) {
	(*u.socket).Emit("start", g)
	if g.Complete {
		(*u.socket).BroadcastTo(g.Room, "start", g)
	}
}

func (m MsgPlayer) process(u *User) {
	(*u.socket).Emit("msgplayer", m.Msg)
}

func (m MsgAll) process(u *User) {
	(*u.socket).Emit("msgall", m.Msg)
	(*u.socket).BroadcastTo(m.Room, "msgall", m.Msg)
}

type LobbyUsers struct {
	Room string
	List []LobbyUser
}

func (l LobbyUsers) process(u *User) {
	(*u.socket).Emit("updatelobby", l.List)
	(*u.socket).BroadcastTo(l.Room, "updatelobby", l.List)
}

type End struct {
	
}

type Terminate struct {
	
}

