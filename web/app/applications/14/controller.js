(function () {
'use strict';
angular.module('ANEXD')
.controller('ImageAnnotateController', [
	'$scope',
	'Upload',
	'ANEXDService',
	'$document',
	'$rootScope',
	function ($scope, Upload, ANEXDService, $rootScope) {
		var anexd = new ANEXDService();
		//Change temporarily for testing
		$scope.done = false;
		$scope.imageURL;
		//anexd.sendToServer('image', $scope.imageURL);
		
		$scope.upload = function(image) {
			$scope.inProgress = true;
			Upload.upload({
				url: 'https://api.imgur.com/3/image',
				type: 'POST',
				headers: {
					Authorization: 'Client-ID e4e0190ea81d9c7'
				},
				data: {
					type: image.type,
					image: image
				},
				dataType: 'json'
			}).then(function (data) {
				$scope.done = true;
				$scope.imageURL = data.data.data.link;
				anexd.sendToServer('image', $scope.imageURL);
				$scope.inProgress = false;
			}, function (error) {
				console.log(error);
				$scope.inProgress = false;
			}, function (event) {
				$scope.progress = parseInt(100.0 * event.loaded / event.total);
			});
		};
		
		anexd.expect('drawing');
		$scope.$watch(
			function() {
				return anexd.getFromServer();	
			}, 
			function (data){
				if(data){
					if(data.event === 'drawing'){
						console.log(data.val);
						$scope.$broadcast('drawLine', data.val);
					}
				}
			}
		);
	}
])
.controller('MobileImageAnnotateController', [
	'$scope',
	'ANEXDService',
	function ($scope, ANEXDService) {
		var anexd = new ANEXDService();
		$scope.image;
		$scope.edit = false;
		$scope.showMenu = false;
		
		anexd.expect('image');
		$scope.$watch(
			function() {
				return anexd.getFromServer();	
			}, 
			function (data){
				if(data){
					if(data.event === 'image'){
						$scope.image = data.val;
					}
				}
			}
		);
		
		$scope.selectedColour = 'blue';
		
		$scope.toggleEdit = function(){
			$scope.editing = !$scope.editing;
		};
		
		$scope.sendDrawing = function(coords){
			anexd.sendToServer('drawing', coords);
		};
		
		$scope.undo = function(){
			$scope.$broadcast('undo');	
		};
		
		$scope.selectColour = function(colour){
			$scope.selectedColour = colour;
			$scope.$broadcast('colour', $scope.selectedColour);
		};
	}
])
.directive("posting", function () {
	return {
		restrict: "A",
		scope: {
			image : '='
		},
		link: function (scope, element, attrs) {
			var canvas = element[0];
			var ctx = canvas.getContext('2d');
			
			scope.$watch('image', function(image){
				if(image){
					var image = new Image();
					image.onload = function() {
						var width = image.naturalWidth;
						var height = image.naturalHeight;
						var maxWidth = 840;
						
						if(width > maxWidth) {
							height = height * (maxWidth / width);
							width = maxWidth;
						}
						
						canvas.width = width;
						canvas.height = height;
						ctx.drawImage(image, 0, 0, width, height);
						ctx.lineWidth = 5;
						ctx.lineJoin = 'round';
						ctx.lineCap = 'round';
						ctx.strokeStyle = 'blue';
					};
				
					image.src= scope.image;	
				}	
			});
			
			scope.$on('drawLine', function(event, coords){
				ctx.strokeStyle = coords.colour;
				ctx.beginPath();
				ctx.moveTo(coords.lastx, coords.lasty);
				ctx.lineTo(coords.x, coords.y);
				ctx.closePath();
				ctx.stroke();
			});
			
		}
	};
})
.directive("drawing", function () {
	return {
		restrict: "A",
		scope: {
			image : '=',
			editing: '=',
			callback: '&',
		},
		link: function (scope, element, attrs) {
			var canvas = element[0];
			var ctx = canvas.getContext('2d');
			var width;
			var height;
			var colour;
			var undoList = [];
			
			var image = new Image();
			image.onload = function() {
				width = image.naturalWidth;
				height = image.naturalHeight;
				var maxWidth = 840;
				
				if(width > maxWidth) {
					height = height * (maxWidth / width);
					width = maxWidth;
				}
				
				canvas.width = width;
				canvas.height = height;
				ctx.drawImage(image, 0, 0, width, height);
				ctx.lineWidth = 5;
				ctx.lineJoin = 'round';
				ctx.lineCap = 'round';
				colour = 'blue';
			};
			
			image.src= scope.image;
			
			// the last coordinates before the current move
			var lastx;
			var lasty;
			var x;
			var y;
			
			scope.$on('colour', function(event, newColour){
				colour = newColour;
			});
			
			scope.$on('undo', function(){
				if(undoList.length){
					var state = undoList.pop();
					var stateImage = new Image()
					stateImage.onload = function() {
						ctx.clearRect(0, 0, width, height);
						ctx.drawImage(stateImage, 0, 0, width, height);
					};
					stateImage.src = state;	
				}
			});
			
			element.bind('touchstart', function (event) {
				//TODO: SAVE STATE HERE FOR UNDO	
				//undoList.push(canvas.toDataURL());
				if(scope.editing){
					var touchEvent = event.originalEvent.changedTouches[0];
					lastx = touchEvent.pageX - event.target.offsetLeft + canvas.parentElement.scrollLeft;
					lasty = touchEvent.pageY - event.target.offsetTop + canvas.parentElement.scrollTop;
				}
			});

			element.bind('touchmove', function (event) {
				if(scope.editing){
					event.preventDefault();
					var touchEvent = event.originalEvent.changedTouches[0];
					x = touchEvent.pageX - event.target.offsetLeft + canvas.parentElement.scrollLeft;
					y = touchEvent.pageY - event.target.offsetTop + canvas.parentElement.scrollTop;
					draw();
					lastx = x;
					lasty = y;
				}
			});
			
			function draw(){
				ctx.strokeStyle = colour;
				scope.callback({coords: {'x': x, 'y': y, 'lastx': lastx, 'lasty': lasty, 'colour': colour}});
				ctx.beginPath();
				ctx.moveTo(lastx, lasty);
				ctx.lineTo(x, y);
				ctx.closePath();
				ctx.stroke();
			};
		}
	};
});
}());