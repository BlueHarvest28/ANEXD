package main

import (
	"fmt"
	"log"
	"sync"
	"net/http"
	"encoding/json"
	"github.com/googollee/go-socket.io"
)

/*
	Enumerated constants for commands
*/
const (
	C_Leave = iota //0
	C_Kick = iota //1
	C_End = iota //2
)

type Lobby interface {
	SessionId() int
	AddAnonUser(id string, anon AnonUser) error
	RemoveAnonUser(id, reason string) error
	AnonUserById(id string) *AnonUser, bool
	CurrentUserCount() int
	emitAnonUserData() //return data in json format for front end
	setAnonUserReady(id int)
	sendHandler()
	receiveHandler()
	dataHandler()
}

type User interface {
	SetSession(s *Session)
	SetSocket(sock *socketio.Socket)
	Player() int
	SetPlayer(number int)
	Setup()
	sendHandler()
	receiveHandler()
}

type HostUser struct {
	userId int
	username string
	Sess *Session
	player int
	Send chan interface{}
	Receive chan interface{}
	socket *socketio.Socket
	socketId string
}

type AnonUser struct {
	//userId int //key to map to this user
	Nickname string
	Ready bool
	Sess *Session
	player int
	Send chan interface{}
	Receive chan interface{}
	socket *socketio.Socket
	socketId string
}

type Session struct {
	sync.RWMutex
	sessionId int
	game Game
	LobbyHost *HostUser
	userMap map[string]*AnonUser //int map changed
	PlayerMap []*User
	//PlayerMap map[int]*User
	Send chan interface{}
	Receive chan interface{}
	Data chan interface{}
	gameTCP *socketio.Socket
}

/*
	Structs used in websocket message processing
*/

type LobbyUser struct {
	Player   int    `json:"player"`
	Nickname string `json:"nickname"`
	Ready	 bool	`json:"ready"`
}

type SetReady struct {
	Nickname string `json:"nickname"`
	Ready    bool   `json:"ready"`
}

type RemovedUser struct {
	Nickname string
	Reason string
}

/*
	Cmd = Command consts
*/
type Command struct {
	Cmd int
	Data interface{}
}

/*
	Game table in DB will need URI and Port stored
*/
func newSession(g Game, sessId int, host *HostUser) (*Session, error) {
	//create websocket or TCP?
	//check error
	session := Session{
		sessionId = sessId,
		game: g,
		LobbyHost: host,
		userMap: make(map[string]*AnonUser),
		PlayerMap: make([]*User, 0, g.MaxUsers() + 1),
		//PlayerMap: make(map[int]*User, g.MaxUsers() + 1),
		Send: make(chan interface{}),
		Receive: make(chan interface{}),
		Data: make(chan interface{}),
		//gameTCP: appSock
	}
	host.SetSession(&session)
	host.SetPlayer(0)
	session.PlayerMap = append(session.PlayerMap, session.LobbyHost) //set index 0 as host
	//session.PlayerMap[0] = session.LobbyHost
	
	
	//run websocket messaging goroutine
	return &session, nil
}

func newHostUser(uId int, user string) (*HostUser, error) {

	hostUser := HostUser{
		userId = uId,
		username = user,
		Send: make(chan interface{}),
		Receive make(chan interface{})
	}
	return &hostUser, nil
}

func newAnonUser(nick string) *AnonUser {
	anon := AnonUser{
		nickname: nick,
		ready: false,
		Send: make(chan interface{}),
		Receive make(chan interface{})
	}
	return &anon
}

func (g Game) MaxUsers() int {
	return g.maxUsers
}

func (s Session) SessionId() int {
	return s.sessionId
}

/*
	Adds an anon user to the session, and sets user's pointer to the session
*/
func (s Session) AddAnonUser(id string, anon *AnonUser) error {
	s.Lock()
	defer s.Unlock()
	_, ok := s.userMap[id]
	if !ok {
		return errors.New("lobby: user already exists.")
	}
	if len(s.PlayerMap) >= cap(s.PlayerMap) {
		return errors.New("lobby: lobby is full.")
	}
	s.userMap[id] = anon
	s.PlayerMap = append(s.PlayerMap, anon)
	anon.SetPlayer(len(s.PlayerMap) - 1)
	anon.SetSession(&s)
	s.emitAnonUserData()
	return nil
}

func (s Session) RemoveAnonUser(id, reason string) error {
	s.Lock()
	defer s.Unlock()
	u, ok := s.userMap[id]
	if !ok {
		return errors.New("lobby: user does not exist.")
	}
	index := u.Player()
	//user, ok := s.PlayerMap[index]
	//if !ok {
		//return errors.New("removePlayer: no player found at index")
	//}
	//if u != user {
		//return errors.New("removePlayer: player does not match retrieved")
	//}
	//delete(s.PlayerMap, index)
	s.removePlayer(index)
	delete(s.userMap, id)
	var msg Command
	if reason == "" {
		msg.Cmd = C_Leave
	} else {
		msg.Cmd: C_Kick
		msg.Data: reason
	}
	u.Send <- msg
	s.emitAnonUserData()
	return nil
}

/*
	Removes a player from the PlayerMap slice - No Memory Leak:
	Example: Removing index 2 from: 			 [0][1][2][3][4]
										 Append: [0][1]   [3][4]
	Final memory block still has redundant data: [0][1][3][4][4]
							 Overwrite with nil: [0][1][3][4][nil]
*/
func (s Session) removePlayer(index int) {
	s.PlayerMap, s.PlayerMap[len(s.PlayerMap)-1] = append(s.PlayerMap[:index], s.PlayerMap[index+1:]), nil
	//Update all player numbers greater than deleted index
	for i := index; i < len(s.PlayerMap); i++ {
		user := s.PlayerMap[i]
		user.SetPlayer(i)
	}
}

func (s Session) AnonUserById(id string) *AnonUser, bool {
	a, ok := s.userMap[id]
	return a, ok
}

func (s Session) CurrentUserCount() int {
	return len(s.userMap)
}

/*
	Flip ready bool
*/
func (s Session) setAnonUserReady(n string, r bool) {
	s.Lock()
	defer s.Unlock()
	s.userMap[n].Ready = r
	s.emitAnonUserData()
}

func (s Session) emitAnonUserData() {
	var list []LobbyUser
	players := s.PlayerMap[1:] //slice out host index
	/*
	for i := 1; i < len(s.PlayerMap); i++ {
		p := s.PlayerMap[i]
		user := LobbyUser{
			Player: i,
			Nickname: p.Nickname
			Ready: p.Ready
		}
		list = append(list, user)
	}
	*/
	for _, p := range players {
		user := LobbyUser{
			Player: i,
			Nickname: p.Nickname,
			Ready: p.Ready
		}
		list = append(list, user)
	}
	s.LobbyHost.Send <- list
}


/*
	Main goroutine for handling messages to the game server
*/
func (s Session) sendHandler() {
	for {
		
	}
}

/*
	Main goroutine for handling messages from the game server
*/
func (s Session) receiveHandler() {
	for {
		
	}
}

/*
	Main goroutine for processing lobby commands
*/
func (s Session) dataHandler() {
	for {
		select {
			case data := <-s.Data:
			switch jsonType := data.(type) {
				case SetReady:
				s.setAnonUserReady(data.Nickname, data.Ready)
				case RemovedUser:
				err = s.RemoveAnonUser(data.Nickname, data.Reason)
				if err != nil {
					log.Panic(err)
				}
				default:
				log.Print("Session dataHandler: unknown type received")
			}
		}
	}
}

func (u HostUser) UserId() int {
	return u.userId
}

func (u HostUser) SetSession(s *Session) {
	u.Sess = s
}

func (u HostUser) SetSocket(sock *socketio.Socket) {
	u.socket = sock
}

func (u HostUser) Player() int {
	return u.player
}

/*
	Only to be called while Session is locked
*/
func (u HostUser) SetPlayer(number int) {
	u.player = number
}

/*
	Joins the user's socket namespace, and the session namespace
*/
func (u HostUser) Setup() {
	//u.socket.Join(u.username) //not necessary socket ID namespace
	u.socket.Join(fmt.Sprintf("%d", u.Sess.SessionId()))
	go u.sendHandler()
	u.receiveHandler()
}

/*
	Emits socket.io messages to the namespace
*/
func (u HostUser) sendHandler() {
	for {
		select {
			case msg := <-u.Send:
			switch dataType := data.(type) {
				case []LobbyUser:
				msg, err := json.Marshal(data)
				if err != nil {
					log.Panic(send lobby user list: error)
				}
				u.socket.BroadcastTo(fmt.Sprintf("%d", u.Sess.SessionId()), "updatelobby", msg)
				default:
				log.Print("HostUser sendHandler: unknown type received")
			}
		}
	}
}

/*
	Main goroutine for handling messages for host user
*/
func (u HostUser) receiveHandler() {
	//Tell server the applet has loaded and ready to communicate
	//Used to initially ping server and pass any preliminary host information
	u.socket.Of(fmt.Sprintf("/%s", u.socket.Id())).On("kick", func(msg interface{}) {
		var data RemovedUser
		err := json.Unmarshal(msg, &data)
		if err != nil {
			log.Panic(err)
		}
		u.Sess.Data <- ru
	})
	//Starts the session with all users set ready assigned as players
	//u.socket.Of(fmt.Sprintf("/%s", u.socket.Id())).On("start", func(msg interface{}) {
	//	u.Sess.Send <- msg
	//})
	//Host user forced disconnection
	u.socket.On("disconnection", func() {
		//host disconnected - pause application?
	})
}

func (u AnonUser) SetSession(s *Session) {
	u.Sess = s
}

func (u AnonUser) SetSocket(sock *socketio.Socket) {
	u.socket = sock
}

func (u AnonUser) Player() int {
	return u.player
}

/*
	Only to be called while Session is locked
*/
func (u AnonUser) SetPlayer(number int) {
	u.player = number
}

func (u AnonUser) Setup() {
	u.socket.Join(fmt.Sprintf("%d", u.Sess.SessionId()))
	go u.sendHandler()
	u.receiveHandler()
}

/*
	Main goroutine for handling messages for host user
*/
func (u AnonUser) sendHandler() {
	var namespace := fmt.Sprintf("/%s", u.socket.Id())
	for {
		select {
			case msg := <-u.Send:
			switch dataType := data.(type) {
				case Command:
				switch data.Cmd {
					case C_Leave:
					u.socket.Emit("disconnect")
					return
					case C_Kick:
					u.socket.Emit("kick", data.Data)
					u.socket.Emit("disconnect")
					return
					case C_End:
					return
					default:
					log.Print("AnonUser sendHandler: unknown command")
				}
				default:
					log.Print("AnonUser sendHandler: unknown type received")
			}
		}
	}
}

/*
	Sets all socket.io events for receiving emits from the AnonUser's device
*/
func (u AnonUser) receiveHandler() {
	//get and format this user's personal socket namespace i.e. "/012345"
	var namespace := fmt.Sprintf("/%s", u.socket.Id())
	//Toggle the ready bool in the lobby
	u.socket.Of(namespace).On("setready", func(msg interface{}) {
		var data SetReady
		err := json.Unmarshal(msg, &data)
		if err != nil {
			log.Panic(err)
		}
		u.Sess.Data <- data
	})
	//Leave the session (manual leave)
	u.socket.Of(namespace).On("leavelobby", func() {
		ru := RemovedUser{
			Nickname: u.Nickname
		}
		u.Sess.Data <- ru
	})
	/*Tell server the applet has loaded and ready to communicate
	u.socket.Of(namespace).On("loaded", func(msg interface{}) {
		u.Sess.Send <- msg
	})
	//Receive game data from player -> forwarded to game server channel
	u.socket.Of(namespace).On("in", func(msg interface{}) {
		u.Sess.Send <- msg
	})
	*/
	//Forced disconnection event
	u.socket.On("disconnection", func() {
		var msg Command
		msg.Cmd = C_End
		u.Send <- msg
	})
}