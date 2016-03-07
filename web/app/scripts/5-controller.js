(function () {
'use strict';
angular.module('ANEXD')
.controller('AddController', [
	'$scope',
	'Upload',
	'ANEXDService',
	function ($scope, Upload, ANEXDService) {
		var anexd = ANEXDService;
		
		anexd.sendToServer('quizzes')
		.then(function(data){
			console.log(data);
		}, function(error){
			console.log(error);
		});
		
		//Initialise first question and options/answers
		$scope.questions = [
			{
				'number': '1',
				'count': '2',
				'question': '',
				'answers': [
					{
						'id': 'A',
						'answer': '',
						'correct': true
					},
					{
						'id': 'B',
						'answer': '',
						'correct': false
					}
				]
			}
		];
		
		//Correct answer id (in order of question number)
		$scope.answers = ['A'];
		
		$scope.correct = [
			[true, false],
		];
		
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
				console.log(data);
				//Store data.data.link;
			}, function (error) {
				console.log(error);
			}, function (event) {
				var progressPercentage = parseInt(100.0 * event.loaded / event.total);
				console.log('progress: ' + progressPercentage + '% ' + event.config.data.image.name);
			});
		};
		
		$scope.removeQuestion = function(index){
			$scope.questions.splice(index, 1);
		};
		
		$scope.resize = function(question, count){
			var options = $scope.questions[question].answers;
			count = parseInt(count) - options.length;
			if(count < 0){
				options.splice(count, Math.abs(count));
				for(var i = 0; i < options.length; i++){
					if(options[i].correct){
						break;
					}
					if(i === options.length-1){
						options[0].correct = true;
					}
				}
			}
			else{
				for(var j = 0; j < count; j++){
					//Javascript magic for incrementing a letter
					var letter = String.fromCharCode(options[options.length-1].id.charCodeAt(0) + 1);
					options.push({
						'id': letter,
						'answer': ''
					});
					$scope.correct[question].push(false);
				}
			}
		};
		
		$scope.setCorrect = function(question, option, id){
			var options = $scope.questions[question].answers;
			if($scope.answers[question] === id){
				options[option].correct = true;
				return;
			}
			
			for(var i = 0; i < options.length; i++){
				if(options[i].id !== id){
					options[i].correct = false;
				}
			}
			$scope.answers[question] = id;	
		};
		
		$scope.addQuestion = function(){
			$scope.questions.push({
				'number': $scope.questions.length,
				'count': '2',
				'question': '',
				'answers': [
					{
						'id': 'A',
						'answer': '',
						'correct': true
					},
					{
						'id': 'B',
						'answer': '',
						'correct': false
					}
				]
			});
			$scope.answers.push('A');
		};
		
		$scope.submit = function(){
			//Get the uploaded image URL or default
			var imageURL;
			if(!$scope.image){
				imageURL = 'default.png';
			}
			else {
				imageURL = $scope.image.data.data.link;
			}
			
			var quiz = {
				'data': {
					'title' : $scope.title,
					'description': $scope.description,
					'image': imageURL,
					'questions': $scope.questions,
					'answers': $scope.answers	
				}
			};
			
			anexd.sendToServer('quiz', quiz);
		};
	}
])
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
		
		/*
		//Activate next and previous via keypress; 
		//Requires tabindex on element
		$scope.keydown = function($event){
			console.log('keydown', $event.keyCode);
			if($event.keyCode === 39){
				$scope.next();
			}	
			else if ($event.keyCode === 37){
				$scope.previous();
			}
		};
		*/
		
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