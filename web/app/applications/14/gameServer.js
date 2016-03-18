var net = require('net');

app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3002);
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || "localhost");

//Launch server
server.listen(app.get('port') ,app.get('ip'), function () {
    console.log("✔ Express server listening at %s:%d ", app.get('ip'),app.get('port'));
});

var client = new net.Socket();
client.connect(app.get('port') ,app.get('ip'), function() {
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