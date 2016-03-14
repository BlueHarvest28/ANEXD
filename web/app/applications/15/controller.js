(function () {
'use strict';
angular.module('ANEXD')
.controller('TankController', [
	'$scope',
	'ANEXDService',
    function ($scope, ANEXDService) 
    {
		var anexd = new ANEXDService();

		//tutorial from http://www.w3schools.com/games/default.asp


		//TODO:
		//Remove bullets when they exceed the canvas dimensions
		//Only shoot 3/5 bullets then need a pause
		//Delay after shooting

		var players = [];
		var bullets = [];
		var myGameFloor;

		var canvasSize = [840,470];

		$scope.startGame = function() {
		    var width = canvasSize[0];
		    var height = canvasSize[1];

		    myGameFloor = new component(0, 0, 'images/ground.png', 0, 0, "background", false, 0, 0);

		    players.push(new component(60, 60, 'images/tankGreen.png', 2, 2, "image", true, 135, 0));
		    players.push(new component(60, 60, 'images/tankYellow.png', 2, height -62, "image", true, 45, 0));
		    players.push(new component(60, 60, 'images/tankRed.png', width -62, 2, "image", true, 225, 0));
		    players.push(new component(60, 60, 'images/tankBlue.png', width -62, height -62, "image", true, 325, 0));
		    myGameArea.start();
		}

		var myGameArea = {
		    canvas : document.getElementById("canvas"),
		    start : function() {
		        this.canvas.width = canvasSize[0];
		        this.canvas.height = canvasSize[1];
		        this.context = this.canvas.getContext("2d");
		        this.frameNo = 0;
		        this.interval = setInterval(updateGameArea, 20);
		        
		        window.addEventListener('keydown', function (e) {
				    if (e.keyCode == 87) { angular.element('#up0').triggerHandler('mousedown'); }
				    if (e.keyCode == 83) { angular.element('#down0').triggerHandler('mousedown'); }
			        if (e.keyCode == 65) { angular.element('#left0').triggerHandler('mousedown'); }
		            if (e.keyCode == 68) { angular.element('#right0').triggerHandler('mousedown'); }
				    if (e.keyCode == 70) { angular.element('#shoot0').triggerHandler('mousedown'); }
		        })
		        window.addEventListener('keyup', function (e) {
				    if (e.keyCode == 87) { angular.element('#up0').triggerHandler('mouseup'); }
				    if (e.keyCode == 83) { angular.element('#down0').triggerHandler('mouseup'); }
			        if (e.keyCode == 65) { angular.element('#left0').triggerHandler('mouseup'); }
				    if (e.keyCode == 68) { angular.element('#right0').triggerHandler('mouseup'); }
		        })
		        },
		    clear : function() {
		        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		    },
		    stop : function() {
		        clearInterval(this.interval);
		    }
		}

		function component(width, height, color, x, y, type, rotate, rotInit, spdInit) {
		    this.type = type;
		    if (type == "image" || type == "background" || type == "bullet") {
		        this.image = new Image();
		        this.image.src = color;
		    }
		    if (rotate) {
		    	this.angle = 0 + rotInit;
		        this.angleSpeed = 0;
		    }
		    if (type == "bullet"){
		        this.bounces = 1
		        this.remBounce = function() {
		            this.bounces -= 1;
		            return this.bounces;
		        }
		    }
		    this.width = width;
		    this.height = height;  
		    this.speed = spdInit; 
		    this.x = x;
		    this.y = y;   
		    this.health = 1;
		    this.removeHealth = function(){
		        this.health -= 1;
		        return this.health;
		    } 
		    this.update = function() {
		        var ctx = myGameArea.context;
		        if (type == "image" || type == "bullet") {
		        	if (rotate && type != "bullet") {
		        		ctx = myGameArea.context;
				        ctx.save();
				        ctx.translate(this.x + width/2, this.y + height/2);
				        ctx.rotate(this.angle  * Math.PI / 180);     
				        ctx.translate(-(this.x + width/2), -(this.y  + height/2));
				        ctx.drawImage(this.image, 
			                this.x, 
			                this.y,
			                this.width, this.height);
				        ctx.restore(); 
		        	}else{
			            ctx.drawImage(this.image, 
			                this.x, 
			                this.y,
			                this.width, this.height);
		        	}
		        }
		        else if (type == "background") {
				    ctx.fillStyle = myGameArea.context.createPattern(this.image, "repeat");
				    ctx.fillRect(0, 0, myGameArea.canvas.width, myGameArea.canvas.height);
		        }else {
		            ctx.fillStyle = color;
		            ctx.fillRect(this.x, this.y, this.width, this.height);
		        }
		    }
		    this.newPos = function() {
		        this.angle += this.angleSpeed;
		        if (this.angle == 0)
		            this.angle = 360;
		        this.x -= this.speed * Math.sin(this.angle * Math.PI / 180);
		        this.y += this.speed * Math.cos(this.angle * Math.PI / 180);       
		    } 


		}

		/*always render floor first last object will be ontop.*/
		function updateGameArea() {
		    myGameArea.clear();
		    myGameFloor.update();
		    for(var i =0; i< players.length;i++){
		        if(players[i] != undefined){
		            players[i].newPos();
		            players[i].update();
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
		                b.x + b.width/2 > myGameArea.canvas.width ||
		                b.y + b.height/2 < 0 || 
		                b.y + b.height/2 > myGameArea.canvas.height){

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
		                       j+1 != bullets[i][0]){ //hit
		                        remBullet.push(i)
		                        if (!players[j].removeHealth()){
		                            delete players[j];
		                            var nodes = document.getElementById("p"+(j+1)).getElementsByTagName('*');
		                            for(var t = 0; t < nodes.length; t++)
		                                 nodes[t].disabled = true;
		                        }
		                    }
		                }
		            }

		            bullets[i][1].update();
		        }
		    }
		    for(var i =0; i< remBullet.length;i++){
		        //delete bullets[remBullet[i]] //didnt work
		        bullets.splice(remBullet[i], 1);
		    }
		}

		$scope.move = function(dir, i) {
		    var movSpeed = 2;
		    if (dir == "up") { players[i-1].speed = movSpeed * -1; }
		    if (dir == "down") { players[i-1].speed = movSpeed; }
		    if (dir == "left") { players[i-1].angleSpeed = -3; }
		    if (dir == "right") { players[i-1].angleSpeed = 3; }
		}

		$scope.clearmove = function(dir, i) { 
		    players[i-1].speed = 0; 
		    players[i-1].angleSpeed = 0; 
		}

		var waitTime = 500;
		var waiter;

		//delay to stop to many bullets
		$scope.shooting = function(id){
		    if (waiter == undefined) {
		        shoot(id);
		        waiter = setTimeout(function(){
		            waiter = undefined;      
		        }, waitTime);
		    }
		}

		function shoot(id){
		    var x = players[id-1].x
		    var y = players[id-1].y
		    var angle = players[id-1].angle;

		    x += 30 * Math.sin(angle * Math.PI / 180);
		    y -= 30 * Math.cos(angle * Math.PI / 180); 

		    bullets.push(
		        [id, new component(100,100, 'images/tankFire.png', x-25, y-24, "bullet", true, angle, -10)]
		    );
		}
	}
])
.controller('MobileTankController', [
	'$scope',
	'ANEXDService',
    function ($scope, ANEXDService) 
    {			
		var anexd = new ANEXDService();
		
		$scope.showStart = true;
		$scope.showQuestion = false;
		$scope.showEnd = false;
		
		$scope.selectedAnswer = false;
		$scope.score = 0;
		
		anexd.expect('title');
		anexd.expect('current');
		$scope.$watch(
			function() {
				return anexd.getFromServer();	
			}, 
			function (data){
				if(data){
					$scope.selectedAnswer = false;
					$scope.question = undefined;
					if(data.event === 'title'){
						$scope.title = data.val.title;
						$scope.description = data.val.description;
						$scope.total = data.val.total;
					}
					else if(data.event === 'current'){
						if(data.val.event === 'showStart'){
							$scope.showStart = true;
							$scope.showQuestion = false;
							$scope.showEnd = false;
						}
						else if(data.val.event === 'question'){
							$scope.showStart = false;
							$scope.showQuestion = true;
							$scope.showEnd = false;
							$scope.question = data.val.data;
						}
						else if(data.val.event === 'showEnd'){
							$scope.showStart = false;
							$scope.showQuestion = false;
							$scope.showEnd = true;
						}
						
					}
				}
			}
		);
		
		$scope.answers = [];
		
		$scope.setAnswer = function(answer){
			anexd.sendToServer('answer', answer)
			.then(function(data){
				$scope.answers[$scope.question.number] = answer;
				if(data){
					$scope.score++;
				}
			}, function(error) {
				console.log(error);
			});	
		};
    }
]);
}());