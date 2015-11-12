var express    = require("express");
var mysql      = require('mysql');

//TABLES:
// User, Anon_User, Lobby & Game
// I dont think will access game directly will be done
// through the backend. the same may apply to Lobby.

// user
// loginUser
// logoutUser

// anonUser
// createUser & login

//DB credentials
var credentials = {
	connectionLimit: 100,
	host     : 'p3plcpnl0650.prod.phx3.secureserver.net',
    user     : 'ANEXD_ADMIN',
    password : 'gn9-MVn-6Bq-q6b',
    database : 'ANEXD'
};

var pool = mysql.createPool(
	credentials
);

var app = express();

//Test url to see if database connects
app.get("/test",function(req,res){
	
	pool.getConnection(function(err,connection){
		connection.query("Select * From User", function(err, rows, fields) {
			if (!err)
				console.log('The solution is: ', rows);
			else{
				connection.release();
				console.log('Error while performing Query.');
			}
		});
	});
  
});


//--------------------------------------------------------------------
// User table queries  /
//---------------------


// Create a user add them to database and log them in
// Eventually this will need to return the id of the added user
// This may also log them in when the loggedInField is added
// Check if username or email exists since unique database will return
app.get("/createUser",function(req,res){
	// req.params.name 	// req.params.pass 	// req.params.email
	var queryStr = "INSERT into User (username,password,email) VALUES(" +
		req.params.name + "," +
		req.params.pass + "," +
		req.params.email + "," +
	+")";
	
	pool.getConnection(function(err,connection){
		connection.query(queryStr, function(err, rows, fields) {
			if (!err){
				//console.log('The solution is: ', rows);
				//and return the id of new user.
				res.json({"code" : 100, "status" : "sucess"});
				console.log("Sucess! User added");
			}else{
				connection.release();
				console.log('Error while performing Query.');
				res.json({"code" : 303, "status" : "error"});
			}
		});
	});
  
});


// Get a user by an attribute and return whole row 
// NOT THE PASSWORD
// Ideally will be made to take one or more params
// to return the single row.
app.post("/getUser",function(req,res){
	// req.params.name 	// req.params.pass 	// req.params.email
	var queryStr = "SELECT * FROM User WHERE(" +
		"username=" + req.params.name + " AND" +
		"email=" + req.params.pass + " AND" +
		"userID=" + req.params.email +
	+")";
	
	pool.getConnection(function(err,connection){
		connection.query(queryStr, function(err, rows, fields) {
			if (!err){
				res.json({"code" : 100, "status" : "sucess"});
				console.log("Sucess! User added");
			}else{
				connection.release();
				console.log('Error while performing Query.');
				res.json({"code" : 303, "status" : "error"});
			}
		});
	});
  
});


// Change the user password
// will return sucess a new .
app.post("/changePassword",function(req,res){
	// req.params.name 	// req.params.pass 	// req.params.email
	var queryStr = "UPDATE User SET password=" + req.params.newpass + 
		"WHERE userID=" + req.params.userID +
		"AND password=" + req.params.oldpass;
	
	pool.getConnection(function(err,connection){
		connection.query(queryStr, function(err, rows, fields) {
			if (!err){
				res.json({"code" : 100, "status" : "sucess"});
				console.log("Sucess! Password has been changed");
			}else{
				connection.release();
				console.log('Error while performing Query.');
				res.json({"code" : 303, "status" : "error"});
			}
		});
	});
  
});


// Change the user email
// will return sucess.
app.get("/changeEmail",function(req,res){
	// req.params.name 	// req.params.pass 	// req.params.email
	var queryStr = "UPDATE User SET email=" + req.params.newemail + 
		"WHERE userID=" + req.params.userID +
		"AND password=" + req.params.pass;
	
	pool.getConnection(function(err,connection){
		connection.query(queryStr, function(err, rows, fields) {
			if (!err){
				res.json({"code" : 100, "status" : "sucess"});
				console.log("Sucess! Password has been changed");
			}else{
				connection.release();
				console.log('Error while performing Query.');
				res.json({"code" : 303, "status" : "error"});
			}
		});
	});
  
});


//--------------------------------------------------------------------
// Anon_User table queries  /
//--------------------------

// USERNAME AND LOBBYID IN DATABASE NEED TO BE COMPOSITE KEY

// Create a Anon user add them to database and log them in to the lobby
// This may also connect them via another field.
// Check if username and lobby exists since unique database will return
app.get("/createAnonUser",function(req,res){
	var queryStr = "SELECT lobbyID FROM Lobby WHERE" +
		"qrcode=" + req.params.code;
		// check if row count == 1 get lobby id
	
	var lobbyID = 0;//return of queryStr
	
	var queryStr2 = "INSERT into Anon_User (username, lobbyID) VALUES(" +
		req.params.name + ")";
		
	pool.getConnection(function(err,connection){	
		connection.query(queryStr, function(err, rows, fields) {
			if (!err){
				//console.log('The solution is: ', rows);
				//and return the id of new user.
				res.json({"code" : 100, "status" : "sucess"});
				console.log("Sucess! User added");
			}else{
				connection.release();
				console.log('Error while performing Query.');
				res.json({"code" : 303, "status" : "error"});
			}
		});
	});
  
});


//--------------------------------------------------------------------
// Lobby table queries  /
//--------------------------

// Create a Anon user add them to database and log them in to the lobby
// This may also connect them via another field.
// Check if username and lobby exists since unique database will return
app.get("/createLobby",function(req,res){
	var queryStr = "INSERT into Lobby (title,password,creator,game) VALUES(" +
		req.params.title + "," +
		req.params.pass + "," +
		req.params.creat + "," +
		req.params.game +
	+")";
	
	var lobbyID = 0;//return of queryStr
			
	pool.getConnection(function(err,connection){	
		connection.query(queryStr, function(err, rows, fields) {
			if (!err){
				//console.log('The solution is: ', rows);
				//and return the id of new user.
				res.json({"code" : 100, "status" : "sucess"});
				console.log("Sucess! User added");
			}else{
				connection.release();
				console.log('Error while performing Query.');
				res.json({"code" : 303, "status" : "error"});
			}
		});
	});
  
});

app.listen(3000);