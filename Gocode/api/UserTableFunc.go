package main

import (
    "log"
    "net/http"
	"encoding/json"
	"database/sql"
	"github.com/go-sql-driver/mysql"
)

//---------------------------------------------\\
//            USER TABLE FUNCTIONS             \\
//---------------------------------------------\\

type User struct {
	UserID int		 `json:"userID"`
	Username string	 `json:"username"`
	Email string	 `json:"email"`
}

//POST
// example url:: localhost:3000/insertNewUser?username=xx&password=xx&email=xx
func newUser(w http.ResponseWriter, r *http.Request) {
	var queryString string = "INSERT INTO User (username,password,email) VALUES (?,?,?)"
	
	//Reading json from request
	params := requestDecode(r)
	var required = []string{"username","password","email"}
	args := requiredVariables(required, params, nil)
	
	var response string
	
	//check for any valid args
	if len(args) != len(required) { //isEmpty
		response = jsonFail()
		writeJsonResponse(response, w)
		return
	}	
	
	result, err := db.Exec(queryString, args...)
	// checkErr("Query Execute: ",err)
	
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
	
	log.Printf("/insertNewUser has been excuted sucessfully!")
}


//POST
//Examples:
//		url:: localhost:3000/getUser?username=xx&email=xx
//		url:: localhost:3000/getUser?username=xx
//		url:: localhost:3000/getUser?email=xx
// 		url:: localhost:3000/getUser?userID=xx
func getUser(w http.ResponseWriter, r *http.Request) {
	
	params := requestDecode(r)
	
	var queryString string = "SELECT userID, username, email FROM User WHERE "

	var required = []string{"username","email","userID"}
	args := requiredVariables(required, params, &queryString)

	
	var user User
	var response string
	
	//check for any valid args
	if len(args) == 0 { //isEmpty
		response = jsonFail()
		writeJsonResponse(response, w)
		return
	}
	
	err := db.QueryRow(queryString, args...).
			  Scan(&user.UserID, &user.Username, &user.Email)
	switch{
		case err == sql.ErrNoRows:
				response = `{`+
					`"code" : 303, ` +
					`"status" : "fail",` +
					`"descript" : "user doesnt exist"` +
				`}`
		case err != nil:
				log.Fatal("Query Execute: ",err)
				panic(err)
		default:
				b, err := json.Marshal(user)
				checkErr("Parsing data to json: ", err)	
				response = string(b)
    }
			
	writeJsonResponse(response, w)
	
	log.Printf("/getUser has been excuted sucessfully!")
}

func login(w http.ResponseWriter, r *http.Request) {
	
	params := requestDecode(r)
	
	var queryString string = "SELECT userID, username, email FROM User WHERE "

	var required = []string{"email","password"}
	args := requiredVariables(required, params, &queryString)

	
	var user User
	var response string
	
	//check for any valid args
	if len(args) == 0 { //isEmpty
		response = jsonFail()
		writeJsonResponse(response, w)
		return
	}
	
	err := db.QueryRow(queryString, args...).
			  Scan(&user.UserID, &user.Username, &user.Email)
	switch{
		case err == sql.ErrNoRows:
				response = `{`+
					`"code" : 303, ` +
					`"status" : "fail",` +
					`"descript" : "user doesnt exist"` +
				`}`
		case err != nil:
				log.Fatal("Query Execute: ",err)
				panic(err)
		default:
				b, err := json.Marshal(user)
				checkErr("Parsing data to json: ", err)	
				response = string(b)
    }
			
	writeJsonResponse(response, w)
	
	log.Printf("/login has been excuted sucessfully!")
}

func changeUserData(w http.ResponseWriter, r *http.Request) {
	//Reading json from request
	params := requestDecode(r)	
		
	var changable = map[string]string{
		"newpass": "password",
		"email": "email",
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
	
	
	// var queryString string = "UPDATE User SET password=? WHERE userID=? AND password=?"
	var queryString string = "UPDATE User SET " + qStrAdd + " WHERE userID=? AND password=?"
	
	var required = []string{"userID","password"}
	args := requiredVariables(required, params, nil)

	//check for any valid args
	if len(args) != len(required){ //has same args
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
		response = jsonChanged("Password")
	}else if rowCnt < 1{
		//no change
		response = jsonFail()
	}else {
		//more than one row changed
		//ROLLBACK!!!!!
	}
		
	writeJsonResponse(response, w)
	
	log.Printf("/changeUserData has been excuted sucessfully!")
}