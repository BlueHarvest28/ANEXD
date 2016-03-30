package main

import (
    "log"
    "net/http"
	"math/rand"
	"time"
	"strings"
	"strconv"
	
	"database/sql"
)

type LobbyStuc struct {
	LobbyID int				 `json:"lobbyID"`
	// Title string			 `json:"title"`   deprecated
	Creator int				 `json:"creator"`
	LobIdentifier int 		 `json:"lobIdentifier"`
	Game int 				 `json:"game"`
	Size int				 `json:"size"`
}

type GameInstStuc struct {
	Url string 				`json:"url"`
	Port string 			`json:"port"`
	ConnType string 		`json:"connType"`
}

//Creates a new lobby which host games instance.
//1.   Checks for valid input data
//2.   Check lobby exists.
//2.2. Delete it.
//3.   Create the lobby.
//4.   Generate Random idenfier.
//5.   Call to Backend with fetching relevant data.
func newLobby(w http.ResponseWriter, r *http.Request) {
	//Reading json from request
	params := requestDecode(r)
	
	//1.check that game=Game.gameID and creator = User.userID exist
	var queryExistString string = "SELECT Game.gameID, User.userID FROM Game, User " +
								  "WHERE Game.gameID = ? AND User.userID = ?"
	var gameID, userID int
	err := db.QueryRow(queryExistString, params["game"], params["creator"]).Scan(&gameID, &userID)
	if err == sql.ErrNoRows{
		//game or creator doesn't exist
		writeJsonResponse(jsonFail(), w)
		return
	}else if err != nil{
		checkErr("Query execute: ",err)
	}
	
	//2.Check if lobby exists
	var lobbyId int
	err = db.QueryRow("SELECT lobbyId FROM Lobby WHERE creator = ?", params["creator"]).
			Scan(&lobbyId)
	switch{
		case err == sql.ErrNoRows:
			//do nothing
		case err != nil:
			log.Fatal("Query Execute: ",err)
			panic(err)
		default:
			//2.2 Lobby exists so delete it. 
			_, err := db.Exec("DELETE FROM Lobby WHERE lobbyId = ?", lobbyId)
			checkErr("Query Execute: ",err)
    }
	
	//3.Create the lobby
	var queryString string = "INSERT INTO Lobby (creator,game,size,lobbyID) VALUES (?,?,?,?)"

	var required = []string{"creator","game","size"}
	args := requiredVariables(required, params, nil)

	var response string
	
	//check for any valid args
	if len(args) != len(required) { //isEmpty
		response = jsonFail()
		writeJsonResponse(response, w)
		return
	}
		
	//4.Generate Random idenfier
	var randNum = newRandStr()
	
	unqiueRnd := true
	//Keep getting new rndNum till its doesn't exist
	for unqiueRnd {
		var queryRndStr string = "SELECT lobbyID FROM Lobby WHERE lobbyID = ?"
		var lobbyID int
		err := db.QueryRow(queryRndStr, randNum).Scan(&lobbyID)
		if err == sql.ErrNoRows{
			unqiueRnd = false
		}else if err != nil{
			checkErr("Query execute: ",err)
		}else {
			//gen new key
			randNum = newRandStr()
			log.Println("Needed New Rand")
		}
	}	
	args = append(args, randNum)
	
	result, err := db.Exec(queryString, args...)
	// checkErr("Query Execute: ",err)
	rowCnt, err := result.RowsAffected()
	checkErr("Getting RowsAffected: ",err)
	
	if rowCnt == 1{
		//5.Call to Backend with fetching relevant data.
	
		//get the game info for Engine
		queryString = "SELECT url, port, connType FROM Game WHERE gameID = ?"
		var game GameInstStuc
		err = db.QueryRow(queryString, params["game"]).Scan(
			&game.Url, 
			&game.Port,
			&game.ConnType,
		)
		checkErr("Query execute: ",err)
	
		var data = make(map[string]interface{})
			
		lastId, err := 	result.LastInsertId()
		checkErr("Getting LastInserted: ",err)
		log.Println(lastId)
		data["id"] = lastId	
		data["pass"] = randNum	
	
		//correctly changed the user
		response = jsonAddedData("Lobby", data)
		sizeInt, _ := strconv.Atoi(params["size"].(string))
		//call to Engine
		lobby := newSession(randNum, Game{
			connType: game.ConnType, 
			host: game.Url,
			port: game.Port,
			gameId: gameID,
			maxUsers: sizeInt,
		})
		err = manager.addLobby(lobby)
		if err != nil {
			log.Print(err)
		}
	}else if rowCnt < 1{
		//no change
		response = jsonFail()
	}else {
		//more than one row changed
		//SHOULDN'T HAPPEN BUT ...
		//ROLLBACK!!!!!
	}
		
	writeJsonResponse(response, w)
	
	log.Printf("/newLobby has been excuted sucessfully!")
}

//Gets any existing lobbies from the database.
func getLobby(w http.ResponseWriter, r *http.Request) {
	//Reading json from request
	params := requestDecode(r)

	var queryString string = "SELECT * FROM Lobby WHERE "
	args := requiredVariables([]string{"lobbyID","creator","game"}, params, &queryString)
	
	//check for any valid args
	if len(args) == 0 { //isEmpty
		writeJsonResponse(jsonFail(), w)
		return
	}	
	
	var lobby LobbyStuc
	var response string
		err := db.QueryRow(queryString, args...).
			  Scan(
				&lobby.LobbyID, 
				&lobby.Creator, 
				&lobby.LobIdentifier, 
				&lobby.Game, 
				&lobby.Size,
			  )
	switch{
		case err == sql.ErrNoRows:
			response = jsonNtExist("Lobby")
		case err != nil:
			log.Fatal("Query Execute: ",err)
			panic(err)
		default:
			response = jsonGetData("Lobby", lobby)
    }
		
	writeJsonResponse(response, w)
	
	log.Printf("/getLobby has been excuted sucessfully!")
}

//Allows any data in changable to be edited in the Lobby table.
func changeLobbyData(w http.ResponseWriter, r *http.Request) {
	//Reading json from request
	params := requestDecode(r)	
		
	//key == params name
	//val == database field name
	var changable = map[string]string{
		"title": "title",
		// "pass": "password",
		"size": "size",
	}
	
	//unqiue requiredVariables func
	var qVars []interface{}
	qStrAdd := ""
	var newVar string
	var valid bool
	for key, val := range changable {
		newVar, valid = params[key].(string)
		if valid {
			qStrAdd += val + "=?, "
			qVars = append(qVars, newVar)	
		}
	}
	rem := len(qStrAdd)-2 //remove last ', '
	qStrAdd = qStrAdd[:rem] + " "//space so not =?WHERE

	var response string
	
	//check for any valid args
	if len(qVars) == 0 { //isEmpty
		response = jsonFail()
		writeJsonResponse(response, w)
		return
	}

	
	var queryString string = "UPDATE Lobby SET " + qStrAdd + " WHERE lobbyID=?"
	
	var required = []string{"lobbyID"}
	args := requiredVariables(required, params, nil)
	//check for any valid args
	if len(args) != len(required) { //isEmpty
		response = jsonFail()
		writeJsonResponse(response, w)
		return
	}
	
	args = append(qVars, args...)	
	
	log.Println(queryString)
	log.Println(args)
	
	result, err := db.Exec(queryString, args...)
	checkErr("Query Execute: ",err)
	
	// lastId, err := result.LastInsertId()
	// checkErr("Getting LastInserted: ",err)
	rowCnt, err := result.RowsAffected()
	checkErr("Getting RowsAffected: ",err)

	if rowCnt == 1{
		//correctly changed the user
		response = jsonChanged("Lobby Data was changed")
	}else if rowCnt < 1{
		//no change
		response = jsonFail()
	}else {
		//more than one row changed
		//ROLLBACK!!!!!
	}
		
	writeJsonResponse(response, w)
	
	log.Printf("/changeLobbyData has been excuted sucessfully!")
}

//Will remove Lobby from the database.
//Can only use the lobIdentifier to do this.
func delLobby(w http.ResponseWriter, r *http.Request) {
	var queryString string = "DELETE FROM Lobby WHERE lobIdentifier = ?"

	//Reading json from request
	params := requestDecode(r)
	
	var response string

	result, err := db.Exec(queryString, params["lobbyID"])
	checkErr("Query Execute: ",err)
		
	// lastId, err := result.LastInsertId()
	// checkErr("Getting LastInserted: ",err)
	// log.Println(lastId)
	
	rowCnt, err := result.RowsAffected()
	checkErr("Getting RowsAffected: ",err)
	
	if rowCnt == 1{
		//correctly changed the user
		response = jsonDeleted("Lobby", params["lobbyID"])
	}else if rowCnt < 1{
		//no change
		response = jsonFail()
	}else {
		//more than one row changed
		//SHOULDN'T HAPPEN BUT ...
		//ROLLBACK!!!!!
	}
		
	writeJsonResponse(response, w)
	
	log.Printf("/delLobby has been excuted sucessfully!")
}

func newRandStr() (string){
	rand.NewSource(time.Now().UnixNano())
	rndSize := 999999
	rndInt := rand.Intn(rndSize)
	intStr := strconv.Itoa(rndInt)
	return strings.Repeat("0", 6-len(intStr)) + intStr
}