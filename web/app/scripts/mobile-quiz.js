(function () {
'use strict';
angular.module('ANEXD')
.controller('MobileQuizController', [
	'$scope',
    function ($scope) 
    {			
		$scope.selectedAnswer = false;
		
		$scope.question = {
			'question' : 'In which book is Satan first mentioned?',
			'answers' : [
				{
					'id': 'a',
					'text': 'The Old Testament',
				},
				{
					'id': 'b',
					'text': 'The Old Testament V2',
				},
				{
					'id': 'c',
					'text': 'The Other Testament',
				},
				{
					'id': 'd',
					'text': 'War and Peace',
				}
			]
		};
		
		$scope.setAnswer = function(answer){
			$scope.selectedAnswer = answer;	
		};
    }
]);
}());