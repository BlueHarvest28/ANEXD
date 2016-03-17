var net = require('net');

var client = new net.Socket();
client.connect(1337, 'localhost', function() {
	console.log('Connected Fam');
	client.write('Connected to Server');
});

client.on('data', function(data) {  
    if(data.msg.event === 'comment') { //Check the event
        var newComment = '';
        console.log('Received: ' + data);
        newComment = data;
        
        //JSON Creation
        var msg = {
        'event': 'comment',
        'data': newComment};
        
        //Sent to Host (player 0) via GoLang Server
        client.write({event: 'msgplayer', player: 0, msg: {package}); 
    }
});

client.on('close', function() {
	console.log('Connection closed');
    client.destroy();
});
