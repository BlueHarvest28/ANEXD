package main

import (
    "log"
    "net/http"
	"crypto/md5"
	"encoding/hex"
	"time"
	"strconv"
	
	"database/sql"
	"github.com/go-sql-driver/mysql"
)


type UserStruc struct {
	UserID int		 `json:"userID"`
	Username string	 `json:"username"`
	Email string	 `json:"email"`
}

//Will create new User in the database.
//With there salt.
func newUser(w http.ResponseWriter, r *http.Request) {
	var queryString string = "INSERT INTO User (username,password,email,passwordSalt) " + 
							 "VALUES (?,?,?,?)"
	
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
	
	passwordSalt := RandStringRunes(8)
	
	hashed := md5.Sum([]byte(args[1].(string) + passwordSalt))
	hashedVal:= hex.EncodeToString(hashed[:])
	args[1] = hashedVal
	
	args = append(args, passwordSalt)
	
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

//Gets any existing user(s) from the database.
func getUser(w http.ResponseWriter, r *http.Request) {
	
	params := requestDecode(r)
	
	var queryString string = "SELECT userID, username, email FROM User WHERE "

	var required = []string{"username","email","userID"}
	args := requiredVariables(required, params, &queryString)

	
	var user UserStruc
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
			response = jsonNtExist("User")
		case err != nil:
			log.Fatal("Query Execute: ",err)
			panic(err)
		default:
			response = jsonGetData("user", user)
    }
			
	writeJsonResponse(response, w)
	
	log.Printf("/getUser has been excuted sucessfully!")
}

//Similar to get but requires userId and password.
func login(w http.ResponseWriter, r *http.Request) {
	
	params := requestDecode(r)
	
	//Get salt 
	var passSalt string
	var querySaltString string = "SELECT passwordSalt FROM User WHERE email = ?"
	err := db.QueryRow(querySaltString, params["email"]).Scan(&passSalt)
	switch{
		case err == sql.ErrNoRows:
			res := jsonNtExist("User")
			writeJsonResponse(res, w)
			return
		case err != nil:
			log.Fatal("Query Execute: ",err)
			panic(err)
		default:
			//make the hask	
			hashed := md5.Sum([]byte(params["password"].(string) + passSalt))
			hashedVal:= hex.EncodeToString(hashed[:])
			params["password"] = hashedVal
    }
	
	
	var queryString string = "SELECT userID, username, email FROM User WHERE "

	var required = []string{"email","password"}
	args := requiredVariables(required, params, &queryString)

	
	var user UserStruc
	var response string
	
	//check for any valid args
	if len(args) == 0 { //isEmpty
		response = jsonFail()
		writeJsonResponse(response, w)
		return
	}
	
	err = db.QueryRow(queryString, args...).
			  Scan(&user.UserID, &user.Username, &user.Email)
	switch{
		case err == sql.ErrNoRows:
			response = jsonNtExist("User")
		case err != nil:
			log.Fatal("Query Execute: ",err)
			panic(err)
		default:
			data := make(map[string]interface{})
			// hashId := addLogged() //add to response
			// data["cookie"] = hashId
			data["data"] = user
			response = jsonGetData("user", data)
    }
			
	writeJsonResponse(response, w)
	
	log.Printf("/login has been excuted sucessfully!")
}

//Allows any data in changable to be edited in the User table.
//With the password changing will need to grab the salt and apply.
func changeUserData(w http.ResponseWriter, r *http.Request) {
	//Reading json from request
	params := requestDecode(r)	
	
	//Get salt 
	var passSalt string
	var querySaltString string = "SELECT passwordSalt FROM User WHERE userID = ?"
	err := db.QueryRow(querySaltString, params["userID"]).Scan(&passSalt)
	switch{
		case err == sql.ErrNoRows:
			res := jsonNtExist("User")
			writeJsonResponse(res, w)
			return
		case err != nil:
			log.Fatal("Query Execute: ",err)
			panic(err)
		default:
			//make the hash
			hashed := md5.Sum([]byte(params["password"].(string) + passSalt))
			hashedVal:= hex.EncodeToString(hashed[:])
			params["password"] = hashedVal
    }
	newPassHash := md5.Sum([]byte(params["newpass"].(string) + passSalt))
	newHashedVal := hex.EncodeToString(newPassHash[:])
	params["newpass"] = newHashedVal
	
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
	rem := len(qStrAdd)-2 //remove last ', '
	qStrAdd = qStrAdd[:rem] + " "//space so not =?WHERE
	
	
	//check for any valid args
	if len(qVars) == 0 { //isEmpty
		writeJsonResponse(jsonFail(), w)
		return
	}
	
	
	
	var queryString string = "UPDATE User SET " + qStrAdd + " WHERE userID=? AND password=?"
	
	var required = []string{"userID","password"}
	args := requiredVariables(required, params, nil)

	//check for any valid args
	if len(args) != len(required){ //has same args
		writeJsonResponse(jsonFail(), w)
		return
	}
	
	args = append(qVars, args...)	
	
	result, err := db.Exec(queryString, args...)
	checkErr("Query Execute: ",err)
	
	// lastId, err := result.LastInsertId()
	// checkErr("Getting LastInserted: ",err)
	rowCnt, err := result.RowsAffected()
	checkErr("Getting RowsAffected: ",err)

	var response string
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

//Will remove User from the database.
//Can only use the userId to do this.
func delUser(w http.ResponseWriter, r *http.Request) {
	var queryString string = "DELETE FROM User WHERE userID = ?"

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
		response = jsonDeleted("User", params["userID"])
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

//gen cookie key
func addLogged() (string) {	
	hashed := md5.Sum([]byte(strconv.FormatInt(time.Now().UnixNano(), 10) + "ANEXD_S@1t"))
	hash:= hex.EncodeToString(hashed[:])
	
	good := true
	
	//ensure no hash collisions.
	for good {
		_, ok := logged[hash] 
		if !ok {
			good = false
		}
	}
	logged[hash] = time.Now().UnixNano()
	return hash
}

//check cookie key
func checkLogged(hash string) (bool) {
	curTime := time.Now().UnixNano()
	if logged[hash] + int64(48 * time.Hour) < curTime {
		// cookie is valid 
		logged[hash] = curTime //update time
		return true
	}else {
		// cookie isnt valid
		delete(logged, hash)
		jsonBadCookie()
		return false
	}
}