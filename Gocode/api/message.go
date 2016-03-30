package main

import (
	"fmt"
	"log"
	"encoding/json"
	"github.com/googollee/go-socket.io"
)

/******************************************************************************
	This file contains all functionality that is sent between the communication 
	channel instances of Lobby and the User structs that it is responsible for.
	
	All of the JSON encoding and Socket.IO events in this document match the 
	ANEXD 'Message Data Specification' document, included within our project 
	documentation.

	All structs here implement one of the following interfaces:
		MessageServer - A message sent to the application server.
		Command - A message sent to the lobby instance to execute operations.
		MessageUser - A message sent to a User within the lobby.
		
	There is a channel for each interface running for the respective 
	receipient, and using run time Polymorphism, the respective processing 
	function is implicit to the underlying struct, providing constant 
	time complexity to begin execution.
	
	All of the implemented functions are run in a new goroutine, providing them
	with their own thread, which upon completion of execution, leave no 
	remaining references to the struct instance, allowing it to be garbage 
	collected.
	
	This implementation significantly simplifies the main lobby and user code,
	and makes the implementation modular and easy to maintain (such as adding
	new functionality by adding a new interface implementation here).
******************************************************************************/

/*
	Interface type: For messages sent to the application server.
*/
type MessageServer interface {
	tcp(l *Lobby)
	socketio(l *Lobby)
}

/*
	An application specific message from a User.
*/
type MsgServer struct {
	Event string                    `json:"event"`
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
	(*l.socket).Emit("in", m)
}

/*
	Sends an event to the Application server with parameters for creating a new
	lobby instance.
*/
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
	(*l.socket).Emit("in", n)
}

/*
	Sends an event from the Host User to inform the Application server that 
	it has loaded the Application and is ready to communicate.
	Also implements Command (multiple interface implementation)
*/
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
	(*l.socket).Emit("in", la)
}

/*
	Sends an event to state that the Host has ended the session (so the
	server can run it's lobby end functionality)
*/
type End struct {
	Event string                    `json:"event"`
}

func (e End) tcp(l *Lobby) {
	jsonMsg, err := json.Marshal(e)
	if err != nil {
		log.Print(err)
		return
	}
	(*l.tcpConn).Write(jsonMsg)
}

func (e End) socketio(l *Lobby) {
	(*l.socket).Emit("in", e)
}

/*
	Interface type: Commands received by the lobby for accessing/changing 
	the lobby data structure.
*/
type Command interface {
	execute(l *Lobby)
}

/*
	Contains all potential fields in the three specified events received from 
	Application servers: "created", "msgplayer" and "msgall"
	Using omitempty, only required fields will be received, however this cannot
	be used for Player, as the 0 value for player is the 'empty' value - and 
	the value 0 might be intentional when a message needs to be sent to a lobby host.
*/
type ServerMessage struct {
	Event string                    `json:"event"`
	Player float64                  `json:"player"`
	Msg map[string]interface{}      `json:"msg,omitempty"`
}

func (s ServerMessage) execute(l *Lobby) {
	switch s.Event {
		case "msgplayer":
		l.command <- MsgPlayer{
			Player: int(s.Player),
			Msg: s.Msg,
		}
		case "msgall":
		l.command <- MsgAll{
			Msg: s.Msg,
		}
		case "created":
		l.command <- Created{}
	}
}

/*
	*** MsgPlayer, also implementing MessageUser type,
		uses multiple interface implementation and is used 
		Polymorphically in both the Command and MessageUser channels
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

/*
	*** MsgAll, also implementing MessageUser type,
		uses multiple interface implementation and is used 
		Polymorphically in both the Command and MessageUser channels
*/
type MsgAll struct {
	Room string
	Msg map[string]interface{}
}

func (m MsgAll) execute(l *Lobby) {
	m.Room = l.lobbyId
	l.users[0].send <- m
}

/*
	An Event for connecting an Application server over Socket.IO to the lobby.
*/
type ServerSocket struct {
	Socket *socketio.Socket
}

func (s ServerSocket) execute(l *Lobby) {
	if l.timeout != nil {
		if l.socket == nil {
			l.socket = s.Socket
			(*l.socket).Emit("connectlobby", true)
		}
		l.timeout <- false
	}
}

/*
	An event to instantiate a new desktop user as the host user of a lobby.
*/
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
	l.command <- Update{}
}

/*
	An event to attempt to add a new connecting mobile user to the lobby.
*/
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
	l.command <- Update{}
}

/*
	An event to force emit update for the list of users in the lobby.
*/
type Update struct {}

func (u Update) execute(l *Lobby) {
	l.updateLobby()
}

/*
	An event to attempt to prepare the Application server to begin the Application.
*/
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

/*
	Confirms success of a Lobby being created on the Application server.
*/
type Created struct {}

func (c Created) execute(l *Lobby) {
	if l.timeout != nil {
		l.timeout <- false
	}
}

/*
	Also implements MessageServer (multiple interface implementation)
	Sets the Lobby.started to true, locking the slice data structure 
	for removal of users.
*/
func (la Launch) execute(l *Lobby) {
	l.started = true
	la.Event = "launch"
	l.send <- la
}

/*
	Struct to execute the removal of a user from the lobby data structure.
	Caused by a leave or a kick event.
*/
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
	Interface type: Messages to be processed by a User instance.
*/
type MessageUser interface {
	process(u *User)
}

/*
	Emits the leave event to execute a soft leave.
*/
type Leave struct {}

func (l Leave) process(u *User) {
	(*u.socket).Emit("leave")//, "You have been removed from the lobby.")
	(*u.socket).Emit("disconnect")
}

/*
	Emits the application ID matching the one stored in the database.
*/
type GetAppId struct {
	Appid float64
}

func (g GetAppId) process(u *User) {
	(*u.socket).Emit("getappid", g.Appid)
}

/*
	Emits the reason why the user was kicked by the host.
*/
type Kicked struct {
	Reason string
}

func (k Kicked) process(u *User) {
	(*u.socket).Emit("kicked", k.Reason)
}

/*
	Emits the success response to the attempted kick to the host.
*/
type Kick struct {
	Response bool                   `json:"response"`
	Feedback string                 `json:"feedback"`
}

func (k Kick) process(u *User) {
	(*u.socket).Emit("kick", k)
}

/*
	Emits feedback for the operation of starting an Application on the 
	respective Application server.
*/
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

/*
	Struct used to Emit an update of users in the lobby, in a JSON array.
*/
type LobbyUsers struct {
	Room string
	List []LobbyUser
}

func (l LobbyUsers) process(u *User) {
	(*u.socket).Emit("updatelobby", l.List)
	(*u.socket).BroadcastTo(l.Room, "updatelobby", l.List)
}

/*
	*** MsgPlayer, also implementing Command type,
		uses multiple interface implementation and is used 
		Polymorphically in both the Command and MessageUser channels
*/
func (m MsgPlayer) process(u *User) {
	(*u.socket).Emit("msgplayer", m.Msg)
}

/*
	*** MsgAll, also implementing Command type,
		uses multiple interface implementation and is used 
		Polymorphically in both the Command and MessageUser channels
*/
func (m MsgAll) process(u *User) {
	(*u.socket).Emit("msgall", m.Msg)
	(*u.socket).BroadcastTo(m.Room, "msgall", m.Msg)
}