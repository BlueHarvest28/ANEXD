/**
 * CO600 ANEXD Project Code
 *
 * Contributor(s): Harry Jones(HJ80)
 * Image Annotate game server
 * Handles instancing of the Image Annotate application
 *
 * CURRENTLY ONLY ONE CANVAS LAYER - UNDO AFFECTS ALL.
 *
 * Copyright (C): University Of Kent 14/03/2016 
**/
'use strict';
#!/bin/env node
//Server requirements
var express 	= require('express');
var app     	= express();
var socketio 	= require('socket.io-client');
var bodyParser 	= require('body-parser');

var serverSocket;
var games = [];

//Openshift configuration
app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3004);
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || "localhost");
app.use(bodyParser.json());

//Launch server and listen at the given port and IP
app.listen(app.get('port'), app.get('ip'), function () {
    console.log("✔ Express server listening at %s:%d ", app.get('ip'), app.get('port'));
});

//Object for Image Annotate instances
function Instance(lobbyid) {
	//New socket connection for this instance to listen on
	var socket = socketio('http://api-anexd.rhcloud.com:8000');
	//Local storage of the image being edited
    this.imageURL = '';
	
    this.init = function() {
		console.log('Initialising', lobbyid);
		socket.on('connect', function(){
			//Messages to confirm Go readiness
			socket.emit('client', 'server');
			socket.emit('connectlobby', lobbyid);
			socket.on('connectlobby', function(data){
				if(data){
					run();	
				}
			});
		});
    };
	
    var run= function() {
		console.log('Running');
		//New player joined
        socket.on('new', function() {
			console.log('new');
			if(this.imageURL){
				console.log('sending image', this.imageURL);
				this.socket.emit('image', this.imageURL);
			}
		});
		
		//Change image being edited
		socket.on('image', function(data) {
			console.log('image:', data);
			this.imageURL = data;
			var msg = {
				'event': 'image',
				'data': this.imageURL,
			};
			socket.emit('msgall', {'msg': msg});
		});
		
		//Add drawing to canvas
		socket.on('drawing', function(data){
			console.log('drawing:', data);
			var msg = {
				'event': 'drawing',
				'data': data,
			};
			socket.emit('msgplayer', {'player': 0, 'msg': msg});
		});
		
		//Save on each new drawing
		socket.on('save', function(data) {
			console.log('save:', data);
			var msg = {
				'event': 'save',
				'data': data,
			};
			socket.emit('msgplayer', {'player': 0, 'msg': msg});
		});
		
		//Undo from the list of saves
		socket.on('undo', function() {
			console.log('undo');
			var msg = {
				'event': 'undo',
			};
			socket.emit('msgplayer', {'player': 0, 'msg': msg});
		});	
    };
}

//When we receive the post request to launch the lobby
app.post('/', function(request, response) {
	if(request.body){
		//Instantiate the socket
		serverSocket = socketio('http://api-anexd.rhcloud.com:8000');
		var lobbyid = request.body.lobbyId;
		//Inform Go we are beginning a new session
		serverSocket.on('newsession', function(){
			serverSocket.emit('created');
			//Instantiate the app
			var i = new Instance(lobbyid);
			i.init();
			games.push(i);	
		});
	}
	response.json({});
});