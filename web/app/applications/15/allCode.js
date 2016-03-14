<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
canvas {
    border:1px solid #d3d3d3;
    background-color: #f1f1f1;
}
</style>
</head>
<body onload="startGame()">
<script>

//tutorial from http://www.w3schools.com/games/default.asp


//TODO:
//Remove bullets when they exceed the canvas dimensions
//Only shoot 3/5 bullets then need a pause
//Delay after shooting

var players = [];
var bullets = [];
var myGameFloor;

var canvasSize = [840,470];

function startGame() {
    var width = canvasSize[0];
    var height = canvasSize[1];

    myGameFloor = new component(0, 0, 'resources/images/ground.png', 0, 0, "background", false, 0, 0);

    players.push(new component(60, 60, 'resources/images/tankGreen.png', 2, 2, "image", true, 135, 0));
    players.push(new component(60, 60, 'resources/images/tankYellow.png', 2, height -62, "image", true, 45, 0));
    players.push(new component(60, 60, 'resources/images/tankRed.png', width -62, 2, "image", true, 225, 0));
    players.push(new component(60, 60, 'resources/images/tankBlue.png', width -62, height -62, "image", true, 325, 0));
    myGameArea.start();
}

var myGameArea = {
    canvas : document.createElement("canvas"),
    start : function() {
        this.canvas.width = canvasSize[0];
        this.canvas.height = canvasSize[1];
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.frameNo = 0;
        this.interval = setInterval(updateGameArea, 20);
        
        window.addEventListener('keydown', function (e) {
		    if (e.keyCode == 87) {var l = document.getElementById('up'); l.onmousedown(); }
		    if (e.keyCode == 83) {var m = document.getElementById('down'); m.onmousedown(); }
	        if (e.keyCode == 65) {var n = document.getElementById('left'); n.onmousedown(); }
            if (e.keyCode == 68) {var o = document.getElementById('right'); o.onmousedown(); }
		    if (e.keyCode == 32) {var o = document.getElementById('shoot'); o.onmousedown(); }
        })
        window.addEventListener('keyup', function (e) {
		    if (e.keyCode == 87) {var l = document.getElementById('up'); l.onmouseup(); }
		    if (e.keyCode == 83) {var m = document.getElementById('down'); m.onmouseup(); }
	        if (e.keyCode == 65) {var n = document.getElementById('left'); n.onmouseup(); }
		    if (e.keyCode == 68) {var o = document.getElementById('right'); o.onmouseup(); }
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
        ctx = myGameArea.context;
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

function move(dir, i) {
    var movSpeed = 2;
    if (dir == "up") { players[i-1].speed = movSpeed * -1; }
    if (dir == "down") { players[i-1].speed = movSpeed; }
    if (dir == "left") { players[i-1].angleSpeed = -3; }
    if (dir == "right") { players[i-1].angleSpeed = 3; }
}

function clearmove(dir, i) { 
    players[i-1].speed = 0; 
    players[i-1].angleSpeed = 0; 
}

var waitTime = 500;
var waiter;

//delay to stop to many bullets
function shooting(id){
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
        [id, new component(100,100, 'resources/images/tankFire.png', x-25, y-24, "bullet", true, angle, -10)]
    );
}

</script>
<div id="p1" style="float:left;text-align:center;width:180px;">
<p>p1/ Gre<p>
<button id="up" onmousedown="move('up',1)" onmouseup="clearmove('up',1)" ontouchstart="move('up')">UP</button><br><br>
<button id="left" onmousedown="move('left',1)" onmouseup="clearmove('left',1)" ontouchstart="move('left')">LEFT</button>
<button id="right" onmousedown="move('right',1)" onmouseup="clearmove('right',1)" ontouchstart="move('right')">RIGHT</button><br><br>
<button id="down" onmousedown="move('down',1)" onmouseup="clearmove('down',1)" ontouchstart="move('down')">DOWN</button><br><br>
<button id="shoot" onmousedown="shooting(1)" ontouchstart="shooting(1)">Shoot</button>
</div>

<div id="p2" style="float:left;text-align:center;width:180px;">
<p>p2/ Yel<p>
<button id="up2" onmousedown="move('up',2)" onmouseup="clearmove('up',2)" ontouchstart="move('up',2)">UP</button><br><br>
<button id="left2" onmousedown="move('left',2)" onmouseup="clearmove('left',2)" ontouchstart="move('left',2)">LEFT</button>
<button id="right2" onmousedown="move('right',2)" onmouseup="clearmove('right',2)" ontouchstart="move('right',2)">RIGHT</button><br><br>
<button id="down2" onmousedown="move('down',2)" onmouseup="clearmove('down',2)" ontouchstart="move('down',2)">DOWN</button><br><br>
<button id="shoot2" onmousedown="shooting(2)" ontouchstart="shooting(2)">Shoot</button>
</div>

<div id="p3" style="float:left;text-align:center;width:180px;">
<p>p3/ Red<p>
<button id="up3" onmousedown="move('up',3)" onmouseup="clearmove('up',3)" ontouchstart="move('up',3)">UP</button><br><br>
<button id="left3" onmousedown="move('left',3)" onmouseup="clearmove('left',3)" ontouchstart="move('left',3)">LEFT</button>
<button id="right3" onmousedown="move('right',3)" onmouseup="clearmove('right',3)" ontouchstart="move('right',3)">RIGHT</button><br><br>
<button id="down3" onmousedown="move('down',3)" onmouseup="clearmove('down',3)" ontouchstart="move('down',3)">DOWN</button><br><br>
<button id="shoot3" onmousedown="shooting(3)" ontouchstart="shooting(3)">Shoot</button>
</div>

<div id="p4" style="float:left;text-align:center;width:180px;" disabled>
<p>p4/ Blu<p>
<button id="up4" onmousedown="move('up',4)" onmouseup="clearmove('up',4)" ontouchstart="move('up',4)">UP</button><br><br>
<button id="left4" onmousedown="move('left',4)" onmouseup="clearmove('left',4)" ontouchstart="move('left',4)">LEFT</button>
<button id="right4" onmousedown="move('right',4)" onmouseup="clearmove('right',4)" ontouchstart="move('right',4)">RIGHT</button><br><br>
<button id="down4" onmousedown="move('down',4)" onmouseup="clearmove('down',4)" ontouchstart="move('down',4)">DOWN</button><br><br>
<button id="shoot4" onmousedown="shooting(4)" ontouchstart="shooting(4)">Shoot</button>
</div>

</body>
</html>