package main

import (
	"fmt"
	"log"
	"net/http"
	"github.com/googollee/go-socket.io"
)

func main() {
	fmt.Println("Running.")
	//nil uses ["polling", "websocket"] as default string array args
	server, err := socketio.NewServer(nil)
	if err != nil {
		log.Fatal(err)
	}
	manager := newManager()
	server.On("connection", manager.sessionHandler)
	
	http.Handle("/socket.io/", server)
}