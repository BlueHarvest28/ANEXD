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

type Game struct {
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
	var queryString string = "INSERT INTO Game (creatorID, name, date_created, rating, type, description, image) VALUES (?,?,NOW(),0,?,?,?)"
	
	//Reading json from request
	params := requestDecode(r)
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
	//technically can search on just size
	args := requiredVariables([]string{"gameID", "creatorID", "name", "date_created", "rating", "type"}, params, &queryString)
	
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
					`"descript" : "Game doesnt exist"` +
				`}`
		case err != nil:
				log.Fatal("Query Execute: ",err)
				panic(err)
		default:
				var res []Game
				for rows.Next() {
					var game Game
					
					err = rows.Scan(&game.GameID, &game.CreatorID, &game.Name, &game.Date_created, &game.Rating, &game.Type, &game.Description, &game.Image)
					checkErr("Row retrevial: ",err)
					
					res = append(res, game)
				}	
		
				b, err := json.Marshal(res)
				checkErr("Parsing data to json: ", err)	
				response = string(b)
    }
	defer rows.Close()
		
	writeJsonResponse(response, w)
	
	log.Printf("/getGame has been excuted sucessfully!")
}

func getAllGames(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT * FROM Game")
	checkErr("Query execute: ",err)
	defer rows.Close()
	
	var res []Game
	for rows.Next() {
        var game Game
		err = rows.Scan(&game.GameID, &game.CreatorID, &game.Name, &game.Date_created, &game.Rating, &game.Type, &game.Description, &game.Image)
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