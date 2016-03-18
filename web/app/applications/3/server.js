var net = require('net');

var host = '127.0.0.1';
var port = '0';

var array = [];
console.log(array.length);

// Add to end of Array
var addItem = array.push();
	console.log('addItem');

// Remove first item from Array
var remItem = array.shift();
	console.log('remItem');

// Current Time in array
array.curTime = function(){
	console.log("Current Time");
}
array.curTime();

// Write Comment in array
array.writeComment = function(){
	console.log("Comment");
}
array.writeComment();

// var server = net.createServer(function(socket) {
// 	socket.write('Echo server\r\n');
// 	socket.pipe(socket);
// 	console.log("Birthday Cake");
// });

// server.listen(1337, '127.0.0.1');

var jsonStr = {
		"user": [],
		"time": [],
		"message": []
	}

function addToArray{
	array.jsonStr.push({
		user: user,
		time: time,
		message: message
	});
}


var server = net.createServer(function(socket){

}).listen(port, host);

console.log('Server is listening on: ' + host + ' :' + port);
