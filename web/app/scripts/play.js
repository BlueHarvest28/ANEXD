(function () {
'use strict';
angular.module('ANEXD')
.controller('PlayController', [
	'$scope',
	'ANEXDService',
	'$routeParams',
	'$rootScope',
    function ($scope, ANEXDService, $routeParams, $rootScope) 
    {
		var app = $routeParams.appId;
		
		if($rootScope.isMobile){
			$scope.appLocation = 'views/' + app + '-mobile-index.html';	
		} else {
			$scope.appLocation = 'views/' + app + '-index.html';
		}
	}
]);
}());