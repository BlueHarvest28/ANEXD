/*
*	TODO:	UPDATE TO MATCH GO STANDARDS FOR RISK MANAGEMENT
*/

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

var running = false;

/***********************
*	USER --> SERVER
***********************/
var launch = function(){
	io.on('connection', function(socket){
		console.log('Socket connection', socket.id);
		
		socket.on('message', function(test){
			console.log(test);
		});
		
		//Host creates a lobby
		socket.on('hostlobby', function(id){
			players.unshift({'userSocket': socket.id, 'nickname': 'host', 'ready': false});
			console.log('lobby request', id);
			socket.emit('lobby', true);
		});
		
		//Mobile user joins a lobby
		socket.on('joinlobby', function(data){
			players.push({'userSocket': socket.id, 'nickname': data.nickname, 'ready': false});
			io.emit('update', players);
			if(running){
				socket.emit('start');
			}
		});
		
		//Mobile user changes ready status
		socket.on('setready', function (ready){
			for(var i = 0; i < players.length; i++){
				if(players[i].userSocket === socket.id){
					players[i].ready = ready;
				}
			}
			io.emit('update', players);
		});
		
		//Launch app
		socket.on('start', function(data){
			io.emit('start');
			appsio.emit('start', data.app);
			serverio = io.of('/apps/' + data.app);
			console.log('serverio on:', '/apps/' + data.app);
			play();
			running = true;
		});	
		
		//Send message to the game server
		socket.on('msgserver', function(data){
			serverio.emit(data.event, data.data);
		});
		
		//Leave
		socket.on('leave', function(){
			socket.disconnect();
		});
		
		socket.on('leaveApp', function(player){
			player.disconnect();
		});
		
		socket.on('close', function(){
			players = {};
			io.emit('close');
			socket.disconnect();
		});
		
		socket.on('disconnect', function(){
			for(var i = 0; i < players.length; i++){
				if(players[i]){
					if(players[i].userSocket === socket.id){
						players.splice(i, 1);
					}	
				}
			}
			io.emit('update', players);
		});
	});
}

launch();

/***********************
*	GAMES --> SERVER
***********************/
var appWatch = function(){
	appsio.on('connection', function (socket){
		console.log('new app connection');
	});
};

appWatch();

/***********************
*	SERVER --> GAME
***********************/
var play = function(){
	console.log('play');
	serverio.on('connection', function(socket){
		console.log('new game connection');
		
		socket.on('message', function(data){
			serverio.emit(data.event, data.data);
		})
		
		//Send to one
		socket.on('msgplayer', function(data){
			console.log('sending to player');
			if(players[data.player]){
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

var serverappid = 14;
var imageURL;
var socketio = require('socket.io-client')
var appsocket = socketio('http://' + app.get('ip') + ':' + app.get('port') + '/apps');
var socket;
console.log('appsocket', 'http://' + app.get('ip') + ':' + app.get('port') + '/apps');
appsocket.on('connect', function(){
	console.log('connect to apps list');
	appsocket.on('start', function(appid){
		if(serverappid === appid){
			if(!socket){
				socket = socketio('http://' + app.get('ip') + ':' + app.get('port') + '/apps/' + appid);
				imageannotate();	
			}
		}
	});
});

var imageannotate = function(){
	console.log('play image annotate');
	socket.on('connect', function(){
		console.log('connected');
		
		socket.on('new', function(data){
			console.log('new');
			if(imageURL){
				console.log('sending image', imageURL);
				socket.emit('image', imageURL);
			}
		});
		
		socket.on('image', function(data){
			console.log('image:', data);
			imageURL = data;
			var msg = {
				'event': 'image',
				'data': imageURL,
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
	});
}