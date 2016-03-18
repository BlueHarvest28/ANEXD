var net = require('net');

var client = new net.Socket();
client.connect(1337, 'localhost', function() {
	console.log('Connected');
	client.write(new Buffer(JSON.stringify({'event': 'server'})));
});

var imageURL = 'images/bg.png';

client.on('data', function(data) {
	var data = JSON.parse(data).msg;
	console.log('Received: ' + data);

	if(data.event === 'new'){
		console.log('new');
		if(imageURL){
			console.log('sending image', imageURL);
			client.write('image', imageURL);
		}
	}

	if(data.event === 'image'){
		console.log('image');
		imageURL = data.data;
		var msg = {
			'event': 'image',
			'data': imageURL,
		};
		client.write(new Buffer(JSON.stringify({'event': 'msgall', 'msg': msg})));
	}

	if(data.event === 'drawing'){
		console.log('drawing');
		var msg = {
			'event': 'drawing',
			'data': data.data,
		}
		client.write(new Buffer(JSON.stringify({'event': 'msgplayer', 'player': 0, 'msg': msg})));
	}

	if(data.event === 'save'){
		console.log('save');
		var msg = {
			'event': 'save',
			'data': data.data,
		}
		client.write(new Buffer(JSON.stringify({'event': 'msgplayer', 'player': 0, 'msg': msg})));
	}

	if(data.event === 'undo'){
		console.log('undo');
		var msg = {
			'event': 'undo',
		}
		client.write(new Buffer(JSON.stringify({'event': 'msgplayer', 'player': 0, 'msg': msg})));
	}	
});

client.on('close', function() {
	console.log('Connection closed');
});