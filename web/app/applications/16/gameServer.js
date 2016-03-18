var net = require('net');

var client = new net.Socket();
client.connect(1337, 'localhost', function() {
	console.log('Connected Fam');
    client.write(new Buffer(JSON.stringify({'event': 'server'})));
});


client.on('data', function(data) {
	var data = JSON.parse(data).msg;
	console.log('Received: ' + data);

	if(data.event === 'comment'){
		console.log('comment');
        
        //JSON Creation
        var msg = {
            'event': 'comment',
            'data': data
        };
        
        client.write(new Buffer(JSON.stringify({'event': 'msgplayer', 'player': 0, 'msg': msg})));
	}
});
    
client.on('close', function() {
	console.log('Connection closed');
    client.destroy();
});