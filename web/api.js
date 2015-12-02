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

// ::CHANGES::
// FOREIGN KEY (game) REFERENCES Game(gameID) 

// GOOD PRACTICE ---- TO IMPLEMENT

// .:SQL ESCAPE:.
// connection.query('SELECT * FROM `books` WHERE `author` = ?', ['David'], function (error, results, fields) {
  // // error will be an Error if one occurred during the query
  // // results will contain the results of the query
  // // fields will contain information about the returned results fields (if any)
// });

//.:GET ID BACK:.
// connection.query('INSERT INTO posts SET ?', {title: 'test'}, function(err, result) {
  // if (err) throw err;

  // console.log(result.insertId);
// });

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
			connection.release();
			if (!err){
				console.log('The solution is: ', rows);
				res.json({
					"code" : 100, 
					"status" : "Sucess",
					rows: rows
					});
			}else{
				console.log('Error while performing Query.');
			}
		});
	});
  
});


//--------------------------------------------------------------------
// User table queries  /
//---------------------


//-=-=-=-=-=-=-=-=-=-=-=-=-=-WORKS-=-=-=-=-=-=-=-=-=-=-=-=-=

// Create a user add them to database and log them in
// Eventually this will need to return the id of the added user
// This may also log them in when the loggedInField is added
// Check if username or email exists since unique database will return
// example url:: localhost:3000/insertNewUser?username=xx&password=xx&email=xx
app.get("/insertNewUser",function(req,res){
	// req.params.name 	// req.params.pass 	// req.params.email
	var queryStr = "INSERT INTO User SET ?";
	
	var params = {
		username: req.query.username,
		password: req.query.password,
		email: req.query.email,
	}
		
	pool.getConnection(function(err,connection){
		connection.query(queryStr, params, function(err, result) {
			connection.release();
			
			if (!err){
				//and return the id of new user.
				res.json({"sucess": "User added.", "userID": result.insertId});
				console.log("Sucess! User added");
			}else{
				
				if(err.code == 'ER_DUP_ENTRY'){
					console.log('Duplication error.');
					res.json({"code" : 303, "status" : "error",
					"descript": "username or email exists!!"});
				}else{
					console.log('Error while performing Query.', err);
					res.json({"code" : 303, "status" : "error", "err": err});
				}
			}
		});
	});
  
});

//TODO:
// to return the single row. so if just email will return row where email matches

// Get a user by an attribute and return whole row 
// NOT THE PASSWORD
// Ideally will be made to take one or more params
// example url:: localhost:3000/getUser?username=xx&password=xx&email=xx
app.post("/getUser",function(req,res){
	var queryStr = "SELECT * FROM User WHERE ?";
	
	//REQUEST IS NOT CHECKED!!!!
	//SHOULD JUST CHECK KEYS MATCH username userid or email
	
	pool.getConnection(function(err,connection){
		connection.query(queryStr, req, function(err, rows, fields) {
			connection.release();
			if(rows.length > 0){
				var jsonContent = {
					"code" : 100, 
					status : "sucess",
					data : rows[0]
				};
			}else{
				var jsonContent = {
					"code" : 303, 
					status : "fail",
					descript: "user doesnt exist"
				};
			}
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
		" WHERE userID=" + req.params.userID +
		" AND password=" + req.params.oldpass;
	
	pool.getConnection(function(err,connection){
		connection.query(queryStr, function(err, rows, fields) {
			connection.release();
			if(rows.RowDataPacket.length > 0){
				var jsonContent = {
					"code" : 100, 
					status : "sucess",
					data : rows.RowDataPacket[0]
				};
			}else{
				var jsonContent = {
					"code" : 303, 
					status : "fail",
					descript: "user doesnt exist"
				};
			}
			if (!err){
				res.json({"code" : 100, "status" : "sucess"});
				console.log("Sucess! Password has been changed");
			}else{
				console.log('Error while performing Query.');
				res.json({"code" : 303, "status" : "error"});
			}
		});
	});
  
});


// Change the user email
// will return sucess.
// example url:: localhost:3000/changeEmail?userID=xx&pass=xx&newemail=xx
app.get("/changeEmail",function(req,res){
	// req.params.name 	// req.params.pass 	// req.params.email
	var queryStr = "UPDATE User SET email=" + req.params.newemail + 
		"WHERE userID=" + req.params.userID +
		"AND password=" + req.params.pass;
	
	pool.getConnection(function(err,connection){
		connection.query(queryStr, function(err, rows, fields) {
			connection.release();
			if (!err){
				res.json({"code" : 100, "status" : "sucess"});
				console.log("Sucess! Password has been changed");
			}else{
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
// example url:: localhost:3000/createAnonUser?username=xx&lobby=xx
app.get("/createAnonUser",function(req,res){
	var queryStr = "INSERT into Anon_User (username, lobbyID)" +
	" VALUES(" + req.params.username + ", " + req.params.lobby + ")";
		
	pool.getConnection(function(err,connection){	
		connection.query(queryStr, function(err, rows, fields) {
			connection.release();
			if (!err){
				//console.log('The solution is: ', rows);
				//and return the id of new user.
				res.json({"code" : 100, "status" : "sucess"});
				console.log("Sucess! User added");
			}else{
				console.log('Error while performing Query.');
				res.json({"code" : 303, "status" : "error"});
			}
		});
	});
  
});


//--------------------------------------------------------------------
// Lobby table queries  /
//--------------------------

// Create a Lobby add them to database and log them in to the lobby
// This may also connect them via another field.
// Check if username and lobby exists since unique database will return
// example url:: localhost:3000/createLobby?title=xx&creator=xx&pass=xx&game=xx
app.get("/createLobby",function(req,res){
	var queryStr = "INSERT into Lobby (title,password,creator,game)" +
        " VALUES(" +
		req.params.title + "," +
		req.params.pass + "," +
		req.params.creat + "," +
		req.params.game +
	+")";
	
	var lobbyID = 0;//return of queryStr
			
	pool.getConnection(function(err,connection){	
		connection.query(queryStr, function(err, rows, fields) {
			connection.release();
			if (!err){
				//console.log('The solution is: ', rows);
				//and return the id of new user.
				res.json({"code" : 100, "status" : "sucess"});
				console.log("Sucess! User added");
			}else{
				console.log('Error while performing Query.');
				res.json({"code" : 303, "status" : "error"});
			}
		});
	});
  
});

app.listen(3000);