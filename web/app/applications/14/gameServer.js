var serverappid = 14;
var imageURL;
var socketio = require('socket.io-client')
var appsocket = socketio('http://localhost:3002/apps');
var socket;

//var net = require('net');
//
//var express = require('express');
//var http    = require('http');
//var app     = express();
//var server  = http.createServer(app);
//var io      = require('socket.io').listen(server);
//
//app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3004);
//app.set('ip', process.env.OPENSHIFT_NODEJS_IP || "localhost");
//
////Launch server
//server.listen(app.get('port') ,app.get('ip'), function () {
//    console.log("✔ Express server listening at %s:%d ", app.get('ip'),app.get('port'));
//});

appsocket.on('connect', function(){
	console.log('connect to apps list');
	appsocket.on('start', function(appid){
		if(serverappid === appid){
			if(!socket){
				socket = socketio('http://localhost:3002/apps/' + appid);
				play();	
			}
		}
	});
});

var play = function(){
	console.log('play');
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

//client.on('data', function(data) {
//	var data = JSON.parse(data).msg;
//	console.log('Received: ' + data);
//
//	if(data.event === 'new'){
//		console.log('new');
//		if(imageURL){
//			console.log('sending image', imageURL);
//			client.write('image', imageURL);
//		}
//	}
//
//	if(data.event === 'image'){
//		console.log('image');
//		imageURL = data.data;
//		var msg = {
//			'event': 'image',
//			'data': imageURL,
//		};
//		client.write(new Buffer(JSON.stringify({'event': 'msgall', 'msg': msg})));
//	}
//
//	if(data.event === 'drawing'){
//		console.log('drawing');
//		var msg = {
//			'event': 'drawing',
//			'data': data.data,
//		}
//		client.write(new Buffer(JSON.stringify({'event': 'msgplayer', 'player': 0, 'msg': msg})));
//	}
//
//	if(data.event === 'save'){
//		console.log('save');
//		var msg = {
//			'event': 'save',
//			'data': data.data,
//		}
//		client.write(new Buffer(JSON.stringify({'event': 'msgplayer', 'player': 0, 'msg': msg})));
//	}
//
//	if(data.event === 'undo'){
//		console.log('undo');
//		var msg = {
//			'event': 'undo',
//		}
//		client.write(new Buffer(JSON.stringify({'event': 'msgplayer', 'player': 0, 'msg': msg})));
//	}	
//});
//
//client.on('close', function() {
//	console.log('Connection closed');
//});