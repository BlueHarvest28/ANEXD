var express = require('express');
var http    = require('http');
var app     = express();
var server  = http.createServer(app);
var io      = require('socket.io').listen(server);
var mysql 	= require('mysql');

//Openshift setup
app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3002);
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || "localhost");

//Launch server
server.listen(app.get('port') ,app.get('ip'), function () {
    console.log("✔ Express server listening at %s:%d ", app.get('ip'),app.get('port'));
});

//Temporarily sending to ANEXD database
var credentials = {
	host     : 'p3plcpnl0650.prod.phx3.secureserver.net',
    user     : 'ANEXD_ADMIN',
    password : 'gn9-MVn-6Bq-q6b',
    database : 'ANEXD'
};

//Socket for lobbies
var lobbyio;

//Socket for games
var gameio;

//Instantiate Socket for website
io.on('connection', function(socket){
	console.log('IO connection', socket.id);
	socket.on('lobby', function(id){
		console.log('lobby request', id);
		lobbyio	= io.of('/' + id);
		lobby();
		socket.emit('lobby', true);
	});
	
	//Temporarily not-generic
	socket.on('quiz', function(quiz){
		postQuiz(quiz);
		socket.emit('quiz', true);
	});
	
	socket.on('quizzes', function(){
		getQuizzes(function(data){
			socket.emit('quizzes', data);
		});
	})
});

//Send a new quiz to the database
var postQuiz = function (quiz){
	quiz = JSON.stringify(quiz);
	var connection = mysql.createConnection(credentials);
	connection.query('INSERT INTO Quiz (data) VALUES (?)', quiz, function(err, result) {
		if(err) throw err;
		connection.end();
	});
}

var players = {};
var lobby = function(){
	lobbyio.on('connection', function(socket){
		console.log('Lobby connection', socket.id);
		
		socket.on('start', function(data){
			console.log('starting');
			lobbyio.emit('start');
			gameio = io.of('/' + data.lobby + '/' + data.app);
			//QUIZ
			if(data.app === 2) {
				getQuiz();	
			}
			//IMAGE ANNOTATE
			else if(data.app === 14) {
				imageAnnotate();	
			}
			//TANK GAME
			else if(data.app == 15){
				console.log('tank game')
				tankGame();
			}
            //SCListen
            else if(data.app == 16) {
                scListen();
            }
		});
		
		socket.on('join', function(name){
			console.log('new user', name);
			players[socket.id] = {'id': socket.id, 'name': name, 'ready': false};
			//Place player into existing game
			if(running){
				socket.emit('start');
			}
			lobbyio.emit('update', players);
		});
		
		socket.on('ready', function (ready){
			players[socket.id].ready = ready;
			lobbyio.emit('update', players);
		});
		
		socket.on('leave', function(){
			console.log('disconnect', players[socket.id].name);
			socket.disconnect();
		})
		
		socket.on('leaveApp', function(player){
			player.disconnect();
		});
		
		socket.on('close', function(){
			players = {};
			lobbyio.emit('close');
			socket.disconnect();
		})
		
		socket.on('disconnect', function(){
			delete players[socket.id];
			lobbyio.emit('update', players);
		})
	});
};

/********************
*		QUIZ		*
*********************/
var users = {};
var userCount = -1;
var current = 0;
var running = false;

var data;
var questions;
var total;
var title;
var answers;

//Get a quiz
var getQuiz = function (callback){
	var connection = mysql.createConnection(credentials);
	connection.query('SELECT * FROM Quiz LIMIT 1', function(err, result) {
		if(err) throw err;
		connection.end();
		try {
			data = JSON.parse(result[0].data).data;
		} catch (e) {
			return console.error(e);
		}
		
		questions = data.questions;
		total = questions.length;
		title = {
			'title': data.title,
			'description': data.description,
			'total': total
		};
		answers = data.answers;
		//Launch game
		quiz();
	});
}

var quiz = function(){
	running = true;
	gameio.on('connection', function (socket) {
		console.log('Game connection', socket.id);

		userCount++;
		users[socket.id] = 0;
		gameio.emit('users', userCount);

		//Title details for front-end local storage
		socket.emit('title', title);
		
		socket.on('leave', function(){
			//lobbyio.emit('leaveApp', socket);
			socket.disconnect();
		});

		socket.on('disconnect', function(){
			userCount--;
			gameio.emit('users', userCount);
			delete users[socket.id];
		});

		if(current === 0){
			socket.emit('current', {'event': 'showStart'});
		}
		else if(current < total ){
			socket.emit('current', {'event': 'question', 'data': questions[current-1]});
		}
		else if(current > total){
			socket.emit('current', {'event': 'showEnd'});
		}

		socket.on('answer', function(answer){
			gameio.emit('answers');
			if(answer === answers[current-1]){
				users[socket.id]++;
				console.log('correct answer, score:', users[socket.id]);
				socket.emit('answer', true);
			}
			else {
				socket.emit('answer', false);
			}
		});

		socket.on('next', function (){
			if(current === total){
				current++;
				console.log('show end');
				socket.emit('next', true);
				gameio.emit('current', {'event': 'showEnd', 'data': users});
			} 
			else if(current < total){
				current++;
				var question = questions[current-1];	
				console.log('next question', current);
				socket.emit('next', true);
				gameio.emit('current', {'event': 'question', 'data': question});
			}
		});

		socket.on('previous', function (){
			if(current === 1){
				current--;
				console.log('show start');
				socket.emit('previous', true);
				gameio.emit('current', {'event': 'showStart'});	
			} 
			else if(current > 1){
				current--;
				var question = questions[current-1];	
				console.log('previous question', current);
				socket.emit('previous', true);
				gameio.emit('current', {'event': 'question', 'data': question});
			}
		});
	});
};

var imageAnnotate = function(){
	var imageURL;
	gameio.on('connection', function (socket) {
		console.log('Game connection on annotate', socket.id);
		
		if(imageURL){
			console.log('sending image', imageURL);
			socket.emit('image', imageURL);
		}
		
		socket.on('image', function(image){
			imageURL = image;
			gameio.emit('image', imageURL);
		});
		
		socket.on('drawing', function(coords){
			gameio.emit('drawing', coords);
		});
		
		socket.on('save', function(data){
			gameio.emit('save', data);
		});
		
		socket.on('undo', function(){
			gameio.emit('undo');
		});
		
		socket.on('leave', function(){
			socket.disconnect();
		});
	});
};

var scListen = function(){
    var newComment;
    
    gameio.on('connection', function(socket) {
        console.log('connection made', socket.id);
        
        socket.on('comment', function(data) {
            console.log(data);
            newComment = data;
            gameio.emit('comment', newComment);
        });
    });
};

var tankGame = function(){
	//connect, disconnect, message, connection
	var cwidth = 840;
	var cheight = 740;

	var playersSoc = {};
	var playerCount = 0;

	var tImgPath = 'applications/15/resources/images/tank';
	var tImgEnd = '.png';
	var pInfo = [
		{
			'colour':'Green',
			'pos': {
				'x': 2,
				'y': 2
			},
			'initRot': 135,
			'width': 60
		},
		{
			'colour':'Yellow',
			'pos': {
				'x': 2,
				'y': cheight - 62
			},
			'initRot': 45,
			'width': 60
		},
		{
			'colour':'Red',
			'pos': {
				'x': cwidth - 62,
				'y': 2
			},
			'initRot': 225,
			'width': 60
		},
		{
			'colour':'Blue',
			'pos': {
				'x': cwidth - 62,
				'y': cheight - 62
			},
			'initRot': 325,
			'width': 60
		}
	];
	var players = [];
	var bullets = [];

	var imgPath = 'applications/15/resources/images/';

	var gameInst;
	var game = function() {
		this.running = true;
		this.interval;
		this.start = function() {
			this.interval = setInterval(updateGameArea, 20);
			this.running = false;
			console.log('game started');
		}
		this.stop = function() {
			clearInterval(this.interval);
			console.log('game stopped');
		}
	};

	var addPlayer = function() {
		if(!game.running) {
			gameInst = new game();
			gameInst.start();
		}
		var t = pInfo[playerCount]; //tank
		players.push(new Tank(60,60, t.colour.toLowerCase() + "Tank", t.pos.x, t.pos.y, t.initRot));
	};

	//component constructor
	var Component = function(width, height, x, y, type){
        this.type = type;
		this.width = width;
	    this.height = height;   
	    this.x = x;
	    this.y = y; 
	};

	var Tank = function(width, height, type, x, y, rotInit) {
		Component.call(this, width, height, x, y, type);

	    this.speed = 0; 
    	this.angle = 0 + rotInit;
        this.angleSpeed = 0;  
	    this.health = 1;
	    this.removeHealth = function() {
	        this.health -= 1;
	        return this.health;
	    } 
	    this.newPos = function() {
	        this.angle += this.angleSpeed;
	        if (this.angle == 0)
	            this.angle = 360;
	        this.x -= this.speed * Math.sin(this.angle * Math.PI / 180);
	        this.y += this.speed * Math.cos(this.angle * Math.PI / 180);       
	    } 
	    this.getData = function() {
	    	return [this.width, this.height, this.type, this.x, this.y, this.angle];
	    }
	};

	var Bullet = function(width, height, type, x, y, speed, direction) {
		Component.call(this, width, height, x, y, type);
    	this.angle = 0 + direction;
        this.bounces = 1
	    this.speed = speed; 
        this.remBounce = function() {
            this.bounces -= 1;
            return this.bounces;
        } 
	    this.newPos = function() {
	        this.x -= this.speed * Math.sin(this.angle * Math.PI / 180);
	        this.y += this.speed * Math.cos(this.angle * Math.PI / 180);       
	    } 
	    this.getData = function() {
	    	return [this.width, this.height, this.type, this.x, this.y, 0];
	    }
	};

	Tank.prototype = Object.create(Component.prototype); // See note below
	Bullet.prototype = Object.create(Component.prototype); // See note below

	Tank.prototype.constructor = Tank;
	Bullet.prototype.constructor = Bullet;

	var updateGameArea = function(){
	    for(var i =0; i< players.length;i++) {
	        if(players[i] != undefined) {
	            players[i].newPos();
	        }
	    }

	    var remBullet = [];
	    for(var i =0; i< bullets.length;i++){
	        if (bullets[i] != undefined) {
	            //check here for bullet remov
	            //remove after loop dont edit bullets while in loop
	            bullets[i][1].newPos();

	            var b = bullets[i][1];
	            //check if its in canvas
	            if (b.x + b.width/2 < 0 || 
	                b.x + b.width/2 > cwidth ||
	                b.y + b.height/2 < 0 || 
	                b.y + b.height/2 > cheight){

	                    console.log(b.angle)
	                if(b.bounces == 0){
	                    remBullet.push(i)
	                }else{
	                    //change the angle
	                    console.log(b.angle)
	                    var initAng = 90 - (b.angle % 90)
	                    initAng *= 2; //double it
	                    var totalAngle = ((180 - initAng) / 2) + initAng;
	                    bullets[i][1].angle = b.angle + initAng;
	                }
	                bullets[i][1].remBounce();
	            }
	            //check if it hits players
	            //remove that bullet and player
	            for(var j =0; j < players.length; j++){
	                var p = players[j];
	                if(p != undefined){
	                    if((b.x + b.width/2 >= p.x && b.y + b.height/2 >= p.y) && 
	                       (b.x + b.width/2 <= p.x + p.width && b.y + b.height/2 <= p.y + p.height)&&
	                       j+1 != bullets[i][0]){ //cant hit yourself
	                        remBullet.push(i)
	                        if (!players[j].removeHealth()){
	                            delete players[j];
	                            console.log('player hit ', players[j], j)
	                        }
	                    }
	                }
	            }
	        }
	    }
	    for(var i =0; i< remBullet.length;i++){
	        //delete bullets[remBullet[i]] //didnt work
	        bullets.splice(remBullet[i], 1);
	    }
	    sendChanges();
	};

	var sendChanges = function() {
		//loop through players and bullets
		var objects = [];
		for(var i = 0; i < players.length; i++){
			objects.push(players[i].getData());
		}
		for(var i = 0; i < bullets.length; i++){
			objects.push(bullets[i][1].getData());
		}
		host.emit('changes', objects);
	};

	var move = function(dir, i) {
	    var movSpeed = 2;
	    if (dir == "up") { players[i].speed = movSpeed * -1; }
	    if (dir == "down") { players[i].speed = movSpeed; }
	    if (dir == "left") { players[i].angleSpeed = -3; }
	    if (dir == "right") { players[i].angleSpeed = 3; }
	};

	var clearmove = function(dir, i) { 
	    players[i].speed = 0; 
	    players[i].angleSpeed = 0; 
	};

	var shoot = function(id) {
	    var x = players[id].x
	    var y = players[id].y
	    var angle = players[id].angle;

	    x += 30 * Math.sin(angle * Math.PI / 180);
	    y -= 30 * Math.cos(angle * Math.PI / 180); 

	    bullets.push(
	        //width, height, type, x, y, speed, direction
	        [id, new Bullet(100,100, 'bullet', x-25, y-24, -10, angle)]
	    );
	};

	var actions = function(data) {
		switch(data.action){
			case 'clearmove':
				clearmove(data.params[0], data.player);
				break;
			case 'move':
				move(data.params[0], data.player);
				break;
			case 'shoot':
				console.log('shooting');
				shoot(data.player);
				break;
		}
	};

	var host;
	gameio.on('connection', function (socket) { 
		console.log('connection!', socket.id)

		socket.on('ishost', function(){
			console.log('Host connection!', socket.id);
			host = socket;
			host.emit('canvas', [cwidth, cheight]);
		});

		socket.on('player', function(){
			console.log('player connection!', socket.id);
			playersSoc[socket.id] = playerCount;
			addPlayer();
			playerCount++;	
		});

		socket.on('action', function(message){
			message.player = playersSoc[socket.id];
			console.log('action', message, socket.id);
			actions(message);		
		});

		//socket.emit('playerConnect', {'playerNum': playerCount});
		/*socket.on('playerReconnect', function(num){
			console.log('Player reconnection!', socket.id);
			//playersSoc[socket.id] = playerCount;
			for(var key in playerSoc){ 
				if(playerSoc.key === num) {
					delete playerSoc.key
					playerSoc[socket.id] = num;
				}
			}
		});*/

		
		//not implemented
		socket.on('leave', function(){
			socket.disconnect();
		});
	});
};