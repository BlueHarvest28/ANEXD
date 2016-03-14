package main

//ReadMe:
// When pushing to openshift make sure that ports are set to that
// which is commented out in the bottom. Also make sure that import
// os is umcommented
//
// For working locally do reverse of above so serve at localhost
// and run .exe for windows or other for linux/ OSX

//Salting and hashing info https://crackstation.net/hashing-security.htm#salt

//HTTP ERROR CODES
//http://www.andrewhavens.com/posts/20/beginners-guide-to-creating-a-rest-api/

//.------:ToDo:------.
// All quiers to do with backend??(James)
//
// + ADD rollback to failed insert statments
// + NEEDS TO BE TESTED: getLobby can return null if 2 fields dont match
// + change so all methods take map so can have custom vars so not username but user etc
// + make it so users can only get information about lobbies, players related to them.
// + del for all anon users by lobbyid
// + /changeXXData needs to pass all inputs used into return to the json response.

//.------:DONE:------.
// - test()
//
// - newUser()
// - getUser()
// - changeEmail()
// - changePassword()
// - changeUserData()
// - delUser()

// - insertNewAnonUsers()
// - getAnonUser()
// - delAnonUser()

// - newLobby()
// - getLobby()
// - newLobbyPassword()
// - newLobbyTitle()
// - delLobby()
//
// - newGame()
// - changeGameData()
// - getGame()
// - getAllGames()
//
// + make the random 6 digits password generator
// + added salt and pass hashing to backend
// + ADDING DELETE Lobbies, Anon and User.
//'------------------'

//.------:CURRENT WORK:------.
// + make getUser return with data same across REST API's
//
// + TOKEN'S need to be added to stop anyone using api
//'--------------------------'

import (
    "log"
    "net/http"
	"encoding/json"
	"database/sql"
	"github.com/gorilla/mux"
	"os"
	"fmt"
	"math/rand"
	"time"
	//james's imports
	"github.com/googollee/go-socket.io"
)

//For adding new apis - see main()
type Api struct {
	ReqType string
	Name string
	Method http.HandlerFunc
}

var db *sql.DB
var manager *Manager
var credentials string = "ANEXD_ADMIN:gn9-MVn-6Bq-q6b@tcp(p3plcpnl0650.prod.phx3.secureserver.net:3306)/ANEXD"

//.:TEST:.
//Test url to see if database connects
//GET localhost:8080/test
func test(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT userID, username, email FROM User")
	checkErr("Query execute: ",err)
	defer rows.Close()
	
	var res []UserStruc
	for rows.Next() {
        var user UserStruc
        err = rows.Scan(&user.UserID, &user.Username, &user.Email)
        checkErr("Row retrevial: ",err)
		
		res = append(res, user)
    }
	
	b, err := json.Marshal(res)
	checkErr("Parsing data to json: ", err)	
	
	// //--RESPONSE--
	response := string(b)
	writeJsonResponse(response, w)
	
	log.Printf("/test has been excuted sucessfully!")
}

//check for error and exists if finds one
func checkErr(place string, err error) {
    if err != nil {
		log.Println(place, err)
        //panic(err)
    }
}

//This is used for decoding request header
func requestDecode(r *http.Request) (map[string]interface{}) {
	decoder := json.NewDecoder(r.Body)
	var f interface{}   
	err := decoder.Decode(&f)
	checkErr("Decoding request: ",err)
	
	return f.(map[string]interface{})
}

//Go through the useable list vars and change query string accordingly
func requiredVariables(vars []string, params map[string]interface{}, qStr *string) ([]interface{}){
	var args []interface{}
	addAnd := qStr == nil
	
	for _, field := range vars{
		val, valid := params[field]
		if valid {
			if !addAnd {
				*qStr += field + " = ? AND "
			}
			args = append(args, val)
		}
	}
	
	if !addAnd {
		rem := len(*qStr)-4 //remove last 'AND '
		newstring := *qStr
		*qStr = newstring[:rem]
	}
	
	return args
}

func init(){
	rand.Seed(time.Now().UnixNano())
}

func main() {
	server, err := socketio.NewServer(nil)
	if err != nil {
		log.Fatal(err)
	}
	manager = newManager()
	server.On("connection", manager.sessionHandler)
	
	//Open database IMP:Doesnt open a connection
	// var err error
	db, err = sql.Open("mysql", credentials)
	checkErr("Database connection: ",err)
	
	err = db.Ping()
	checkErr("Database connection check: ", err)	
	
	apis := []Api{		
		Api{"GET", "/test", test},
	
		Api{"POST", "/newUser", newUser},
		Api{"POST", "/getUser", getUser},
		Api{"POST", "/login", login},
		Api{"POST", "/changePassword", changeUserData},
		Api{"POST", "/changeEmail", changeUserData},
		Api{"POST", "/changeUserData", changeUserData},
		Api{"POST", "/delUser", delUser},
		
		Api{"POST", "/newAnonUser", newAnonUsers},
		Api{"POST", "/getAnonUser", getAnonUser},
		Api{"POST", "/delAnonUser", delAnonUser},
		
		Api{"POST", "/newLobby", newLobby},
		Api{"POST", "/getLobby", getLobby},
		Api{"POST", "/changeLobbyPassword", changeLobbyData},
		Api{"POST", "/changeLobbySize", changeLobbyData},
		Api{"POST", "/delLobby", delLobby},
		
		Api{"POST", "/newGame", newGame},
		Api{"POST", "/changeGameData", changeGameData},
		Api{"POST", "/getGame", getGame},
		Api{"POST", "/getAllGames", getAllGames},
	}
	
	
	router := mux.NewRouter().StrictSlash(true)
    for _, api := range apis {
        router.
			Methods(api.ReqType).
            Path(api.Name).
            Handler(api.Method)
    }	
	
	router.Path("/socket.io/").Handler(server)
	// http.Handle("/socket.io/", server)

	//For deployment locally
	// log.Printf("API server is Running!")
    // log.Fatal(http.ListenAndServe(":8080", router))
	
	//For deployment on openshift
	bind := fmt.Sprintf("%s:%s", os.Getenv("OPENSHIFT_GO_IP"), os.Getenv("OPENSHIFT_GO_PORT"))
	http.Handle("/", &MyServer{router})
    log.Fatal(http.ListenAndServe(bind, nil))	
}

//http://stackoverflow.com/questions/12830095/setting-http-headers-in-golang
//This is for overwritting Mux headers to allow Access-Control-Headers
//So requests going out which browser would normally stop
type MyServer struct {
    r *mux.Router
}

func (s *MyServer) ServeHTTP(rw http.ResponseWriter, req *http.Request) {
    if origin := req.Header.Get("Origin"); origin != "" {
        rw.Header().Set("Access-Control-Allow-Origin", origin)
        rw.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		rw.Header().Set("Access-Control-Allow-Credentials", "true")
        rw.Header().Set("Access-Control-Allow-Headers",
            "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
    }
    // Stop here if its Preflighted OPTIONS request
    if req.Method == "OPTIONS" {
        return
    }
    // Lets Gorilla work
    s.r.ServeHTTP(rw, req)
}

//This is for the Salt generation
var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890")

func RandStringRunes(n int) string {
    b := make([]rune, n)
    for i := range b {
        b[i] = letterRunes[rand.Intn(len(letterRunes))]
    }
    return string(b)
}