(function () {
'use strict';
angular.module('ANEXD')
.controller('QuizController', [
	'$scope',
	'ANEXDService',
    function ($scope, ANEXDService) 
    {
		var anexd = ANEXDService;
		anexd.sendToServer('test form quiz');
		
		console.log('quiz controller successful');
	}
]);
}());