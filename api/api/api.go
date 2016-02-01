package main

//run old api node ../../GitHub/ANEXD/web/api.js

//HTTP ERROR CODES
//http://www.andrewhavens.com/posts/20/beginners-guide-to-creating-a-rest-api/

//Using Marshel vs Encode
// json.Decoder   - is used when reading and writing
//				    to HTTP connections, WebSockets, or files.
// json.Unmarshal - is used when the input is []byte
//
// http://stackoverflow.com/questions/21197239/decoding-json-in-golang-using-json-unmarshal-vs-json-newdecoder-decode

// result.LastInsertId only works for inserts otherwise use rows affected.


// PUSHING TO OPENSHIFT
//--------------------------------------------------
// git clone ssh://56af8b9a0c1e66c6e90002a2@api-anexd.rhcloud.com/~/git/api.git/
// cd api/
// This will create a folder with the source code of your application. After making a change, add, commit, and push your changes.

// git add .
// git commit -m 'My changes'
// git push


//.------:ToDo:------.
// - insertNewAnonUsers()
// - getAnonUser()

// - newLobby()
// - getLobby()
// - newLobbyPassword()
// - newLobbyTitle()
//
// + there are more need to work out what they are!!
// + ADD rollback to failed insert statments
// + make things in func's to make more readable
// + to make the insert check for username and email 
// seperatly 2x queries will be needed
// + getLobby can return null if 2 fields dont match
// + no checks if ID's from other tables exist
// + lastId not returning get /n instead

//.------:DONE:------.
// - test()
// - insertNewUser()
// - getUser()
// - changeEmail()
// - changePassword()
//'------------------'

//.------:CURRENT WORK:------.
// - insertNewAnonUsers()
// - getAnonUser()
//'--------------------------'

import (
    "fmt"
    "log"
    "net/http"
	"encoding/json"
	"database/sql"
	"github.com/go-sql-driver/mysql"
	"github.com/gorilla/mux"
	//"strings"
)

//For adding new apis - see main()
type Api struct {
	ReqType string
	Name string
	Method http.HandlerFunc
}

var db *sql.DB
var credentials string = "ANEXD_ADMIN:gn9-MVn-6Bq-q6b@tcp(p3plcpnl0650.prod.phx3.secureserver.net:3306)/ANEXD"

//-------------------------------\\
// -:-:-:-:-:TEST QUERY:-:-:-:-:-\\
//-------------------------------\\
//Test url to see if database connects
//GET localhost:8080/test
func test(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT userID, username, email FROM User")
	checkErr("Query execute: ",err)
	defer rows.Close()
	
	var res []User
	for rows.Next() {
        var user User
        err = rows.Scan(&user.UserID, &user.Username, &user.Email)
        checkErr("Row retrevial: ",err)
		
		res = append(res, user)
    }
	
	b, err := json.Marshal(res)
	checkErr("Parsing data to json: ", err)	
	
	// //--RESPONSE--
	response := string(b)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "%v", response)
	
	log.Printf("/test has been excuted sucessfully!")
}

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
func insertNewUser(w http.ResponseWriter, r *http.Request) {
	//Reading json from request
	decoder := json.NewDecoder(r.Body)
	var f interface{}   
	err := decoder.Decode(&f)
	checkErr("Decoding request: ",err)
	
	params := f.(map[string]interface{})
	
	var queryString string = "INSERT INTO User (username,password,email) VALUES (?,?,?)"

	useVars := []string{"username","password","email"}//useable fields
	var args []interface{}
	
	for _, field := range useVars{
		val, valid := params[field]
		if valid {
			args = append(args, val)
		}
	}
	
	result, err := db.Exec(queryString, args...)
	// checkErr("Query Execute: ",err)
	
	var response string
	
	if sqlError, ok := err.(*mysql.MySQLError); ok {
		if sqlError.Number == 1062 {
			//user already exists
			response = `{`+
				`"code" : 303, `+
				`"status" : "fail",`+
				`"descript" : "Fail! Duplicate Key user exists",`+
				`"reason" : "` + sqlError.Message + `"` +
			`}`			
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
			response = `{` +
				`"code" : 100, `+
				`"status" : "sucess",`+
				`"descript" : "Sucess! Password has been changed",`+
				`"userID" : "` + string(lastId) + `"` +
			`}`
		}else if rowCnt < 1{
			//no change
			response = `{`+
				`"code" : 303, `+
				`"status" : "fail",`+
				`"descript" : "Fail! Information didn't match"`+
			`}`
		}else {
			//more than one row changed
			//SHOULDN'T HAPPEN BUT ...
			//ROLLBACK!!!!!
		}
	
	}
		
	//--RESPONSE--	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "%v", response)
	
	log.Printf("/insertNewUser has been excuted sucessfully!")
}


//POST
//Examples:
//		url:: localhost:3000/getUser?username=xx&email=xx
//		url:: localhost:3000/getUser?username=xx
//		url:: localhost:3000/getUser?email=xx
// 		url:: localhost:3000/getUser?userID=xx
func getUser(w http.ResponseWriter, r *http.Request) {
	//Reading json from request
	decoder := json.NewDecoder(r.Body)
	var f interface{}   
	err := decoder.Decode(&f)
	checkErr("Decoding request: ",err)
	
	params := f.(map[string]interface{})
	
	var queryString string = "SELECT userID, username, email FROM User WHERE "

	useVars := []string{"username","email","userID"}//useable fields
	var args []interface{}
	
	for _, field := range useVars{
		val, valid := params[field]
		if valid {
			queryString += field + " = ? AND "
			args = append(args, val)
		}
	}
	rem := len(queryString)-4 //remove last 'AND '
	queryString = queryString[:rem]
	
	var user User
	var response string
	err = db.QueryRow(queryString, args...).
			  Scan(&user.UserID, &user.Username, &user.Email)
	switch{
		case err == sql.ErrNoRows:
				log.Printf("No user with that ID.")
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
		
	//--RESPONSE--	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "%v", response)
	
	log.Printf("/getUser has been excuted sucessfully!")
}


//POST
//Example - url:: localhost:3000/changePassword?oldpass=xx&newpass=xx&userID=xx
func changePassword(w http.ResponseWriter, r *http.Request) {
	//Reading json from request
	decoder := json.NewDecoder(r.Body)
	var f interface{}   
	err := decoder.Decode(&f)
	checkErr("Decoding request: ",err)
	
	params := f.(map[string]interface{})
	
	var queryString string = "UPDATE User SET password=? WHERE userID=? AND password=?"

	useVars := []string{"newpass","userID","oldpass"}//useable fields
	var args []interface{}
	
	for _, field := range useVars{
		val, valid := params[field]
		if valid {
			args = append(args, val)
		}
	}
	
	result, err := db.Exec(queryString, args...)
	checkErr("Query Execute: ",err)
	
	// lastId, err := result.LastInsertId()
	// checkErr("Getting LastInserted: ",err)
	rowCnt, err := result.RowsAffected()
	checkErr("Getting RowsAffected: ",err)

	var response string
	if rowCnt == 1{
		//correctly changed the user
		response = `{` +
			`"code" : 100, `+
			`"status" : "sucess",`+
			`"descript" : "Sucess! Password has been changed"`+
		`}`
	}else if rowCnt < 1{
		//no change
		response = `{`+
			`"code" : 303, `+
			`"status" : "fail",`+
			`"descript" : "Fail! Information didn't match"`+
		`}`
	}else {
		//more than one row changed
		//ROLLBACK!!!!!
	}
		
	//--RESPONSE--	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "%v", response)
	
	log.Printf("/changePassword has been excuted sucessfully!")
}


//POST
//Note - mabye this should be a POST since passing password through URL
//Example - url:: localhost:3000/changeEmail?userID=xx&pass=xx&email=xx
// where email is the new email
func changeEmail(w http.ResponseWriter, r *http.Request) {
	//FOR TESTING
	//old email Rickey_Ortiz@vida.biz
	//new email alex@is.testing
	
	//Reading json from request
	decoder := json.NewDecoder(r.Body)
	var f interface{}   
	err := decoder.Decode(&f)
	checkErr("Decoding request: ",err)
	
	params := f.(map[string]interface{})
	
	var queryString string = "UPDATE User SET email=? WHERE userID=? AND password=?"

	useVars := []string{"email","userID","password"}//useable fields
	var args []interface{}
	
	for _, field := range useVars{
		val, valid := params[field]
		if valid {
			args = append(args, val)
		}
	}
	
	result, err := db.Exec(queryString, args...)
	checkErr("Query Execute: ",err)
	
	// lastId, err := result.LastInsertId()
	// checkErr("Getting LastInserted: ",err)
	rowCnt, err := result.RowsAffected()
	checkErr("Getting RowsAffected: ",err)

	var response string
	if rowCnt == 1{
		//correctly changed the user
		response = `{` +
			`"code" : 100, `+
			`"status" : "sucess",`+
			`"descript" : "Sucess! Email has been changed",`+
			`"affectedRows" : result.changedRows`+
		`}`
	}else if rowCnt < 1{
		//no change
		response = `{`+
			`"code" : 303, `+
			`"status" : "fail",`+
			`"descript" : "Fail! Information didn't match"`+
		`}`
	}else {
		//more than one row changed
		//ROLLBACK!!!!!
	}
		
	//--RESPONSE--	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "%v", response)
	
	log.Printf("/changeEmail has been excuted sucessfully!")
}

//---------------------------------------------\\
//         ANON_USER TABLE FUNCTIONS           \\
//---------------------------------------------\\

//NOT TESTED
func insertNewAnonUsers(w http.ResponseWriter, r *http.Request) {
	//Reading json from request
	decoder := json.NewDecoder(r.Body)
	var f interface{}   
	err := decoder.Decode(&f)
	checkErr("Decoding request: ",err)
	
	params := f.(map[string]interface{})
	
	var queryString string = "INSERT INTO Anon_User (username,lobby) VALUES (?,?)"

	useVars := []string{"username","lobby"}//useable fields
	var args []interface{}
	
	for _, field := range useVars{
		val, valid := params[field]
		if valid {
			args = append(args, val)
		}
	}
	
	result, err := db.Exec(queryString, args...)
	// checkErr("Query Execute: ",err)
	
	var response string
	
	if sqlError, ok := err.(*mysql.MySQLError); ok {
		if sqlError.Number == 1062 {
			//user already exists
			response = `{`+
				`"code" : 303, `+
				`"status" : "fail",`+
				`"descript" : "Fail! Duplicate Key user exists",`+
				`"reason" : "` + sqlError.Message + `"` +
			`}`			
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
			response = `{` +
				`"code" : 100, `+
				`"status" : "sucess",`+
				`"descript" : "Sucess! Password has been changed",`+
				`"userID" : "` + string(lastId) + `"` +
			`}`
		}else if rowCnt < 1{
			//no change
			response = `{`+
				`"code" : 303, `+
				`"status" : "fail",`+
				`"descript" : "Fail! Information didn't match"`+
			`}`
		}else {
			//more than one row changed
			//SHOULDN'T HAPPEN BUT ...
			//ROLLBACK!!!!!
		}
	
	}
		
	//--RESPONSE--	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "%v", response)
	
	log.Printf("/insertNewAnonUser has been excuted sucessfully!")
}
func getAnonUser(w http.ResponseWriter, r *http.Request) {
	
}


//---------------------------------------------\\
//           LOBBY TABLE FUNCTIONS             \\
//---------------------------------------------\\

type Lobby struct {
	LobbyID int		 `json:"lobbyID"`
	Title string	 `json:"title"`
	Creator int		 `json:"creator"`
	Password sql.NullString  `json:"password"`
	Game int 		 `json:"game"`
	Size int		 `json:"size"`
}

//POST
//Example - url:: localhost:3000/newLobby?title=xx&creator=xx&pass=xx&game=xx&size=xx
func newLobby(w http.ResponseWriter, r *http.Request) {
	//Reading json from request
	decoder := json.NewDecoder(r.Body)
	var f interface{}   
	err := decoder.Decode(&f)
	checkErr("Decoding request: ",err)
	
	params := f.(map[string]interface{})
	
	var queryString string = "INSERT INTO Lobby (title,creator,game,size) VALUES (?,?,?,?)"

	useVars := []string{"title","creator","game","size"}//useable fields
	var args []interface{}
	
	for _, field := range useVars{
		val, valid := params[field]
		if valid {
			args = append(args, val)
		}
	}
	
	result, err := db.Exec(queryString, args...)
	// checkErr("Query Execute: ",err)
	
	var response string
	
	if sqlError, ok := err.(*mysql.MySQLError); ok {
		if sqlError.Number == 1062 {
			//user already exists
			response = `{`+
				`"code" : 303, `+
				`"status" : "fail",`+
				`"descript" : "Fail! Duplicate Key user exists",`+
				`"reason" : "` + sqlError.Message + `"` +
			`}`			
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
			response = `{` +
				`"code" : 100, `+
				`"status" : "sucess",`+
				`"descript" : "Sucess! Lobby has been changed",`+
				`"userID" : "` + string(lastId) + `"` +
			`}`
		}else if rowCnt < 1{
			//no change
			response = `{`+
				`"code" : 303, `+
				`"status" : "fail",`+
				`"descript" : "Fail! Information didn't match"`+
			`}`
		}else {
			//more than one row changed
			//SHOULDN'T HAPPEN BUT ...
			//ROLLBACK!!!!!
		}
	
	}
		
	//--RESPONSE--	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "%v", response)
	
	log.Printf("/newLobby has been excuted sucessfully!")
}

// Examples:
// 		url:: localhost:3000/getLobby?title=xx&creator
// 		url:: localhost:3000/getLobby?title=xx&creator=xx&pass=xx&game=xx
// 		url:: localhost:3000/getLobby?pass=xx&game=xx
func getLobby(w http.ResponseWriter, r *http.Request) {
	//Reading json from request
	decoder := json.NewDecoder(r.Body)
	var f interface{}   
	err := decoder.Decode(&f)
	checkErr("Decoding request: ",err)
	
	params := f.(map[string]interface{})
	
	var queryString string = "SELECT * FROM Lobby WHERE "

	useVars := []string{"lobbyID","title","creator","game","size"}//useable fields
	var args []interface{}
	
	for _, field := range useVars{
		val, valid := params[field]
		if valid {
			queryString += field + " = ? AND "
			args = append(args, val)
		}
	}
	rem := len(queryString)-4 //remove last 'AND '
	queryString = queryString[:rem]
	
	var response string
	
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
		
	//--RESPONSE--	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "%v", response)
	
	log.Printf("/getLobby has been excuted sucessfully!")
}

// example url:: localhost:3000/newLobbyPassword?password=xx&lobbyID=xx
func newLobbyPassword(w http.ResponseWriter, r *http.Request) {
	//Reading json from request
	decoder := json.NewDecoder(r.Body)
	var f interface{}   
	err := decoder.Decode(&f)
	checkErr("Decoding request: ",err)
	
	params := f.(map[string]interface{})
	
	var queryString string = "UPDATE Lobby SET password=? WHERE lobbyID=?"

	useVars := []string{"password","lobbyID"}//useable fields
	var args []interface{}
	
	for _, field := range useVars{
		val, valid := params[field]
		if valid {
			args = append(args, val)
		}
	}
	
	result, err := db.Exec(queryString, args...)
	checkErr("Query Execute: ",err)
	
	// lastId, err := result.LastInsertId()
	// checkErr("Getting LastInserted: ",err)
	rowCnt, err := result.RowsAffected()
	checkErr("Getting RowsAffected: ",err)

	var response string
	if rowCnt == 1{
		//correctly changed the user
		response = `{` +
			`"code" : 100, `+
			`"status" : "sucess",`+
			`"descript" : "Sucess! Title has been changed"`+
		`}`
	}else if rowCnt < 1{
		//no change
		response = `{`+
			`"code" : 303, `+
			`"status" : "fail",`+
			`"descript" : "Fail! Information didn't match"`+
		`}`
	}else {
		//more than one row changed
		//ROLLBACK!!!!!
	}
		
	//--RESPONSE--	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "%v", response)
	
	log.Printf("/newLobbyPassword has been excuted sucessfully!")
}

func newLobbyTitle(w http.ResponseWriter, r *http.Request) {
	//Reading json from request
	decoder := json.NewDecoder(r.Body)
	var f interface{}   
	err := decoder.Decode(&f)
	checkErr("Decoding request: ",err)
	
	params := f.(map[string]interface{})
	
	var queryString string = "UPDATE Lobby SET title=? WHERE lobbyID=?"

	useVars := []string{"title","lobbyID"}//useable fields
	var args []interface{}
	
	for _, field := range useVars{
		val, valid := params[field]
		if valid {
			args = append(args, val)
		}
	}
	
	result, err := db.Exec(queryString, args...)
	checkErr("Query Execute: ",err)
	
	// lastId, err := result.LastInsertId()
	// checkErr("Getting LastInserted: ",err)
	rowCnt, err := result.RowsAffected()
	checkErr("Getting RowsAffected: ",err)

	var response string
	if rowCnt == 1{
		//correctly changed the user
		response = `{` +
			`"code" : 100, `+
			`"status" : "sucess",`+
			`"descript" : "Sucess! Title has been changed"`+
		`}`
	}else if rowCnt < 1{
		//no change
		response = `{`+
			`"code" : 303, `+
			`"status" : "fail",`+
			`"descript" : "Fail! Information didn't match"`+
		`}`
	}else {
		//more than one row changed
		//ROLLBACK!!!!!
	}
		
	//--RESPONSE--	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "%v", response)
	
	log.Printf("/newLobbyTitle has been excuted sucessfully!")
}

func checkErr(place string, err error) {
    if err != nil {
		log.Fatal(place, err)
        panic(err)
    }
}

func main() {
	//Open database IMP:Doesnt open a connection
	var err error
	db, err = sql.Open("mysql", credentials)
	checkErr("Database connection: ",err)
	
	err = db.Ping()
	checkErr("Database connection check: ", err)
	
	apis := []Api{		
		Api{"GET", "/test", test},
	
		Api{"POST", "/insertNewUser", insertNewUser},
		Api{"POST", "/getUser", getUser},
		Api{"POST", "/changePassword", changePassword},
		Api{"POST", "/changeEmail", changeEmail},
		
		Api{"POST", "/insertNewAnonUsers", insertNewAnonUsers},
		Api{"POST", "/getAnonUser", getAnonUser},
		
		Api{"POST", "/newLobby", newLobby},
		Api{"POST", "/getLobby", getLobby},
		Api{"POST", "/newLobbyPassword", newLobbyPassword},
		Api{"POST", "/newLobbyTitle", newLobbyTitle},
	}
	
	
	router := mux.NewRouter().StrictSlash(true)
    for _, api := range apis {
        router.
			Methods(api.ReqType).
            Path(api.Name).
            Handler(api.Method)
    }	

	log.Printf("API server is Running!")
	
	//For local testing purposes
    log.Fatal(http.ListenAndServe(":8080", router))
	
	// //For deployment on openshift
	// bind := fmt.Sprintf("%s:%s", os.Getenv("OPENSHIFT_GO_IP"), os.Getenv("OPENSHIFT_GO_PORT"))
    // log.Fatal(http.ListenAndServe(bind, r))	
}