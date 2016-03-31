/**
 * CO600 ANEXD Project Code
 *
 * Contributor(s): Harry Jones(HJ80)
 * Mock server for developing the frontend without Go
 * Handles the websocket events and instantiates applications for testing
 *
 * Carries on from api.js functionality
 *
 * Copyright (C): University Of Kent 17/03/2016
**/
#!/bin/env node
var express = require('express');
var http    = require('http');
var app     = express();
var server  = http.createServer(app);
var io      = require('socket.io').listen(server);

app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3002);
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || "localhost");

//Launch server
server.listen(app.get('port') ,app.get('ip'), function () {
    console.log("✔ Express server listening at %s:%d ", app.get('ip'),app.get('port'));
});

//Serve from '/public' folder
app.use(express.static(__dirname + '/public'));

//Player and host sockets
var players = [];

//Server socket
var serverAddress;
var appsio = io.of('/apps');
var serverio;
var host;

var running = false;

/***********************
*	USER --> SERVER
***********************/
var launch = function(){
	//Server restart, close all
	io.emit('close');	
	
	io.on('connection', function(socket){
		console.log('Socket connection', socket.id);
		
		socket.on('client', function(){
			socket.emit('client', true);
		});
		
		//Host creates a lobby
		socket.on('hostlobby', function(data){
			console.log('lobby request', data.lobbyid);
			socket.emit('hostlobby', true);
			host = socket.id;
		});
		
		//Mobile user joins a lobby
		socket.on('joinlobby', function(data){
			socket.emit('joinlobby', true);
			console.log('join');
			players.push({'userSocket': socket.id, 'nickname': data.username, 'ready': false});
			io.emit('updatelobby', players);
			if(running){
				socket.emit('start');
			}
		});
		
		//Mobile user changes ready status
		socket.on('setready', function (data){
			for(var i = 0; i < players.length; i++){
				if(players[i].userSocket === socket.id){
					players[i].ready = data;
				}
			}
			io.emit('updatelobby', players);
		});
		
		socket.on('launch', function(){
			//stub
		});
		
		//Launch app
		socket.on('start', function(data){
			socket.emit('start', {
				'complete': true,
				'failed': false,
				'feedback': 'all good'
			});
			io.emit('start', {
				'complete': true,
				'failed': false,
				'feedback': 'all good'
			});
			
			var data = JSON.stringify({
			  lobbyid: 12
			});

			var options = {
				host: 'localhost',
				port: 3004,
				path: '/',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			};

			var req = http.request(options, function(res) {
				res.setEncoding('utf8');
				res.on('data', function (chunk) {
					console.log("body: " + chunk);
				});
			});

			req.write(data);
			req.end();
			
			serverio = io.of('/apps/' + 14);
			console.log('serverio on:', '/apps/' + 14);
			play();
			running = true;
		});	
		
		//Send message to the game server
		socket.on('msg', function(data){
			serverio.emit(data.event, data.data);
		});
		
		//Leave
		socket.on('leave', function(){
			console.log('leave');
			if(socket.id === host){
				console.log('HOST DISCONNECTION');
				running = false;
				io.emit('close');
				players = [];
			}
			else{
				for(var i = 0; i < players.length; i++){
					if(players[i]){
						if(players[i].userSocket === socket.id){
							console.log('PLAYER DISCONNECTION');
							players.splice(i, 1);
						}	
					}
				}
				io.emit('updatelobby', players);
			}
		});
		
		socket.on('leaveApp', function(player){
			console.log('leaveApp');
		});
		
		socket.on('close', function(){
			console.log('close');
			players = [];
			running = false
			io.emit('close');
		});
	});
}

launch();

/***********************
*	SERVER --> GAME
***********************/
var play = function(){
	serverio.on('connection', function(socket){
		console.log('mock connected to game server');
		
		socket.on('message', function(data){
			serverio.emit(data.event, data.data);
		})
		
		//Send to one
		socket.on('msgplayer', function(data){
			console.log('sending to player');
			if(data.player === 0){
				io.sockets.connected[host].emit(data.msg.event, data.msg.data);	
			}
			else if(players[data.player]){
				io.sockets.connected[players[data.player].userSocket].emit(data.msg.event, data.msg.data);	
			}
		});
		
		//Send to all
		socket.on('msgall', function(data){
			console.log('sending to all;', data.msg.event, data.msg.data);
			io.emit(data.msg.event, data.msg.data);
		});
		
	});
};