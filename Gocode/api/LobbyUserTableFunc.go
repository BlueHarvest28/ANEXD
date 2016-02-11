package main

import (
    "log"
    "net/http"
	"encoding/json"
	"database/sql"
	"github.com/go-sql-driver/mysql"
)


//---------------------------------------------\\
//           LOBBY TABLE FUNCTIONS             \\
//---------------------------------------------\\

type Lobby struct {
	LobbyID int				 `json:"lobbyID"`
	Title string			 `json:"title"`
	Creator int				 `json:"creator"`
	Password sql.NullString  `json:"password"`
	Game int 				 `json:"game"`
	Size int				 `json:"size"`
}

func newLobby(w http.ResponseWriter, r *http.Request) {
	var queryString string = "INSERT INTO Lobby (title,creator,game,size,password) VALUES (?,?,?,?,?)"

	//Reading json from request
	params := requestDecode(r)
	var required = []string{"title","creator","game","size","pass"}
	args := requiredVariables(required, params, nil)

	var response string

	//check for any valid args
	if len(args) == len(required) { //isEmpty
		response = jsonFail()
		writeJsonResponse(response, w)
		return
	}
	
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
		lastId, err := result.LastInsertId()
		checkErr("Getting LastInserted: ",err)
		log.Println(lastId)
		
		rowCnt, err := result.RowsAffected()
		checkErr("Getting RowsAffected: ",err)
		
		if rowCnt == 1{
			//correctly changed the user
			response = jsonAdded("Lobby", lastId)
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
	args := requiredVariables([]string{"lobbyID","title","creator","game","size"}, params, &queryString)
	
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
					err = rows.Scan(&lobby.LobbyID, &lobby.Title, &lobby.Creator, &lobby.Password, &lobby.Game, &lobby.Size)
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
		"pass": "password",
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