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
	client.on('connection', function (socket) { 
		console.log('connection!', socket.id)

		client.on('ishost', function(){
			console.log('Host connection!', socket.id);
			host = socket;
			host.emit('canvas', [cwidth, cheight]);
		});

		client.on('player', function(){
			console.log('player connection!', socket.id);
			playersSoc[socket.id] = playerCount;
			socket.emit('playerCol', pInfo[playerCount].colour)
			addPlayer();
			playerCount++;	
		});

		client.on('action', function(message){
			message.player = playersSoc[socket.id];
			console.log('action', message, socket.id);
			actions(message);
		});
	});
};