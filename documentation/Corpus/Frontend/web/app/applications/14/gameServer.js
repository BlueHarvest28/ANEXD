/*
*	TODO: 	COMMENTS
*/
var net = require('net');
var express = require('express');
var http    = require('http');
var app     = express();
var server  = http.createServer(app);
var socketio = require('socket.io-client');
var bodyParser = require('body-parser');

var games = [];

app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3004);
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || "localhost");
app.use(bodyParser.json());

//Launch server
server.listen(app.get('port'), app.get('ip'), function () {
    console.log("✔ Express server listening at %s:%d ", app.get('ip'), app.get('port'));
});

app.post("/",function(request, response){
	console.log(request.body);
	var lobbyid = request.body.lobbyid;
	var instance = new app().init();
	games.push(instance);
});

function app() {
    this.imageURL = '';
    this.init = function() {
		console.log('Initialising');
		this.socket = socketio('http://api-anexd.rhcloud.com:8000/');
		this.socket.on('connect', function(){
			this.socket.emit('client', 'server');
			this.socket.emit('connectlobby', lobbyid);
			this.socket.on('connectlobby', function(data){
				this.run();
			});
		});
    };
    this.run = function() {
		console.log('Running');
        this.socket.on('new', function(data){
			console.log('new');
			if(this.imageURL){
				console.log('sending image', this.imageURL);
				this.socket.emit('image', this.imageURL);
			}
		});
		
		this.socket.on('image', function(data){
			console.log('image:', data);
			this.imageURL = data;
			var msg = {
				'event': 'image',
				'data': this.imageURL,
			};
			this.emit('msgall', {'msg': msg});
		});
		
		this.socket.on('drawing', function(data){
			console.log('drawing:', data);
			var msg = {
				'event': 'drawing',
				'data': data,
			}
			this.emit('msgplayer', {'player': 0, 'msg': msg});
		});
		
		this.socket.on('save', function(data){
			console.log('save:', data);
			var msg = {
				'event': 'save',
				'data': data,
			}
			this.emit('msgplayer', {'player': 0, 'msg': msg});
		});
		
		this.socket.on('undo', function(data){
			console.log('undo');
			var msg = {
				'event': 'undo',
			}
			this.emit('msgplayer', {'player': 0, 'msg': msg});
		});	
    };
};

//
//var play = function(namespace, instance){
//	var socket = socketio(namespace); 
//	games.push({'socket': socket, 'imageURL': ''});
//	
//	socket.on('connect', function(){
//		console.log('game server connected to mock');
//		
//		socket.on('new', function(data){
//			console.log('new');
//			if(imageURL){
//				console.log('sending image', imageURL);
//				socket.emit('image', imageURL);
//			}
//		});
//		
//		socket.on('image', function(data){
//			console.log('image:', data);
//			imageURL = data;
//			var msg = {
//				'event': 'image',
//				'data': games[instance].imageURL,
//			};
//			socket.emit('msgall', {'msg': msg});
//		});
//
//		socket.on('drawing', function(data){
//			console.log('drawing:', data);
//			var msg = {
//				'event': 'drawing',
//				'data': data,
//			}
//			socket.emit('msgplayer', {'player': 0, 'msg': msg});
//		});
//
//		socket.on('save', function(data){
//			console.log('save:', data);
//			var msg = {
//				'event': 'save',
//				'data': data,
//			}
//			socket.emit('msgplayer', {'player': 0, 'msg': msg});
//		});
//
//		socket.on('undo', function(data){
//			console.log('undo');
//			var msg = {
//				'event': 'undo',
//			}
//			socket.emit('msgplayer', {'player': 0, 'msg': msg});
//		});	
//	});
//};