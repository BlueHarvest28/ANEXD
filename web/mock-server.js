var net = require('net');

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

/***********************
*	USER --> SERVER
*	WEBSOCKETS
***********************/
var players = [];

io.on('connection', function(socket){
	console.log('Socket connection', socket.id);
	
	socket.on('msgserver', function(data){
		console.log('msgserver');
		server.write(new Buffer(JSON.stringify({'msg': data})));
	});
	
	//Host creates a lobby
	socket.on('hostlobby', function(id){
		players.unshift({'userSocket': socket.id, 'nickname': 'host', 'ready': false});
		console.log('lobby request', id);
		socket.emit('lobby', true);
	});
	
	//Mobile user joins a lobby
	socket.on('join', function(name){
		console.log('new user:', name);
		players.push({'userSocket': socket.id, 'nickname': name, 'ready': false});
		io.emit('update', players);
	});
	
	socket.on('setready', function (ready){
		for(var i = 0; i < players.length; i++){
			if(players[i].userSocket === socket.id){
				players[i].ready = ready;
			}
		}
		io.emit('update', players);
	});
	
	socket.on('start', function(data){
		console.log('starting');
		io.emit('start');
		//QUIZ
		if(data.app === 2) {
			
		}
		//IMAGE ANNOTATE
		else if(data.app === 14) {
			
		}
		//TANK GAME
		else if(data.app == 15){
			
		}
		//SCListen
		else if(data.app == 16) {
			
		}
	});

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
					delete players[i];
				}	
			}
		}
		io.emit('update', players);
	});
});


/***********************
*	SERVER --> GAME
* 	TCP
***********************/
var server;

var server = net.createServer(function(socket) {
	//socket.pipe(socket);
	
	socket.on('data', function(data){
		var json = JSON.stringify(data);
		data = JSON.parse(json, (key, value) => {
			return value && value.type === 'Buffer'
				? new Buffer(value.data)
			: value;
		});
		
		var data = JSON.parse(data.toString());
		
		if(data.event === 'server'){
			console.log('server');
			server = socket;
		}
		
		if(data.event === 'msgplayer'){
			console.log('sending to player');
			io.sockets.connected[players[data.player].userSocket].emit(data.msg.event, data.msg.data);
		}
		
		if(data.event === 'msgall'){
//			for(var i = 0; i < players.length; i++){
				io.emit(data.msg.event, data.msg.data);
//			}
		}
	});
});

server.listen(1337, 'localhost');