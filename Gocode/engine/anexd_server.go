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
	http.Handle("/", http.FileServer(http.Dir("./anexdtest")))
	log.Println("Serving at localhost:5000...")
	log.Fatal(http.ListenAndServe(":5000", nil))
}