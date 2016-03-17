var net = require('net');

var client = new net.Socket();
client.connect(1337, 'localhost', function() {
	console.log('Connected Fam');
	client.write('Connected to Server');
});

client.on('comment', function(data) {
	console.log('Received: ' + data);
	client.write.('comment', data);
    client.destory();
});

client.on('close', function() {
	console.log('Connection closed');
});