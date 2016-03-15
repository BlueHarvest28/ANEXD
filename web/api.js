var express = require('express');
var http    = require('http');
var app     = express();
var server  = http.createServer(app);
var io      = require('socket.io').listen(server);
var mysql 	= require('mysql');

//Openshift setup
app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3002);
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || "localhost");

//Launch server
server.listen(app.get('port') ,app.get('ip'), function () {
    console.log("✔ Express server listening at %s:%d ", app.get('ip'),app.get('port'));
});

//Temporarily sending to ANEXD database
var credentials = {
	host     : 'p3plcpnl0650.prod.phx3.secureserver.net',
    user     : 'ANEXD_ADMIN',
    password : 'gn9-MVn-6Bq-q6b',
    database : 'ANEXD'
};

//Socket for lobbies
var lobbyio;

//Socket for games
var gameio;

//Instantiate Socket for website
io.on('connection', function(socket){
	console.log('IO connection', socket.id);
	socket.on('lobby', function(id){
		console.log('lobby request', id);
		lobbyio	= io.of('/' + id);
		lobby();
		socket.emit('lobby', true);
	});
	
	//Temporarily not-generic
	socket.on('quiz', function(quiz){
		postQuiz(quiz);
		socket.emit('quiz', true);
	});
	
	socket.on('quizzes', function(){
		getQuizzes(function(data){
			socket.emit('quizzes', data);
		});
	})
});

//Send a new quiz to the database
var postQuiz = function (quiz){
	quiz = JSON.stringify(quiz);
	var connection = mysql.createConnection(credentials);
	connection.query('INSERT INTO Quiz (data) VALUES (?)', quiz, function(err, result) {
		if(err) throw err;
		connection.end();
	});
}

var players = {};
var lobby = function(){
	lobbyio.on('connection', function(socket){
		console.log('Lobby connection', socket.id);
		
		socket.on('start', function(data){
			console.log('starting');
			lobbyio.emit('start');
			gameio = io.of('/' + data.lobby + '/' + data.app);
			//QUIZ
			if(data.app === 2){
				getQuiz();	
			}
			//IMAGE ANNOTATE
			else if(data.app === 14){
				imageAnnotate();	
			}
			//TANK GAME
			else if(data.app == 15){
				console.log('tank game')
				tankGame();
			}
		});
		
		socket.on('join', function(name){
			console.log('new user', name);
			players[socket.id] = {'id': socket.id, 'name': name, 'ready': false};
			//Place player into existing game
			if(running){
				socket.emit('start');
			}
			lobbyio.emit('update', players);
		});
		
		socket.on('ready', function (ready){
			players[socket.id].ready = ready;
			lobbyio.emit('update', players);
		});
		
		socket.on('leave', function(){
			console.log('disconnect', players[socket.id].name);
			socket.disconnect();
		})
		
		socket.on('leaveApp', function(player){
			player.disconnect();
		});
		
		socket.on('close', function(){
			players = {};
			lobbyio.emit('close');
			socket.disconnect();
		})
		
		socket.on('disconnect', function(){
			delete players[socket.id];
			lobbyio.emit('update', players);
		})
	});
};

/********************
*		QUIZ		*
*********************/
var users = {};
var userCount = -1;
var current = 0;
var running = false;

var data;
var questions;
var total;
var title;
var answers;

//Get a quiz
var getQuiz = function (callback){
	var connection = mysql.createConnection(credentials);
	connection.query('SELECT * FROM Quiz LIMIT 1', function(err, result) {
		if(err) throw err;
		connection.end();
		try {
			data = JSON.parse(result[0].data).data;
		} catch (e) {
			return console.error(e);
		}
		
		questions = data.questions;
		total = questions.length;
		title = {
			'title': data.title,
			'description': data.description,
			'total': total
		};
		answers = data.answers;
		//Launch game
		quiz();
	});
}

var quiz = function(){
	running = true;
	gameio.on('connection', function (socket) {
		console.log('Game connection', socket.id);

		userCount++;
		users[socket.id] = 0;
		gameio.emit('users', userCount);

		//Title details for front-end local storage
		socket.emit('title', title);
		
		socket.on('leave', function(){
			//lobbyio.emit('leaveApp', socket);
			socket.disconnect();
		});

		socket.on('disconnect', function(){
			userCount--;
			gameio.emit('users', userCount);
			delete users[socket.id];
		});

		if(current === 0){
			socket.emit('current', {'event': 'showStart'});
		}
		else if(current < total ){
			socket.emit('current', {'event': 'question', 'data': questions[current-1]});
		}
		else if(current > total){
			socket.emit('current', {'event': 'showEnd'});
		}

		socket.on('answer', function(answer){
			gameio.emit('answers');
			if(answer === answers[current-1]){
				users[socket.id]++;
				console.log('correct answer, score:', users[socket.id]);
				socket.emit('answer', true);
			}
			else {
				socket.emit('answer', false);
			}
		});

		socket.on('next', function (){
			if(current === total){
				current++;
				console.log('show end');
				socket.emit('next', true);
				gameio.emit('current', {'event': 'showEnd', 'data': users});
			} 
			else if(current < total){
				current++;
				var question = questions[current-1];	
				console.log('next question', current);
				socket.emit('next', true);
				gameio.emit('current', {'event': 'question', 'data': question});
			}
		});

		socket.on('previous', function (){
			if(current === 1){
				current--;
				console.log('show start');
				socket.emit('previous', true);
				gameio.emit('current', {'event': 'showStart'});	
			} 
			else if(current > 1){
				current--;
				var question = questions[current-1];	
				console.log('previous question', current);
				socket.emit('previous', true);
				gameio.emit('current', {'event': 'question', 'data': question});
			}
		});
	});
};

var imageAnnotate = function(){
	var imageURL;
	gameio.on('connection', function (socket) {
		console.log('Game connection on annotate', socket.id);
		
		if(imageURL){
			console.log('sending image', imageURL);
			socket.emit('image', imageURL);
		}
		
		socket.on('image', function(image){
			imageURL = image;
			gameio.emit('image', imageURL);
		});
		
		socket.on('drawing', function(coords){
			gameio.emit('drawing', coords);
		});
		
		socket.on('save', function(data){
			gameio.emit('save', data);
		});
		
		socket.on('undo', function(){
			gameio.emit('undo');
		});
		
		socket.on('leave', function(){
			socket.disconnect();
		});
	});
};

var tankGame = function(){
	//connect, disconnect, message, connection
	var players = {};
	var playerCount = 1;

	var host;
	gameio.on('connection', function (socket) { 
		console.log('connection!', socket.id)

		socket.on('ishost', function(){
			console.log('Host connection!', socket.id);
			host = socket;
		});

		socket.on('player', function(){
			console.log('player connection!', socket.id);
			players[socket.id] = playerCount;
			playerCount++;
		});

		socket.on('action', function(message){
			message.player = players[socket.id];
			console.log('action', message, socket.id);
			host.emit('action', message);
		});
		
		//not implemented
		socket.on('leave', function(){
			socket.disconnect();
		});
	});
};