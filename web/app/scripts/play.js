(function () {
'use strict';
angular.module('ANEXD')
.controller('PlayController', [
	'$scope',
	'ANEXDService',
	'$routeParams',
	'$rootScope',
	'$cookies',
	'$location',
    function ($scope, ANEXDService, $routeParams, $rootScope, $cookies, $location) 
    {
		var app = $routeParams.appId;
		$scope.isMobile = $rootScope.isMobile;
		
		//Store the lobby id and app id for instantiating ANEXD API
		$rootScope.lobby = $routeParams.lobbyId;
		$rootScope.app = $routeParams.appId;
		
		if($rootScope.isMobile){
			var name = $cookies.get('name');
			if(name){
				$scope.appLocation = 'applications/' + app + '/mobile-index.html';	
			}
			else {
				$location.path('/' + $routeParams.lobbyId, true);
			}
		} else {
			$scope.appLocation = 'applications/' + app + '/index.html';
		}
		
		$scope.leave = function(){
			$rootScope.$broadcast('leave');
			$location.path('/' + $routeParams.lobbyId, true);
		};
	}
]);
}());