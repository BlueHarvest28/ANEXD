(function () {
'use strict';
angular.module('ANEXD')
.controller('TankController', [
	'$scope',
	'ANEXDService',
	'$timeout',
    function ($scope, ANEXDService, $timeout) {
		var anexd = new ANEXDService();
		
		anexd.sendToServer('ishost');

		//load sprites
		var tyel = new Image();    
	    var tred = new Image();
        var tblu = new Image();
        var tgre = new Image();
        var bull = new Image();
        var grou = new Image();
	    tyel.src = 'applications/15/resources/images/tankYellow.png';
        tred.src = 'applications/15/resources/images/tankRed.png';
        tblu.src = 'applications/15/resources/images/tankBlue.png';
        tgre.src = 'applications/15/resources/images/tankGreen.png';
        bull.src = 'applications/15/resources/images/tankFire.png';
	    grou.src = 'applications/15/resources/images/ground.png';

		//tutorial from http://www.w3schools.com/games/default.asp
		var myGameArea = {
		    canvas : document.getElementById("canvas"),
		    start : function() {
		    	this.canvas.width = 840;
		    	this.canvas.height = 740;
		        this.context = this.canvas.getContext("2d");
		        this.frameNo = 0;
		        width = myGameArea.canvas.width;
				height = myGameArea.canvas.height;
		    },
		    clear : function() {
		        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		    }
		};

		var width = myGameArea.canvas.width;
		var height = myGameArea.canvas.height;
		
		//     0            1           2         3      4          5
		//[this.width, this.height, this.type, this.x, this.y, this.angle];
		var drawBullet = function(info){
	        var ctx = myGameArea.context;
            ctx.drawImage(bull, 
                info[3], 
                info[4],
                info[0], info[1]);
		}

		var drawTank = function(info){

			var img;
			switch(info[2]){
				case "yellowTank":
					img = tyel;
					break;
				case "greenTank":
					img = tgre;
					break;
				case "redTank":
					img = tred;
					break;
				case "blueTank":
					img = tblu;
					break;
			}
	        var ctx = myGameArea.context;

	        ctx.save();
	        ctx.translate(info[3] + info[0]/2, info[4] + info[1]/2);
	        ctx.rotate(info[5]  * Math.PI / 180);     
	        ctx.translate(-(info[3] + info[0]/2), -(info[4]  + info[1]/2));
        	ctx.drawImage(img, 
                info[3], 
                info[4],
                info[0], info[1]);
	        ctx.restore();
		};

		var drawGround = function(){
			myGameArea.context.fillStyle = myGameArea.context.createPattern(grou, 'repeat');
		    myGameArea.context.fillRect(0, 0, myGameArea.canvas.width, myGameArea.canvas.height);
		}

		$scope.startGame = function(){
			myGameArea.start();
			grou.onload = function() {
	        	drawGround();
			}
		};

		$timeout(function(){
	        $scope.startGame();
	    });

/*		//canvas width set from server
		anexd.expect('canvas');
		$scope.$watch(
			function() {
				return anexd.getFromServer();	
			}, 
			function (data){
				if(data && data.event === 'canvas'){
					console.log('Canvas init message', data);
					myGameArea.canvas.width = data.val[0];
					myGameArea.canvas.height = data.val[1];
				}
			}
		);*/

		//canvas width set from server
		anexd.expect('action');
		anexd.expect('changes');
		$scope.$watch(
			function() {
				return anexd.getFromServer();	
			}, 
			function (data){
				if(data){ 
					if(data.event === 'changes'){
						drawing(data.val)	
					}
				}
			}
		);

		var drawing = function(data) {
			var objects = data;
			console.log('the data ', objects)
			myGameArea.clear();
			drawGround();
			for(var i = 0; i < objects.length; i++){
				if(objects[i][2] === "yellowTank" ||
				objects[i][2] === "greenTank" ||
				objects[i][2] === "blueTank" ||
				objects[i][2] === "redTank"){
					drawTank(objects[i]);
				}else if(objects[i][2] === "bullet"){
					drawBullet(objects[i]);
				}else{
					//error
				}
			}
		};
	}
])
.controller('MobileTankController', [
	'$scope',
	'ANEXDService',
	'$cookies',
    function ($scope, ANEXDService, $cookies) {			
		var anexd = new ANEXDService();
		
		//var test = $cookies.getObject('colour');
		var colour = $cookies.get('colour')
		if (colour === undefined) {
			anexd.sendToServer('player');
		}else {
			$scope.colour = colour;
		}


		//$scope.colour = $cookies.getObject('colour')
		//canvas width set from server
		anexd.expect('playerCol');
		$scope.$watch(
			function() {
				return anexd.getFromServer();	
			}, 
			function (data){
				if(data && data.event === 'playerCol'){
					console.log('got the player connect message', data);
					$cookies.put('colour', data.val);
					$scope.colour = data.val.toLowerCase();	
				}
			}
		);

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
				console.log('shoot');
		        anexd.sendToServer('action', message);
		        waiter = setTimeout(function(){
		            waiter = undefined;      
		        }, waitTime);
		    }
		};

		$scope.actions = function(act, params) {
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
//http://stackoverflow.com/questions/26170029/ng-touchstart-and-ng-touchend-in-angularjs
.directive('myTouchstart', [function() {
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