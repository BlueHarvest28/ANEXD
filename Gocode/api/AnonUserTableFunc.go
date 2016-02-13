package main

import (
    "log"
    "net/http"
	"encoding/json"
	"database/sql"
	"github.com/go-sql-driver/mysql"
)

//---------------------------------------------\\
//         ANON_USER TABLE FUNCTIONS           \\
//---------------------------------------------\\

type Anon_User struct {
	UserID int		 `json:"userID"`
	Username string	 `json:"username"`
	Lobby int		 `json:"lobby"`
}

//NOT TESTED
func newAnonUsers(w http.ResponseWriter, r *http.Request) {
	var queryString string = "INSERT INTO Anon_User (username,lobby) VALUES (?,?)"

	//Reading json from request
	params := requestDecode(r)
	
	var required = []string{"username","lobby"}
	args := requiredVariables(required, params, nil)
	
	var response string
	
	//check for any valid args
	if len(args) != len(required) { //has same args
		response = jsonFail()
		writeJsonResponse(response, w)
		return
	}
	
	result, err := db.Exec(queryString, args...)
	// checkErr("Query Execute: ",err)
	
	
	if sqlError, ok := err.(*mysql.MySQLError); ok {
		if sqlError.Number == 1062 {
			//user already exists
			response = jsonDupKey("Anon User", sqlError.Message)		
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
			response = jsonAdded("Anon User", lastId)
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
	
	log.Printf("/insertNewAnonUser has been excuted sucessfully!")
}

// example url:: localhost:3000/getAnonUser?lobbyID=xx
// example url:: localhost:3000/getAnonUser?creator=xx
func getAnonUser(w http.ResponseWriter, r *http.Request) {
	var queryString string = "SELECT * FROM Anon_User WHERE "
	
	//Reading json from request
	params := requestDecode(r)
	args := requiredVariables([]string{"userID","username","lobby"}, params, &queryString)
	
	var response string
	
	//check for any valid args
	if len(args) == 0 { //isEmpty
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
				var res []Anon_User
				for rows.Next() {
					var anon Anon_User
					err = rows.Scan(&anon.UserID, &anon.Username, &anon.Lobby)
					checkErr("Row retrevial: ",err)
					
					res = append(res, anon)
				}	
		
				b, err := json.Marshal(res)
				checkErr("Parsing data to json: ", err)	
				response = string(b)
    }
	defer rows.Close()
		
	writeJsonResponse(response, w)
	
	log.Printf("/getLobby has been excuted sucessfully!")
}

func delAnonUser(w http.ResponseWriter, r *http.Request) {
	var queryString string = "DELETE FROM Anon_User WHERE userID = ?"

	//Reading json from request
	params := requestDecode(r)
	
	var response string

	result, err := db.Exec(queryString, params["userID"])
	checkErr("Query Execute: ",err)
		
	// lastId, err := result.LastInsertId()
	// checkErr("Getting LastInserted: ",err)
	// log.Println(lastId)
	
	rowCnt, err := result.RowsAffected()
	checkErr("Getting RowsAffected: ",err)
	
	if rowCnt == 1{
		//correctly changed the user
		response = jsonDeleted("Anon_User", params["userID"].(float64))
	}else if rowCnt < 1{
		//no change
		response = jsonFail()
	}else {
		//more than one row changed
		//SHOULDN'T HAPPEN BUT ...
		//ROLLBACK!!!!!
	}
		
	writeJsonResponse(response, w)
	
	log.Printf("/delAnonUser has been excuted sucessfully!")
}