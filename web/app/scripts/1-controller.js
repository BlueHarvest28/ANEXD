(function () {
'use strict';
angular.module('ANEXD')
.controller('QuizController', [
	'$scope',
	'ANEXDService',
    function ($scope, ANEXDService) 
    {
		var anexd = ANEXDService;
		
		$scope.showStart = true;
		$scope.showQuestion = false;
		$scope.showEnd = false;
		
		$scope.players = 18;
		$scope.playerAnswers = 8;
		
		anexd.expect('title');
		anexd.expect('current');
		$scope.$watch(
			function() {
				return anexd.getFromServer();	
			}, 
			function (data){
				if(data){
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
		
		$scope.next = function(){
			anexd.sendToServer('next')
			.then(function(data){
				if(data){
					console.log('next success');
				}
			}, function(error) {
				console.log(error);
			});
		};
		
		$scope.previous = function(){
			anexd.sendToServer('previous')
			.then(function(data){
				if(data){
					console.log('previous success');	
				}
			}, function(error) {
				console.log(error);
			});	
		};
	}
])
.controller('MobileQuizController', [
	'$scope',
	'ANEXDService',
    function ($scope, ANEXDService) 
    {			
		var anexd = ANEXDService;
		
		$scope.showStart = true;
		$scope.showQuestion = false;
		$scope.showEnd = false;
		
		$scope.selectedAnswer = false;
		
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
		
		//TODO: look at and refactor
		$scope.setAnswer = function(answer){
			$scope.selectedAnswer = answer;	
			anexd.sendToServer('sendAnswer', $scope.selectedAnswer)
			.then(function(data){
				//Success callback
				$scope.question = data;
				$scope.showQuestion = true;
				$scope.currentQuestion++;
			}, function(error) {
				//Failure callback
				console.log(error);
			});	
		};
    }
]);
}());