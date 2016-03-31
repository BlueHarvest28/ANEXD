/**
 * CO600 ANEXD Project Code
 *
 * Contributor(s): Harry Jones(HJ80)
 * Image Annotate game server
 * Handles instancing of the Image Annotate application
 *
 * Copyright (C): University Of Kent 14/03/2016 
**/
#!/bin/env node
var net 	= require('net');
var express = require('express');
var http    = require('http');
var app     = express();
var socketio = require('socket.io-client');
var bodyParser = require('body-parser');

var serverSocket;
var games = [];

app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3004);
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || "localhost");
app.use(bodyParser.json());

//Launch server
app.listen(app.get('port'), app.get('ip'), function () {
    console.log("✔ Express server listening at %s:%d ", app.get('ip'), app.get('port'));
});

app.post('/', function(request, response){
	if(request.body){
		serverSocket = socketio('http://api-anexd.rhcloud.com:8000');
		var lobbyid = request.body.lobbyId;
		serverSocket.on('newsession', function(data){
			serverSocket.emit('created');
			var i = new instance(lobbyid);
			i.init();
			games.push(i);	
		});
	}
	response.json({});
});

function instance(lobbyid) {
	var socket = socketio('http://api-anexd.rhcloud.com:8000');
    this.imageURL = '';
    this.init = function() {
		console.log('Initialising', lobbyid);
		socket.on('connect', function(){
			console.log('Connectiones');
			socket.emit('client', 'server');
			socket.emit('connectlobby', lobbyid);
			socket.on('connectlobby', function(data){
				if(data){
					run();	
				}
			});
		});
    };
    var run = function() {
		console.log('Running');
        socket.on('new', function(data){
			console.log('new');
			if(this.imageURL){
				console.log('sending image', this.imageURL);
				this.socket.emit('image', this.imageURL);
			}
		});
		
		socket.on('image', function(data){
			console.log('image:', data);
			this.imageURL = data;
			var msg = {
				'event': 'image',
				'data': this.imageURL,
			};
			socket.emit('msgall', {'msg': msg});
		});
		
		socket.on('drawing', function(data){
			console.log('drawing:', data);
			var msg = {
				'event': 'drawing',
				'data': data,
			}
			socket.emit('msgplayer', {'player': 0, 'msg': msg});
		});
		
		socket.on('save', function(data){
			console.log('save:', data);
			var msg = {
				'event': 'save',
				'data': data,
			}
			socket.emit('msgplayer', {'player': 0, 'msg': msg});
		});
		
		socket.on('undo', function(data){
			console.log('undo');
			var msg = {
				'event': 'undo',
			}
			socket.emit('msgplayer', {'player': 0, 'msg': msg});
		});	
    };
};