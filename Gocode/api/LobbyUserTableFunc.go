package main

import (
    "log"
    "net/http"
	"encoding/json"
	"database/sql"
	"github.com/go-sql-driver/mysql"
	"math/rand"
	"time"
	"strings"
	"strconv"
)


//---------------------------------------------\\
//           LOBBY TABLE FUNCTIONS             \\
//---------------------------------------------\\

type Lobby struct {
	LobbyID int				 `json:"lobbyID"`
	// Title string			 `json:"title"`   deprecated
	Creator int				 `json:"creator"`
	Password sql.NullString  `json:"password"`
	Game int 				 `json:"game"`
	Size int				 `json:"size"`
}

func newLobby(w http.ResponseWriter, r *http.Request) {
	var queryString string = "INSERT INTO Lobby (creator,game,size,password) VALUES (?,?,?,?)"

	//Reading json from request
	params := requestDecode(r)
	var required = []string{"creator","game","size"}
	args := requiredVariables(required, params, nil)

	var response string
	
	//check for any valid args
	if len(args) != len(required) { //isEmpty
		response = jsonFail()
		writeJsonResponse(response, w)
		return
	}
	
	var randNum = newRandStr()
	
	unqiueRnd := true
	//Keep getting new rndNum till its doesn't exist
	for unqiueRnd {
		var queryRndStr string = "SELECT lobbyID FROM Lobby WHERE password = ?"
		var lobbyID int
		err := db.QueryRow(queryRndStr, randNum). Scan(&lobbyID)
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
	
	if sqlError, ok := err.(*mysql.MySQLError); ok {
		if sqlError.Number == 1062 {
			//user already exists
			response = jsonDupKey("Lobby", sqlError.Message)		
		}else{
			checkErr("Query Execute: ",err)
		}
	}else{
		var data = make(map[string]interface{})
			
		lastId, err := result.LastInsertId()
		checkErr("Getting LastInserted: ",err)
		log.Println(lastId)
		data["id"] = lastId	
		data["pass"] = randNum	
		
		rowCnt, err := result.RowsAffected()
		checkErr("Getting RowsAffected: ",err)
		
		if rowCnt == 1{
			//correctly changed the user
			// response = jsonAdded("Lobby", lastId)
			response = jsonAddedData("Lobby", data)
		}else if rowCnt < 1{
			//no change
			response = jsonFail()
		}else {
			//more than one row changed
			//SHOULDN'T HAPPEN BUT ...
			//ROLLBACK!!!!!
		}
	
	}
		
	writeJsonResponse(response, w)
	
	log.Printf("/newLobby has been excuted sucessfully!")
}

func getLobby(w http.ResponseWriter, r *http.Request) {
	var queryString string = "SELECT * FROM Lobby WHERE "

	//Reading json from request
	params := requestDecode(r)
	//technically can search on just size
	args := requiredVariables([]string{"lobbyID","creator","game"}, params, &queryString)
	
	var response string
	
	//check for any valid args
	if len(args) != 0 { //isEmpty
		response = jsonFail()
		writeJsonResponse(response, w)
		return
	}
	
	rows, err := db.Query(queryString, args...)
	switch{
		case err == sql.ErrNoRows:
				response = `{`+
					`"code" : 303, ` +
					`"status" : "fail",` +
					`"descript" : "Lobby doesnt exist"` +
				`}`
		case err != nil:
				log.Fatal("Query Execute: ",err)
				panic(err)
		default:
				var res []Lobby
				for rows.Next() {
					var lobby Lobby
					err = rows.Scan(&lobby.LobbyID, &lobby.Creator, &lobby.Password, &lobby.Game, &lobby.Size)
					checkErr("Row retrevial: ",err)
					
					res = append(res, lobby)
				}	
		
				b, err := json.Marshal(res)
				checkErr("Parsing data to json: ", err)	
				response = string(b)
    }
	defer rows.Close()
		
	writeJsonResponse(response, w)
	
	log.Printf("/getLobby has been excuted sucessfully!")
}

func changeLobbyData(w http.ResponseWriter, r *http.Request) {
	//Reading json from request
	params := requestDecode(r)	
		
	var changable = map[string]string{
		"title": "title",
		// "pass": "password",
		"size": "size",
	}
	
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

	var response string
	
	//check for any valid args
	if len(qVars) == 0 { //isEmpty
		response = jsonFail()
		writeJsonResponse(response, w)
		return
	}
	
	rem := len(qStrAdd)-2 //remove last ', '
	qStrAdd = qStrAdd[:rem] + " "//space so not =?WHERE
	
	
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

func delLobby(w http.ResponseWriter, r *http.Request) {
	var queryString string = "DELETE FROM Lobby WHERE lobbyID = ?"

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
		response = jsonDeleted("Lobby", params["lobbyID"].(float64))
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