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

//Get all quizes
var getQuizzes = function (callback){
	var connection = mysql.createConnection(credentials);
	connection.query('SELECT * FROM Quiz', function(err, result) {
		if(err) throw err;
		connection.end();
		try {
			console.log(result[0].data);
			
			callback(JSON.parse(result[0].data));
		} catch (e) {
			return console.error(e);
		}
	});
}

var players = {};
var lobby = function(){
	lobbyio.on('connection', function(socket){
		console.log('Lobby connection', socket.id);
		
		socket.on('start', function(data){
			lobbyio.emit('start');
			gameio = io.of('/' + data.lobby + '/' + data.app);
			game();
		});
		
		socket.on('join', function(name){
			console.log('new user', name);
			players[socket.id] = {'id': socket.id, 'name': name, 'ready': false};
			lobbyio.emit('update', players);
		});
		
		socket.on('ready', function (ready){
			players[socket.id].ready = ready;
			lobbyio.emit('update', players);
		});
		
		socket.on('leave', function(){
			console.log('disconnect', players[socket.id].name);
			if(players[socket.id]){
				delete players[socket.id];	
			}
			socket.disconnect();
			lobbyio.emit('update', players);
		})
		
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

var questions = [
	{
		'number': 1,
		'question' : 'When was the first recorded UFO sighting?',
		'answers': [
			{
				'id': 'A',
				'answer': '1947'
			},
			{
				'id': 'B',
				'answer': '1912',
			},
			{
				'id': 'C',
				'answer': '1982',
			},
			{
				'id': 'D',
				'answer': '2026',
			},
		]
	},
	{
		'number': 2,
		'question' : 'What is the term for an identified UFO?',
		'answers': [
			{
				'id': 'A',
				'answer': 'No-FO'
			},
			{
				'id': 'B',
				'answer': 'IFO'
			},
			{
				'id': 'C',
				'answer': 'We-Know-FO',
			},
			{
				'id': 'D',
				'answer': 'CFO',
			},
		]
	},
	{
		'number': 3,
		'question' : 'According to a 1991 Roper poll, how many people claim to have been abducted?',
		'answers': [
			{
				'id': 'A',
				'answer': '7.5',
			},
			{
				'id': 'B',
				'answer': '1 million',
			},
			{
				'id': 'C',
				'answer': '500,000',
			},
			{
				'id': 'D',
				'answer': '4 million',
			},
		]
	},
	{
		'number': 4,
		'question' : 'The first alien abduction claimed to have happened in 1961 when Betty and Barney Hill said they were taken from where?',
		'answers': [
			{
				'id': 'A',
				'answer': 'A road in New Hampshire, New England',
			},
			{
				'id': 'B',
				'answer': 'General Lee\'s discount cutlery in San Jose, California',
			},
			{
				'id': 'C',
				'answer': 'A farm in Hudspeth County, Texas',
			},
			{
				'id': 'D',
				'answer': 'A forest in Douglas, Wisconsin',
			},
		]
	},
	{
		'number': 5,
		'question' : 'What percentage of reported UFO sightings remain unexplained?',
		'answers': [
			{
				'id': 'A',
				'answer': '0-5%',
			},
			{
				'id': 'B',
				'answer': '5-10%',
			},
			{
				'id': 'C',
				'answer': '10-15%',
			},
			{
				'id': 'D',
				'answer': '15-20%',
			},
		]
	},
];

var total = questions.length;

var title = {
	'title': 'Return of the Aliens',
	'description': 'CROP CIRCLES. CROP TRIANGLES. UFOs. WHERE DOES IT END, SHARON? WHERE?',
	'total': total
}

var answers = ['A', 'B', 'D', 'A', 'C'];

var game = function(){
	gameio.on('connection', function (socket) {
		console.log('Game connection', socket.id);

		userCount++;
		users[socket.id] = 0;
		gameio.emit('users', userCount);

		//Title details for front-end local storage
		socket.emit('title', title);

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