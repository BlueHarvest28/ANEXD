(function () {
'use strict';
angular.module('ANEXD')
.controller('PlayController', [
	'$scope',
	'ANEXDService',
	'$routeParams',
    function ($scope, ANEXDService, $routeParams) 
    {
		$scope.fail = false;
		window.anexd = ANEXDService;
		if(!window.anexd){
			$scope.fail = true;	
		}
		
		var app = $routeParams.appId;
		$scope.appLocation = "views/" + app + "-index.html";
	}
]);
}());