var net = require('net');

var client = new net.Socket();
client.connect(1337, 'localhost', function() {
	console.log('Connected');
	client.write(new Buffer(JSON.stringify({'event': 'server'})));
});

var sendMes = function(mes) {
	client.write(new Buffer(JSON.stringify(mes)));
};


//tutorial from http://www.w3schools.com/games/default.asp

//TODO:
//backtrack amount bullet penertrates object.
//Only shoot 3/5 bullets then need a pause

//Partioned space size
const partitions = [6,6]; //x,y

//dev tools
var showPartitioning = true; // toggle p
var showBoundingBox = true; // toggle b

//canvas size
var canSize = [840, 740];
var cwidth = canSize[0];
var cheight = canSize[1];

var playerCount = 0;

//file paths
var imgPath = 'applications/15/resources/images/';
var tImgPath = imgPath + 'tank';
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
//arr stores all objects
var objects = [[],[],[]];

//global partition object
var partition;

// Builds the Environ with all the Objects
var createEnviron = function(){
    var w = cwidth;
    var h = cheight;

    //Draw L's
    var pd = [150, 80]; //padding [side, top]
    var s = [20,120];//shape size
    var o = [
        [pd[0], pd[1] + s[1], s[0], s[1], 270, "L"],
        [pd[0] + s[1],  h - pd[1], s[0], s[1], 180, "L"],
        [w - pd[0] - s[1], pd[1], s[0], s[1], 0, "L"],
        [w - pd[0], h - pd[1] - s[1], s[0], s[1], 90, "L"]
    ];

    for(var i=0,l=o.length; i<l; i++){
        var envOb = new EnvObjL(o[i][0], o[i][1], o[i][2], o[i][3], o[i][4], o[i][5])
        partition.addPartitPos(envOb.bMin, envOb.bMax, [1, objects[1].length]);
        objects[1].push(envOb);
    }

    //draw rect
    var s = [20, 120];//shape size
    var p = 40;
    var o = [
        [p, h/2 - s[1]/2, s[0], s[1], 0, "rect"],
        [w - p - s[0], h/2 - s[1]/2, s[0], s[1], 0, "rect"],
        [w/2 + s[1]/2, p, s[0], s[1], 90, "rect"],
        [w/2 + s[1]/2, h - p - s[0], s[0], s[1], 90, "rect"]
    ];

    for(var i=0,l=o.length; i<l; i++){
        var envOb = new EnvObjRect(o[i][0], o[i][1], o[i][2], o[i][3], o[i][4], o[i][5])
        partition.addPartitPos(envOb.bMin, envOb.bMax, [1, objects[1].length]);
        objects[1].push(envOb);
    }

    //draw plus
    var s = [20,150];//shape size
    var h2 = (s[1] - s[0]) / 2;
    var envOb = new EnvObjPlus(w/2 - s[0]/2,h/2 - (s[0]/2+h2),s[0],s[1],0,"plus")
    partition.addPartitPos(envOb.bMin, envOb.bMax, [1, objects[1].length]);
    objects[1].push(envOb);
};

//used later for instancing.
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
	if(!game.running) { //first player starts game
		gameInst = new game();
		gameInst.start();
	}
	var t = pInfo[playerCount]; //tank
    var tank = new Tank(60,60, t.colour.toLowerCase() + "Tank", t.pos.x, t.pos.y, t.initRot);
    partition.addPartitPos(tank.bMin, tank.bMax, [0, playerCount]);
    objects[0].push(tank);
    playerCount++;
};

//GAME COMPONENTS::
// Abstract - Component constructor
// @params width, height - size of object
// @params x,y - location of object
// @params type - "img", "L", "rect" etc
var Component = function(width, height, x, y, type){
    this.type = type;
    this.width = width;
    this.height = height;   
    this.x = x;
    this.y = y; 
};

// This contains all the methods and vars potaining to the tank.
// @param width, height, x, y - used for component constructor.
// @rotInit - value of which rotation of tank when first created.
var Tank = function(width, height, type, x, y, rotInit) {
    Component.call(this, width, height, x, y, type);

    // Bound vars
    this.bMin = [x,y];
    this.bMax = [x + width, y + height];

    this.speed = 0; 
    this.angle = 0 + rotInit;
    this.angleSpeed = 0;  
    this.health = 1;
    //when tank is hit.
    this.removeHealth = function() {
        this.health -= 1;
        return this.health;
    };
    //alter position of tank according to values.
    this.newPos = function() {
        this.angle += this.angleSpeed;
        if (this.angle >= 360)
            this.angle = (this.angle % 360);
        if (this.angle <= 0)
            this.angle = Math.abs(360 - this.angle);
        this.x -= this.speed * Math.sin(this.angle * Math.PI / 180);
        this.y += this.speed * Math.cos(this.angle * Math.PI / 180);  

        // Bound vars
        this.bMin = [this.x, this.y];
        this.bMax = [this.x + this.width, this.y + this.height];     
    };
    //any changes to x or y need to call update to change 
    //bounds aswell.
    this.update = function(){
        this.bMin = [this.x, this.y];
        this.bMax = [this.x + this.width, this.y + this.height];
    };
    //used for sending tank drawing info to main screen
    this.getData = function() {
        return [this.type, this.width, this.height, this.x, this.y, this.angle];
    };
};

// This contains all the methods and vars potaining to a bullet.
// @param width, height, x, y - used for component constructor.
// @param speed - inital speed of bullet.
// @param direction - the angle if will go in.
var Bullet = function(width, height, type, x, y, speed, direction) {
    Component.call(this, width, height, x, y, type);
    // Bound vars
    this.bMin = [x + width*0.35, y + height*0.35];
    this.bMax = [x + width*0.65, y + height*0.65];

    this.angle = 0 + direction;
    this.bounces = 3;
    this.speed = speed; 
    this.remBounce = function() {
        this.bounces -= 1;
        return this.bounces;
    } 
    this.newPos = function() {
        this.x -= this.speed * Math.sin(this.angle * Math.PI / 180);
        this.y += this.speed * Math.cos(this.angle * Math.PI / 180);  

        // Bound vars
        this.bMin = [this.x + this.width*0.35, this.y + this.height*0.35];
        this.bMax = [this.x + this.width*0.65, this.y + this.height*0.65];     
    } 
    this.getData = function() {
        return [this.type, this.width, this.height, this.x, this.y, 0];
    }
};

// This is for the shapes in the game such as rect, L and plus
// @param width, height, x, y - used for component constructor.
// @param rot - rotation of the shape.
var EnvObj = function(x, y, w, h, rot) {
    // Component.call(this, w, h, x, y, shape);

    this.width = w;
    this.height = h;   
    this.x = x;
    this.y = y; 

    // Bound vars
    this.bMin = [x,y];
    this.bMax = [x,y];
    // Method for Calulating mins and max of bound
    // @params x,y - x and y point
    this.minMaxBounds = function(x,y){
        if(x < this.bMin[0]) //minX
            this.bMin[0] = x;
        if(y < this.bMin[1]) //minY
            this.bMin[1] = y;
        if(x > this.bMax[0]) //maxX
            this.bMax[0] = x;
        if(y > this.bMax[1]) //maxY
            this.bMax[1] = y;
    };

    // This will distinguish how to swap x,y and minus them
    // Only rotates 90,180,270
    // x,y  == 1,2
    // @param rot - rotation in degrees
    this.howRotate = function(rot){
      switch(rot){
        case 0:
          return [1,2];
        case 90:
          return [2,-1];
        case 180:
          return [-1,-2];
        case 270:
          return [-2,1];
      }
    };

    // DEPRECATED
    // Simple check for shape to get points of
    // @param shape - the shape to get
    // @param w,h - params for shape method
    /*this.whichShape = function(shape,w,h){
        switch(shape){
            case "rect":
                return rectPoints(w,h);
            case "plus":
                return plusPoints(w,h);
            case "L": //not done yet
                return LPoints(w,h);
        }
    };*/

    // This will create a rectangle
    // @param x,y - pos of rect in canvas
    // @param w,h - width and height
    // @param rot - amount to rotate
    // @param shape - shape to be created
    this.createShape = function(p){
        // var p = this.whichShape(shape,w,h); 

        if(rot!=0){
            var rArr = this.howRotate(rot);
            //apply rotation to points

            for(var i=0,l=p[0].length; i<l; i++){
                if(rArr[0] < 0){//flip x
                    if(p[0][i]!=0)
                        p[0][i]*=-1;
                }
                if(rArr[1] < 0){//flip y
                    if(p[1][i]!=0)
                        p[1][i]*=-1;
                }

                if (Math.abs(rArr[0]) === 2) { //swap
                    var tmp =p[0][i];
                    p[0][i]= p[1][i] + this.x;
                    p[1][i]= tmp+this.y;
                }else{
                    p[0][i]+= this.x;
                    p[1][i]+= this.y;
                }

                this.minMaxBounds(p[0][i],p[1][i]);

            }   
        }else{
            //add x,y
            for(var i=0,l=p[0].length; i<l; i++){
                p[0][i]+= this.x;
                p[1][i]+= this.y;

                this.minMaxBounds(p[0][i],p[1][i]);
            } 
        }

        return p;
    };
    this.bBox = [];
    // this.points = this.createShape(x,y,w,h,rot,shape);

    //Method working working out where collision has happend
    //@params bMin, bMax - bounds first obj
    //@params bMins, bMaxs - bound second obj
    this.collisionCal = function(bMin, bMax, bMins, bMaxs){
        var diff = [
            Math.abs(bMins[1] - bMax[1]), //top
            Math.abs(bMaxs[1] - bMin[1]), //bot

            Math.abs(bMins[0] - bMax[0]), //left
            Math.abs(bMaxs[0] - bMin[0])  //right
        ];

        console.log(diff)

        var d = [[],[]];
        for(var i=0, j=0; i<2; i++, j+=2){
            if(diff[j] < diff[j+1]){
                d[i] = [diff[j], j];
            }else{
                d[i] = [diff[j+1], j+1];
            }
        }

        if(d[0][0] < d[1][0]){ //side coll
            return d[0];
        }else{ //top coll
            return d[1]; 
        }
    }
};

// This is for the environ rectangle shapes.
// @params all passed to EnvObj
var EnvObjRect = function(x, y, w, h, rot, shape){
    EnvObj.call(this, x, y, w, h, rot, shape);

    // Will return points to build a rect
    // @params w,h - width and height of shape
    this.rectPoints = function(w,h){
        return [
            [0,w,w,0],  //x
            [0,0,h,h] //y
        ];
    };

    // Check to see if two objects collide.
    // @param bMin, bMax - bounds of the object
    this.collision = function(bMin, bMax){
        if( this.bMax[0] > bMin[0] && 
            this.bMin[0] < bMax[0] &&
            this.bMin[1] < bMax[1] && 
            this.bMax[1] > bMin[1]){ //bounding box

            return this.collisionCal(bMin, bMax, this.bMin, this.bMax);
        }

        return -1; //no collision
    };
    this.points = this.createShape(this.rectPoints(this.width, this.height));

    //returns data need for drawing by the view.
    this.getData = function() {
        return ["envobj", this.points];
    }
};

// This is for the environ L shapes.
// @params all passed to EnvObj
var EnvObjL = function(x, y, w, h, rot, shape){
    EnvObj.call(this, x, y, w, h, rot, shape);

    // Will return points to build a rect
    // @params w,h - width and height of shape
    this.LPoints = function(w,l){
        return [
            [0, 0 + w, 0 + w, 0 + l, 0 + l, 0 + w, 0], //x
            [0, 0, 0 + (l-w), 0 + (l-w), 0 + l, 0 + l,  0 + l] //y
        ];
    };

    // Check to see if two objects collide.
    // @param bMin, bMax - bounds of the object
    this.collision = function(bMin, bMax){
        if( this.bMax[0] > bMin[0] && 
            this.bMin[0] < bMax[0] &&
            this.bMin[1] < bMax[1] && 
            this.bMax[1] > bMin[1]){ //bounding box

            //check collision with each shape part
            for(var k=0, l=this.subshapes.length; k<l; k++){
                var bMins = this.subshapes[k][0];
                var bMaxs = this.subshapes[k][1];

                if( bMax[0] > bMins[0] && 
                    bMin[0] < bMaxs[0] &&
                    bMin[1] < bMaxs[1] && 
                    bMax[1] > bMins[1]){

                    return this.collisionCal(bMin, bMax, bMins, bMaxs);
                           
                }
            }


        }

        return -1; //no collision
    };

    this.points = this.createShape(this.LPoints(this.width, this.height));

    //This will calculate bMin and bMax for that shape section.
    this.subshapes = function(p){
        //shapes indexs
        var shpIn = [
            [2, 3, 4, 5],
            [0, 1, 5, 6],
        ];

        var bounds = [];
        for(var i=0, l=shpIn.length; i<l; i++){ 
            
            var id = shpIn[i];
            
            var bound = [ 
                [p[0][id[0]], p[1][id[0]]], //bMin
                [p[0][id[0]], p[1][id[0]]], //bMax
            ];

            for(var j=0, l2=id.length; j<l2; j++){ //loop shpIn[i]
                if(p[0][id[j]] < bound[0][0]){ //xmin
                    bound[0][1] = p[0][id[j]];
                }
                if(p[1][id[j]] < bound[0][1]){ //ymin
                    bound[0][1] = p[1][id[j]];
                }
                if(p[0][id[j]] > bound[1][0]){ //xmax
                    bound[1][0] = p[0][id[j]];
                }
                if(p[1][id[j]] > bound[1][1]){ //ymax
                    bound[1][1] = p[1][id[j]];
                }
            }
            bounds.push(bound);
        }
        return bounds;
    }(this.points);

    //returns data need for drawing by the view.
    this.getData = function() {
        return ["envobj", this.points];
    }
};

// This is for the environ + shape.
// @params all passed to EnvObj
var EnvObjPlus = function(x, y, w, h, rot, shape){
    EnvObj.call(this, x, y, w, h, rot, shape);
    // Will return points to build a plus shape
    // @params w,l - width and length of shape
    this.plusPoints = function(w,l){
        var h = (l - w) / 2

        return [
            [0, 0 + w, 0 + w, 0 + w + h, 0 + w + h, 0 + w, 0 + w, 0, 0, 0 - h, 0 - h, 0], //x
            [0, 0, 0 + h, 0 + h, 0 + h + w, 0 + h + w, 0 + h + w + h, 0 + h + w + h, 0 + w + h, 0 + w + h, 0 + h, 0 + h] //y
        ]
    };

    // Check to see if two objects collide.
    // Sends back dir and amount penertrated so back backtrack.
    // @param bMin, bMax - bounds of the object
    this.collision = function(bMin, bMax){
        if( this.bMax[0] > bMin[0] && 
            this.bMin[0] < bMax[0] &&
            this.bMin[1] < bMax[1] && 
            this.bMax[1] > bMin[1]){ //bounding box

            //check collision with each shape part
            for(var k=0, l=this.subshapes.length; k<l; k++){
                var bMins = this.subshapes[k][0];
                var bMaxs = this.subshapes[k][1];

                if( bMax[0] > bMins[0] && 
                    bMin[0] < bMaxs[0] &&
                    bMin[1] < bMaxs[1] && 
                    bMax[1] > bMins[1]){

                    return this.collisionCal(bMin, bMax, bMins, bMaxs);
                           
                }
            }

        }

        return -1; //no collision
    };

    this.points = this.createShape(this.plusPoints(this.width, this.height));

    //This will calculate bMin and bMax for that shape section.
    this.subshapes = function(p){
        //shapes indexs
        var shpIn = [
            [0, 1, 2, 11],
            [2, 3, 4, 5],
            [5, 6, 7, 8],
            [8, 9, 10, 11]
        ];

        var bounds = [];
        for(var i=0, l=shpIn.length; i<l; i++){ 
            
            var id = shpIn[i];
            
            var bound = [ 
                [p[0][id[0]], p[1][id[0]]], //bMin
                [p[0][id[0]], p[1][id[0]]], //bMax
            ];

            for(var j=0, l2=id.length; j<l2; j++){ //loop shpIn[i]
                if(p[0][id[j]] < bound[0][0]){ //xmin
                    bound[0][1] = p[0][id[j]];
                }
                if(p[1][id[j]] < bound[0][1]){ //ymin
                    bound[0][1] = p[1][id[j]];
                }
                if(p[0][id[j]] > bound[1][0]){ //xmax
                    bound[1][0] = p[0][id[j]];
                }
                if(p[1][id[j]] > bound[1][1]){ //ymax
                    bound[1][1] = p[1][id[j]];
                }
            }
            bounds.push(bound);
        }
        return bounds;
    }(this.points);

    //returns data need for drawing by the view.
    this.getData = function() {
        return ["envobj", this.points];
    }
};

// Object inheritence setup.
Tank.prototype = Object.create(Component.prototype);
Bullet.prototype = Object.create(Component.prototype);
// EnvObj.prototype = Object.create(Component.prototype);

Tank.prototype.constructor = Tank;
Bullet.prototype.constructor = Bullet;
// EnvObj.prototype.constructor = EnvObj;

EnvObjRect.prototype = Object.create(EnvObj.prototype);
EnvObjL.prototype = Object.create(EnvObj.prototype);
EnvObjPlus.prototype = Object.create(EnvObj.prototype);

EnvObjRect.prototype.constructor = EnvObjRect;
EnvObjL.prototype.constructor = EnvObjL;
EnvObjPlus.prototype.constructor = EnvObjPlus;

// This is the partitioning of space for objects
// stored in a 2d array.
// @params w,h - size of the partioned space.
var Partition = function(w,h){
    // initlises the array to the size specified.
    this.pArr = function(){
        var pArr = new Array(w);
        for (var i = 0; i < w; i++) {
            pArr[i] = new Array(h);
            for (var j = 0; j < h; j++) {
                pArr[i][j] = new Array();
            }
        }
        return pArr;
    }();
    
    // This checks the which partitions the given points fall in
    // @params bMin, bMax - are 2d array of coords from objects
    this.checkPartitPos = function(bMin, bMax){
        var partSize = [
            canSize[0] / partitions[0],
            canSize[1] / partitions[1]
        ]

        //build bounds
        var bpoints = [
            [bMin[0], bMin[1]],
            [bMin[0], bMax[1]],
            [bMax[0], bMin[1]],
            [bMax[0], bMax[1]]
        ] 

        var parts = {};
        for(var i=0, l=bpoints.length; i<l; i++){
            var index = [];
            //check part is in arr bounds
            for(var j=0, l2=bpoints[i].length; j<l2; j++){
                var part = Math.floor(bpoints[i][j] / partSize[j]);

                if(part < 0)
                    part = 0;
                if(part >= partitions[j])
                    part = partitions[j] - 1;
                index.push(part);
            }
            //add key if x doesnt exist
            if(!(index[0] in parts)){
                parts[index[0]] = [index[1]];
            }else{
                //check y doesnt already exist
                if(parts[index[0]].indexOf(index[1]) == -1) //doesnt exist
                    parts[index[0]].push(index[1]) //so add it
            }
        }    
        return parts
    };

    // This will add an object to the partition spaces.
    // @param bMin, bMax - used to cal points used in checkPartitPos.
    // @param index - index of object in the objects array.
    this.addPartitPos = function(bMin, bMax, index){
        var pos = this.checkPartitPos(bMin, bMax);

        for (var key in pos) {
            for(var i=0, l=pos[key].length; i<l; i++){
                var j = pos[key][i];
                if(this.pArr[key][j] === undefined){
                    this.pArr[key][j] = [];
                }
                this.pArr[key][j].push(index);
            }
        }        
    };

    // This will remove the ohject from the partition arr
    // @param obj - the object to be removed
    this.removeObject = function(obj, index){
        var parts = this.checkPartitPos(obj.bMin, obj.bMax);

        for(key in parts){
            for(var i=0, l=parts[key].length; i<l; i++){
                var val = parts[key][i];
                var id = this.searchIndex(key,val,index);
                this.pArr[key][val].splice(id, 1);
                // delete this.pArr[key][val][id];
            }
        }
    }

    // This will update the position of moving objects in the partition 
    // space.
    // @param oldPos - has old location of parts.
    // @param bMin, bMax - make new part locations.
    // @param index - location of object in objects array.
    this.changePartitPos = function(oldPos, bMin, bMax, index){
        var newPos = this.checkPartitPos(bMin, bMax);

        for(var key in oldPos){
            if(key in newPos){ //share keys
                //check arr at oldPos[key]
                for(var i=0, l=oldPos[key].length; i<l; i++){
                    var id = newPos[key].indexOf(oldPos[key][i]);
                    if(id == -1){ //remove old
                        var val = oldPos[key][i];
                        this.pArr[key][val].splice(this.searchIndex(key,val,index), 1);
                    }else{ //does exist already in space
                        newPos[key].splice(id,1);
                    }
                }
            }else{
                //remove all occ from pArr at index
                for(var i=0, l=oldPos[key].length; i<l; i++){
                    var id = oldPos[key][i];
                    this.pArr[key][id].splice(this.searchIndex(key,id,index), 1);
                }
            }
        }

        //loop rest key if any in newPos
        for(var key in newPos){
            for(var i=0, l=newPos[key].length; i<l; i++){
                var val = newPos[key][i];
                this.pArr[key][val].push(index);
            }
        }
    };

    //Search for the object in a space using its index.
    //@param x,y - space location.
    //@param index - object index in space.
    this.searchIndex = function(x,y,index){
        var arr = this.pArr[x][y];
        for(var i=0, l=arr.length; i<l; i++){
            if(arr[i][0]==index[0])
                if(arr[i][1]==index[1])
                    return i;
        }
    };
};

// Updates all the objects
var updateGameArea = function() {
    // Update the players/tanks
    for(var i =0; i< objects[0].length;i++){
        //stop leaving game area
        if (objects[0][i] != undefined) {
            
            var p = objects[0][i];
            var oldpos = partition.checkPartitPos(objects[0][i].bMin, objects[0][i].bMax);

            var outB = false;
            if("0" in oldpos){ //check left canvas bound
                if (p.x <= 0) {
                    objects[0][i].x = 1;
                    objects[0][i].speed = 0;
                    outB = true;
                }
            }

            if("5" in oldpos){ //check right canvas bound
                if (p.x + p.width >= myGameArea.canvas.width){
                    objects[0][i].x = myGameArea.canvas.width - p.width - 1;
                    objects[0][i].speed = 0;
                    outB = true;
                }
            }

            //check tank with canvas bounds.
            for(key in oldpos){
                if(oldpos[key].indexOf(0) !== -1){ //check top canvas bound
                    if (p.y <= 0){
                        objects[0][i].y = 1;
                        objects[0][i].speed = 0;
                        outB = true;
                    } 
                }else if(oldpos[key].indexOf(5) !== -1){
                    if (p.y + p.height >= myGameArea.canvas.height){ //check bottom canvas bound
                        objects[0][i].y = myGameArea.canvas.height - p.height - 1;
                        objects[0][i].speed = 0;
                        outB = true;
                    }
                }

                //Tank collision with environment
                for(var j=0, l=oldpos[key].length; j<l; j++){ //loop y
                    var id = oldpos[key][j];
                    var objs = partition.pArr[key][id];
                    for(var k=0, m=objs.length; k<m; k++){ //loop objs in partition space.
                        if(objs[k][0] === 1){ //env obj
                            var index = objs[k][1];
                            var dir = objects[1][index].collision(objects[0][i].bMin, objects[0][i].bMax);

                            if(dir !== -1){ //collision
                                outB = true;
                            }

                            if(dir[1] < 2 && dir[1] !== -1){ //height collision
                                if(dir[1] == 0){//top
                                    objects[0][i].y -= (dir[1] + 1) * 2; //rem penertration
                                }
                                if(dir[1] == 1){//bottom
                                    objects[0][i].y += dir[1] * 2; //rem penertration
                                }
                            }else if(dir[1] >= 2  ){ //side collision
                                if(dir[1] === 2){//right
                                    objects[0][i].x -= dir[1] * 2; //rem penertration
                                }
                                if(dir[1] === 3){//left
                                    objects[0][i].x += dir[1] * 2; //rem penertration
                                }
                            }
                            objects[0][i].update();

                        }
                    }
                }


            }


            if(!outB){ //only change pos if not on bound
                objects[0][i].newPos();
                partition.changePartitPos(oldpos, objects[0][i].bMin, objects[0][i].bMax, [0,i]);
            }
        }
    }

    //update the bullets
    var remBullet = [];
    for(var i =0; i< objects[2].length;i++){
        if (objects[2][i] != undefined) {
            var del = true;
            var oldpos = partition.checkPartitPos(objects[2][i][1].bMin, objects[2][i][1].bMax);
            objects[2][i][1].newPos();
            var newpos = partition.checkPartitPos(objects[2][i][1].bMin, objects[2][i][1].bMax);
            partition.changePartitPos(oldpos, objects[2][i][1].bMin, objects[2][i][1].bMax, [2,i]);

            var b = objects[2][i][1];

            //Check canvas bounds
            if(0 in newpos || 5 in newpos){ //check side canvas bounds
                if (b.x + b.width/2 > myGameArea.canvas.width || b.x + b.width/2 < 0){
                    objects[2][i][1].angle = 360 - (b.angle);
                    
                    if(del && objects[2][i][1].remBounce() == 0)
                        del = false;
                }
            }

            for(key in newpos){
                if(newpos[key].indexOf(0) != -1 || newpos[key].indexOf(5) != -1){ //check height canvas bounds
                    if (b.y + b.height/2 > myGameArea.canvas.height || b.y + b.height/2 < 0 ){
                        if (b.angle > 180){
                            objects[2][i][1].angle = 360 + (180 - (b.angle));
                        }else{
                            objects[2][i][1].angle = 180 - (b.angle);
                        }

                        if(del && objects[2][i][1].remBounce() == 0)
                            del = false;
                    }
                    break;
                }
            }

            //Check EnvObj collision
            for(key in newpos){ //loop x
                for(var j=0, l=newpos[key].length; j<l; j++){ //loop x
                    var id = newpos[key][j];
                    var objs = partition.pArr[key][id];
                    for(var k=0, m=objs.length; k<m; k++){
                        if(objs[k][0] === 1){ //env obj
                            var index = objs[k][1];
                            var dir = objects[1][index].collision(b.bMin, b.bMax);

                            //could do with a clean up
                            if(dir[1] < 2 && dir[1] !== -1){ //height collision
                                //change angle
                                if (b.angle > 180){
                                    objects[2][i][1].angle = 360 + (180 - (b.angle));
                                }else{
                                    objects[2][i][1].angle = 180 - (b.angle);
                                }
                                //check bounces
                                if(del && objects[2][i][1].remBounce() == 0)
                                    del = false;
                                //move back to point of collision
                                if(dir[0] === 1){//top
                                    objects[2][i][1].y -= dir[1]; //rem penertration
                                }
                                if(dir[0] === 1){//bottom
                                    objects[2][i][1].y += dir[1]; //rem penertration
                                }
                            }else if(dir[1] >= 2  ){ //side collision
                                //change angle
                                objects[2][i][1].angle = 360 - (b.angle);
                                //check bounces
                                if(del && objects[2][i][1].remBounce() == 0)
                                    del = false;
                                //move back to point of collision
                                if(dir[0] === 2){//right
                                    objects[2][i][1].x -= dir[1]; //rem penertration
                                }
                                if(dir[0] === 3){//left
                                    objects[2][i][1].x += dir[1]; //rem penertration
                                }
                            }

                        }
                    }
                }
            }

            //check if it hits players
            //remove that bullet and player
            for(var j =0; j < objects[0].length; j++){
                var p = objects[0][j];
                if(p != undefined){
                    if((b.x + b.width/2 >= p.x && b.y + b.height/2 >= p.y) && 
                       (b.x + b.width/2 <= p.x + p.width && b.y + b.height/2 <= p.y + p.height)&&
                       j != objects[2][i][0]){
                        //hit
                        if(del)
                            del = false; //rem bullet
                        if (!objects[0][j].removeHealth()){ //checks and removes health
                            partition.removeObject(p, [0, j]);
                            delete objects[0][j];
                            // var nodes = document.getElementById("p"+(j+1)).getElementsByTagName('*'); //used for dev
                            for(var t = 0; t < nodes.length; t++)
                                 nodes[t].disabled = true;
                        }
                    }
                }
            }

            if(!del)
                remBullet.push(i);
        }
    }
    for(var i =0; i< remBullet.length;i++){
        var id = remBullet[i];
        partition.removeObject(objects[2][id][1], [2, id]);
        objects[2].splice(remBullet[i], 1);
    }
    sendChanges();
};

var sendChanges = function() {
	//loop through players and bullets
	var objs = [];
	for(var i=0, l=objects.length; i<l; i++){
		for(var j=0, l2=objects[i].length; j<l2; j++){
			if(i == 2)
				objs.push(objects[i][1].getData());
			else
				objs.push(objects[i].getData());
		}
	}
	//host.emit('changes', objects);
	sendMes({
		event: "msgplayer",
		'player': 0,
		'msg': {
			'event': "changes",
			data: objs 
		}
	});
	//console.log('the object', objects)
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
    var x = objects[0][id].x
    var y = objects[0][id].y
    var angle = objects[0][id].angle;

    //                  width, height, type, x, y, speed, direction
    var bull = new Bullet(100,100, 'bullet', x-25, y-24, -10, angle);
    partition.addPartitPos(bull.bMin, bull.bMax, [2, objects[2].length]);
    objects[2].push(
        [id, bull]
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
client.on('data', function (data) { 
	var data = JSON.parse(data).msg;

	//host player 0

	if(data.event === "player"){
		console.log('player connection!');
		sendMes({
			event:'playerCol',
			val: pInfo[playerCount].colour
		})
		addPlayer();
		//playerCount++;		
	}

	if(data.event === "action"){
		console.log(data);
		data.val.player = 0; //hardcoded
		console.log('action', data.val);
		console.log('action', data.val);
		actions(data.val);
	}
});