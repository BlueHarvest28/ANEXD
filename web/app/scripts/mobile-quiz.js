(function () {
'use strict';
angular.module('ANEXD')
.controller('MobileQuizController', [
	'$scope',
    function ($scope) 
    {			
		$scope.test = true;
		console.log('mobile quiz test', $scope.test);
    }
]);
}());