(function () {
'use strict';
angular.module('ANEXD')
.controller('TankController', [
	'$scope',
	'ANEXDService',
    function ($scope, ANEXDService) {
		var anexd = new ANEXDService();
		
		anexd.sendToServer('ishost');
		//tutorial from http://www.w3schools.com/games/default.asp

		var players = [];
		var bullets = [];
		var myGameFloor;

		var imgPath = 'applications/15/resources/images/';

		var canvasSize = [840,470];

		$scope.startGame = function() {
		    var width = canvasSize[0];
		    var height = canvasSize[1];

		    myGameFloor = new component(0, 0, imgPath + 'ground.png', 0, 0, "background", false, 0, 0);

		    players.push(new component(60, 60, imgPath + 'tankGreen.png', 2, 2, "image", true, 135, 0));
		    players.push(new component(60, 60, imgPath + 'tankYellow.png', 2, height -62, "image", true, 45, 0));
		    players.push(new component(60, 60, imgPath + 'tankRed.png', width -62, 2, "image", true, 225, 0));
		    players.push(new component(60, 60, imgPath + 'tankBlue.png', width -62, height -62, "image", true, 325, 0));
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
		    this.removeHealth = function() {
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
		var updateGameArea = function() {
		    myGameArea.clear();
		    myGameFloor.update();
		    for(var i =0; i< players.length;i++) {
		        if(players[i] != undefined) {
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
		                       j+1 != bullets[i][0]){ //cant hit yourself
		                        remBullet.push(i)
		                        if (!players[j].removeHealth()){
		                            delete players[j];
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

		var shoot = function(id) {
		    var x = players[id-1].x
		    var y = players[id-1].y
		    var angle = players[id-1].angle;

		    x += 30 * Math.sin(angle * Math.PI / 180);
		    y -= 30 * Math.cos(angle * Math.PI / 180); 

		    bullets.push(
		        [id, new component(100,100, imgPath + 'tankFire.png', x-25, y-24, "bullet", true, angle, -10)]
		    );
		}


		anexd.expect('action');
		$scope.$watch(
			function() {
				return anexd.getFromServer();	
			}, 
			function (data){
				if(data){
					if(data.event === 'action'){
						var mes = data.val;
						console.log(data.val)
						switch(mes.action){
							case 'clearmove':
								$scope.clearmove(mes.params[0], mes.player);
								break;
							case 'move':
								$scope.move(mes.params[0], mes.player);
								break;
							case 'shoot':
								shoot(mes.player);
								break;
						}

					}
				}
			}
		);

	}
])
.controller('MobileTankController', [
	'$scope',
	'ANEXDService',
    function ($scope, ANEXDService) {			
		var anexd = new ANEXDService();
		
		anexd.sendToServer('player');
		//delay to stop to many bullets

		var waitTime = 500;
		var waiter;

		var shooting = function(id) {
		    if (waiter == undefined) {
		    	var message = {
		    		action: 'shoot',
		    		params: []	
		    	};
		        //send shoot to socket here
		        anexd.sendToServer('action', message);
		        waiter = setTimeout(function(){
		            waiter = undefined;      
		        }, waitTime);
		    }
		};

		$scope.actions = function(act, params) {
			console.log('test');
			if (act === 'shooting') {
				shooting();
			}else{
				var message = {
		    		action: act,
		    		params: params	
		    	};
				//send to socket with params
				anexd.sendToServer('action', message);
			}
		};

    }
])
.directive('myTouchstart', [function() {
	//http://stackoverflow.com/questions/26170029/ng-touchstart-and-ng-touchend-in-angularjs
    return function(scope, element, attr) {

        element.on('touchstart', function(event) {
            scope.$apply(function() { 
                scope.$eval(attr.myTouchstart); 
            });
        });
    };
}])
.directive('myTouchend', [function() {
    return function(scope, element, attr) {

        element.on('touchend', function(event) {
            scope.$apply(function() { 
                scope.$eval(attr.myTouchend); 
            });
        });
    };
}]);
}());