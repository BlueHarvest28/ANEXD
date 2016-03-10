(function () {
'use strict';
angular.module('ANEXD')
.controller('ImageAnnotateController', [
	'$scope',
	'Upload',
	'ANEXDService',
	'$document',
	function ($scope, Upload, ANEXDService) {
		var anexd = new ANEXDService();
		//Temporary for testing
		$scope.done = true;
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
		}
	}
])
.directive("drawing", function () {
	return {
		restrict: "A",
		scope: {
			image : '=',
			editing: '='
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
					lastx = touchEvent.pageX - event.target.offsetLeft;
					lasty = touchEvent.pageY - event.target.offsetTop;
				}
			});
			
			element.bind('touchmove', function (event) {
				console.log(event);
				if(scope.editing){
					event.preventDefault();
					var touchEvent = event.originalEvent.changedTouches[0];
					x = touchEvent.pageX - event.target.offsetLeft;
					y = touchEvent.pageY - event.target.offsetTop;
					draw();
					lastx = x;
					lasty = y;
				}
			});
			
			function draw(x1, y1, x2, y2){
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