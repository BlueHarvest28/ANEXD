var express = require('express');
var http    = require('http');
var app     = express();
var server  = http.createServer(app);
var io      = require('socket.io').listen(server);

var lobbyio	= io.of('/567');

//Openshift setup
app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3002);
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || "localhost");

//Launch server
server.listen(app.get('port') ,app.get('ip'), function () {
    console.log("✔ Express server listening at %s:%d ", app.get('ip'),app.get('port'));
});

var title = {
	'title': 'Return of the Aliens',
	'description': 'CROP CIRCLES. CROP TRIANGLES. UFOs. WHERE DOES IT END, SHARON? WHERE?',
	'total': 5
}

var questions = [
	{
		'number': '1',
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
		'number': '2',
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
		'number': '3',
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
		'number': '4',
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
		'number': '5',
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

var answers = ['A', 'B', 'D', 'A', 'C'];

var current = 0;
var total = questions.length;

lobbyio.on('connection', function (socket) {
	console.log('connection', socket.id);
	var userio	= io.of('/'+ socket.id);
	
	//Title details for front-end local storage
	socket.emit('title', title);
	
	if(current === 0){
		socket.emit('current', {'event': 'showStart'});
	}
	else if(current < total ){
		socket.emit('current', {'event': 'question', 'data': questions[current-1]});
	}
	else if(current > total){
		socket.emit('current', {'event': 'showEnd'});
	}
	
	socket.on('next', function (){
		if(current === total){
			current++;
			socket.emit('next', true);
			lobbyio.emit('current', {'event': 'showEnd'});
		} 
		else if(current < total){
			current++;
			var question = questions[current-1];	
			console.log('next question', current);
			socket.emit('next', true);
			lobbyio.emit('current', {'event': 'question', 'data': question});
		}
	});
	
	socket.on('previous', function (){
		if(current === 1){
			current--;
			socket.emit('previous', true);
			lobbyio.emit('current', {'event': 'showStart'});	
		} 
		else if(current > 1){
			current--;
			var question = questions[current-1];	
			console.log('previous question', current);
			socket.emit('previous', true);
			lobbyio.emit('current', {'event': 'question', 'data': question});
		}
	});
});

