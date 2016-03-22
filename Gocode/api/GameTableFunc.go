package main

import (
    "log"
    "net/http"
	"encoding/json"
	"database/sql"
	"github.com/go-sql-driver/mysql"
)


//---------------------------------------------\\
//            GAME TABLE FUNCTIONS             \\
//---------------------------------------------\\

type GameStuc struct {
	GameID  int				`json:"gameID, "`
	CreatorID int			`json:"creatorID"`
	Name string			 	`json:"name"`
	Date_created string		`json:"date_created"`
	Rating int  			`json:"rating"`
	Type string				`json:"type"`
	Description string		`json:"description"`
	Image string			`json:"image"`
}

func newGame(w http.ResponseWriter, r *http.Request) {
	//Reading json from request
	params := requestDecode(r)
	
	//check that creatorID = User.userID exists
	var queryExistString string = "SELECT userID FROM User WHERE userID = ?"
	var userID int
	err := db.QueryRow(queryExistString, params["creatorID"]).Scan(&userID)
	if err == sql.ErrNoRows{
		//game or creator doesn't exist
		writeJsonResponse(jsonFail(), w)
		return
	}else if err != nil{
		checkErr("Query execute: ",err)
	}
	
	var queryString string = "INSERT INTO Game (creatorID, name, date_created, rating, type, description, image) VALUES (?,?,NOW(),0,?,?,?)"
	
	args := requiredVariables([]string{"creatorID", "name", "type", "description", "image"}, params, nil)
	
	result, err := db.Exec(queryString, args...)
	// checkErr("Query Execute: ",err)
	
	var response string
	
	if sqlError, ok := err.(*mysql.MySQLError); ok {
		if sqlError.Number == 1062 {
			//game already exists			
			response = jsonDupKey("game", sqlError.Message)			
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
			//correctly changed the game
			response = jsonAdded("game", lastId)
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

func getGame(w http.ResponseWriter, r *http.Request){
	var queryString string = "SELECT * FROM Game WHERE "

	//Reading json from request
	params := requestDecode(r)
	
	args := requiredVariables([]string{"gameID", "creatorID", "name", "date_created", "rating", "type"}, params, &queryString)
	
	//check for any valid args
	if len(args) == 0 { //isEmpty
		writeJsonResponse(jsonFail(), w)
		return
	}
	
	rows, err := db.Query(queryString, args...)
	defer rows.Close()
	checkErr("Query execute: ", err)
	
	var res []GameStuc
	for rows.Next() {
		var game GameStuc
		
		err = rows.Scan(
			&game.GameID, 
			&game.CreatorID, 
			&game.Name, 
			&game.Date_created, 
			&game.Rating, 
			&game.Type, 
			&game.Description,
		)
		checkErr("Row retrevial: ",err)
		
		log.Println(game)
		
		res = append(res, game)
	}
	
	var response string
	if len(res) == 0 { //noRows
		response = jsonNtExist("Game")
		writeJsonResponse(response, w)
		return
	}			
	
	b, err := json.Marshal(res)
	checkErr("Parsing data to json: ", err)	
	response = string(b)
	// response = jsonGetDataMap("Game", response)
			
		
	writeJsonResponse(response, w)
	
	log.Printf("/getGame has been excuted sucessfully!")
}

func getAllGames(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT * FROM Game")
	checkErr("Query execute: ",err)
	defer rows.Close()
	
	var res []GameStuc
	for rows.Next() {
        var game GameStuc
		err = rows.Scan(
			&game.GameID,
			&game.CreatorID,
			&game.Name,
			&game.Date_created,
			&game.Rating,
			&game.Type,
			&game.Description,
		)
        checkErr("Row retrevial: ",err)
		
		res = append(res, game)
    }
	b, err := json.Marshal(res)
	checkErr("Parsing data to json: ", err)	
	
	response := string(b)
	writeJsonResponse(response, w)
	
	log.Printf("/getAllGameUsers has been excuted sucessfully!")
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
	rem := len(qStrAdd)-2 //remove last ', '
	qStrAdd = qStrAdd[:rem] + " "//space so not =?WHERE

	var response string
	
	//check for any valid args
	if len(qVars) == 0 { //isEmpty
		response = jsonFail()
		writeJsonResponse(response, w)
		return
	}
	
	
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
		//correctly changed the game
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