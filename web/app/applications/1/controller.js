(function () {
'use strict';
angular.module('ANEXD')
.controller('1Controller', [
	'$scope',
	'Upload',
	'ANEXDService',
	function ($scope, Upload, ANEXDService) {
		var anexd = ANEXDService;
		var imageURL;
		
		var initialise = function(){
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
						},
						{
							'id': 'B',
							'answer': '',
						}
					]
				}
			];
			
			//Correct answer id (in order of question number)
			$scope.answers = ['A'];
			//Correct checkboxes to separate data from questions
			$scope.correct = [
				[true, false],
			];
		};
		
		initialise();
		
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
				imageURL = data.data.link;
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
			if(!imageURL){
				imageURL = 'default.png';
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
			
			//Reset form
			initialise();
		};
	}
]);
}());