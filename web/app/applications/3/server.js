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
