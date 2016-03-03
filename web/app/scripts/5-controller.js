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
		
		$scope.userCount = 0;
		$scope.answers = [];
		$scope.scores = [];
		
		anexd.expect('title');
		anexd.expect('current');
		anexd.expect('users');
		anexd.expect('answers');
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
						initialiseAnswers();
					}
					else if(data.event === 'current'){
						if(data.val.event === 'showStart'){
							$scope.showStart = true;
							$scope.showQuestion = false;
							$scope.showEnd = false;
						}
						else if(data.val.event === 'question'){
							$scope.scores = [];
							$scope.showStart = false;
							$scope.showQuestion = true;
							$scope.showEnd = false;
							$scope.question = data.val.data;
						}
						else if(data.val.event === 'showEnd'){
							$scope.showStart = false;
							$scope.showQuestion = false;
							$scope.showEnd = true;
							splitScores(data.val.data);
						}
					} 
					else if(data.event === 'users'){
						$scope.userCount = data.val;
						console.log($scope.userCount);
					}
					else if(data.event === 'answers'){
						$scope.answers[$scope.question.number]++;
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
		
		var initialiseAnswers = function(){
			for(var i = 1; i <= $scope.total; i++){
				$scope.answers[i] = 0;
			}
			console.log($scope.answers);
		};
		
		var splitScores = function(obj){
			angular.forEach(obj, function(value, key){
				this.push(key + ': ' + value);
			},$scope.scores);
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