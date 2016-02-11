package main

import (
    "log"
    "net/http"
	//"encoding/json"
	//"database/sql"
	"github.com/go-sql-driver/mysql"
)


//---------------------------------------------\\
//            GAME TABLE FUNCTIONS             \\
//---------------------------------------------\\
func newGame(w http.ResponseWriter, r *http.Request) {
	var queryString string = "INSERT INTO Game (creatorID, name, date_created, rating, type, description, image) VALUES (?,?,NOW(),0,?,?,?)"
	
	//Reading json from request
	params := requestDecode(r)
	args := requiredVariables([]string{"creatorID", "name", "type", "description", "image"}, params, nil)
	
	result, err := db.Exec(queryString, args...)
	// checkErr("Query Execute: ",err)
	
	var response string
	
	if sqlError, ok := err.(*mysql.MySQLError); ok {
		if sqlError.Number == 1062 {
			//user already exists			
			response = jsonDupKey("User", sqlError.Message)			
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
			response = jsonAdded("User", lastId)
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
	
	log.Printf("/newGame has been excuted sucessfully!")
}

func changeGameData(w http.ResponseWriter, r *http.Request) {
	//Reading json from request
	params := requestDecode(r)	
		
	var changable = map[string]string{//CHANGE HERE
		"name": "name",
		"rating": "rating",
		"type": "type",
		"des": "description",
		"img": "image",
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
	
	var queryString string = "UPDATE Game SET " + qStrAdd + " WHERE gameID=?"
	
	var required = []string{"gameID"}
	args := requiredVariables(required, params, nil)
	//check for any valid args
	if len(qVars) != len(required) { //isEmpty
		response = jsonFail()
		writeJsonResponse(response, w)
		return
	}
	
	args = append(qVars, args...)	
	
	result, err := db.Exec(queryString, args...)
	checkErr("Query Execute: ",err)
	
	// lastId, err := result.LastInsertId()
	// checkErr("Getting LastInserted: ",err)
	rowCnt, err := result.RowsAffected()
	checkErr("Getting RowsAffected: ",err)

	if rowCnt == 1{
		//correctly changed the user
		response = jsonChanged("Game Data was changed")
	}else if rowCnt < 1{
		//no change
		response = jsonFail()
	}else {
		//more than one row changed
		//ROLLBACK!!!!!
	}
		
	writeJsonResponse(response, w)
	
	log.Printf("/changeGameData has been excuted sucessfully!")
}