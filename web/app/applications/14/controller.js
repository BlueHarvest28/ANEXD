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
		//Temporary for testing
		$scope.done = true;
		$scope.editing = true;
		$scope.imageURL = 'images/image-annotate-tile.png';
		
		anexd.sendToServer('image', $scope.imageURL);
		
		$scope.upload = function(image) {
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
			}, function (error) {
				console.log(error);
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
		
		$scope.toggleEdit = function(){
			$scope.editing = !$scope.editing;
		};
		
		$scope.sendDrawing = function(coords){
			anexd.sendToServer('drawing', coords);
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
			var image = new Image();
			image.onload = function() {
				var width = image.naturalWidth;
				var height = image.naturalHeight;
				canvas.height = height;
				canvas.width = width;
				ctx.drawImage(image, 0, 0);
				ctx.lineWidth = 5;
				ctx.lineJoin = 'round';
				ctx.lineCap = 'round';
				ctx.strokeStyle = 'blue';
			};
			
			image.src= scope.image;
			
			scope.$on('drawLine', function(event, coords){
				console.log('drawing:', coords);
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
			callback: '&'
		},
		link: function (scope, element, attrs) {
			var canvas = element[0];
			var ctx = canvas.getContext('2d');
			
			var image = new Image();
			image.onload = function() {
				var width = image.naturalWidth;
				var height = image.naturalHeight;
				canvas.height = height;
				canvas.width = width;
				ctx.drawImage(image, 0, 0);
				ctx.lineWidth = 5;
				ctx.lineJoin = 'round';
				ctx.lineCap = 'round';
				ctx.strokeStyle = 'blue';
			};
			
			image.src= scope.image;
			
			// the last coordinates before the current move
			var lastx;
			var lasty;
			var x;
			var y;
			
			element.bind('touchstart', function (event) {
				if(scope.editing){
					var touchEvent = event.originalEvent.changedTouches[0];
					lastx = touchEvent.pageX - event.target.offsetLeft + canvas.parentElement.scrollLeft;
					lasty = touchEvent.pageY - event.target.offsetTop + canvas.parentElement.scrollTop;
				}
			});

			element.bind('touchmove', function (event) {
				console.log(event.originalEvent);
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
				scope.callback({coords: {'x': x, 'y': y, 'lastx': lastx, 'lasty': lasty}});
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