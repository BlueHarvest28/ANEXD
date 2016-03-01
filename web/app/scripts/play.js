(function () {
'use strict';
angular.module('ANEXD')
.controller('PlayController', [
	'$scope',
	'ANEXDService',
    function ($scope, ANEXDService) 
    {
		$scope.fail = false;
		window.anexd = ANEXDService;
		if(!window.anexd){
			$scope.fail = true;	
		}
	}
]);
}());