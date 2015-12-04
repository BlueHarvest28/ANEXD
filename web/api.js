var express    = require("express");
var bodyParser = require('body-parser');
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

app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3002);
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");
app.use(bodyParser.json());//this is for parsing hearder in post req
  
// -:-:-:-:-:TEST QUERY:-:-:-:-:-
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
					"data": rows
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
	var queryStr = "INSERT INTO User SET ?";
	
	var params = {
		username: req.query.username,
		password: req.query.password,
		email: req.query.email,
	}
		
	pool.getConnection(function(err,connection){
		var query = connection.query(queryStr, params, function(err, result) {
			// console.log(query);
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


//-=-=-=-=-=-=-=-=-=-=-=-=-=-WORKS-=-=-=-=-=-=-=-=-=-=-=-=-=

// TODO:
// - DO NOT RETURN THE PASSWORD

// Get a user by an attribute and return whole row 
// NOT THE PASSWORD
// Ideally will be made to take one or more params

// example url:: localhost:3000/getUser?username=xx&email=xx
// example url:: localhost:3000/getUser?username=xx
// example url:: localhost:3000/getUser?email=xx
app.get("/getUser",function(req,res){
	var queryStr = "SELECT * FROM User WHERE ?";
	
	var keys = Object.keys(req.query);
	
	if(keys.indexOf("password") != -1 && keys.length > 1){//password exists and have another field
		res.json({"code" : 303, "status" : "error", "descript": "cannot search on password"});
		return;
	}
	
	var params = [];
	for(var i = 0; i<keys.length;i++){
		var key = keys[i];

		var pair = {};		
		pair[key] = req.query[key];

		params.push(pair);
		if(i+1 != keys.length)
			queryStr += " AND ?";
	}
		
	pool.getConnection(function(err,connection){
		var query = connection.query(queryStr, params, function(err, rows, fields) {
			// console.log(query);
			connection.release();
						
			console.log("Query res: ", rows);
			
			var jsonContent = {};
			if(rows.length > 0){
				jsonContent = {
					"code" : 100, 
					"status" : "sucess",
					"data" : rows
				};
			}else{
				jsonContent = {
					"code" : 303, 
					"status" : "fail",
					"descript" : "user doesnt exist"
				};
			}
			if (!err){
				res.json(jsonContent);
				console.log("Sucess! Query getUser executed res: ", rows);
			}else{
				console.log('Error while performing Query.');
				res.json({"code" : 303, "status" : "error"});
			}
		});
	});
  
});


//-=-=-=-=-=-=-=-=-=-=-=-=-=-WORKS-=-=-=-=-=-=-=-=-=-=-=-=-=

// Change the user password
// will return sucess a new.

// example url:: localhost:3000/changePassword?oldpass=xx&newpass=xx
app.post("/changePassword",function(req,res){
	
	//check passwords dont match
	if( (req.body.newpass).valueOf() == (req.body.oldpass).valueOf()){
		res.json({"code" : 303, "status" : "error", "descript": "passwords are the same"});
		console.log("Passwords are the same!!");
		return;
	}
	
	var queryStr = "UPDATE User SET password=? WHERE userID=? AND password=?";
	
	var params = [
		req.body.newpass,
		req.body.userID,
		req.body.oldpass
	];
	
	pool.getConnection(function(err,connection){
		var query = connection.query(queryStr, params, function(err, result) {
			// console.log(query);
			connection.release();
			
			if(result.changedRows > 0){
				var jsonContent = {
					"code" : 100, 
					"status" : "sucess",
					"descript" : "Sucess! Password has been changed",
					"affectedRows" : result.changedRows
				};
			}else{
				var jsonContent = {
					"code" : 303, 
					"status" : "fail",
					"descript" : "information didnt match"
				};
			}
			if (!err){
				res.json(jsonContent);
				console.log("Sucess! Query changePassword executed res: ", result);
			}else{
				console.log('Error while performing Query.');
				res.json({"code" : 303, "status" : "error"});
			}
		});
	});
  
});


//-=-=-=-=-=-=-=-=-=-=-=-=-=-WORKS-=-=-=-=-=-=-=-=-=-=-=-=-=

// Change the user email
// will return sucess.
// example url:: localhost:3000/changeEmail?userID=xx&pass=xx&newemail=xx
app.get("/changeEmail",function(req,res){
	var queryStr = "UPDATE User SET email=? WHERE userID=? AND password=?";
		
	var params = [
		req.query.newemail, 
		req.query.userID,
		req.query.pass
	];
	
	pool.getConnection(function(err,connection){
		var query = connection.query(queryStr, params, function(err, result) {
			// console.log(query);
			connection.release();
			
			//if rows > 2 bad error need to roll back!!!
			if(result.changedRows > 0 && result.changedRows < 2){
				var jsonContent = {
					"code" : 100, 
					"status" : "sucess",
					"descript" : "Sucess! Email has been changed",
					"affectedRows" : result.changedRows
				};
			}else{
				var jsonContent = {
					"code" : 303, 
					"status" : "fail",
					"descript" : "Fail! Information didn't match"
				};
			}
			
			if (!err){
				res.json(jsonContent);
				console.log("Sucess! Query changeEmail executed res: ", result);
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
// example url:: localhost:3000/insertNewAnonUsers?username=xx&lobby=xx
app.get("/insertNewAnonUsers",function(req,res){
	var queryStr = "INSERT into Anon_User (username, lobbyID) VALUES ?";
		
	pool.getConnection(function(err,connection){	
		var query =connection.query(queryStr, req.query, function(err, result) {
			// console.log(query);
			connection.release();
			
			if (!err){
				//and return the id of new user.
				res.json({"code" : 100, "sucess": "User added.", "userID": result.insertId});
				console.log("Sucess! Query insertNewAnonUsers excuted res: ", result);
			}else{
				//check is username has been used.
				if(err.code == 'ER_DUP_ENTRY'){
					console.log('Duplication error.');
					res.json({"code" : 303, "status" : "error",
					"descript": "username exists!!"});
				}else{
					console.log('Error while performing Query.', err);
					res.json({"code" : 303, "status" : "error"});
				}
			}
		});
	});
  
});


//-=-=-=-=-=-=-=-=-=-=-=-=-=-WORKS-=-=-=-=-=-=-=-=-=-=-=-=-=

// Get a anon_user by either lobby or there id and return whole row 

// getting by lobbyID will return more than one user!!!

// example url:: localhost:3000/getAnonUser?lobby=xx
// example url:: localhost:3000/getAnonUser?userID=xx
app.get("/getAnonUser",function(req,res){
	var queryStr = "SELECT * FROM Anon_User WHERE ?";
	
	var keys = Object.keys(req.query);
	
	// MIGHT NOT BE NEEDED!!!!!
	// This stops using other fileds other than lobby and userID and not together
	// if( (keys.indexOf("lobby") == -1 || keys.indexOf("userID") == -1) || keys.length < 2){//password exists and have another field
		// res.json({"code" : 303, "status" : "error", "descript": "cannot search on those fields"});
		// return;
	// }
		
	var params = [];
	for(var i = 0; i<keys.length;i++){
		var key = keys[i];

		var pair = {};		
		pair[key] = req.query[key];

		params.push(pair);
		if(i+1 != keys.length)
			queryStr += " AND ?";
	}
		
	pool.getConnection(function(err,connection){
		var query = connection.query(queryStr, params, function(err, rows, fields) {
			// console.log(query);
			connection.release();
			
			var jsonContent = {};
			if(rows.length > 0){
				jsonContent = {
					"code" : 100, 
					"status" : "sucess",
					"data" : rows
				};
			}else{
				jsonContent = {
					"code" : 303, 
					"status" : "fail",
					"descript" : "Anon_User doesnt exist"
				};
			}
			if (!err){
				res.json(jsonContent);
				console.log("Sucess! Query getUser executed res: ", rows);
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

console.log('The API server is running.')

app.listen(3000);