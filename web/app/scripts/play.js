/*
*	TODO: 	COMMENTS
*			PREPARE FOR RECONNECTIONS
*/

(function () {
'use strict';
angular.module('ANEXD')
.controller('PlayController', [
	'$scope',
	'$rootScope',
	'$cookies',
	'$location',
	'SessionService',
	'SocketService',
    function ($scope, $rootScope, $cookies, $location, SessionService, SocketService) 
    {	
		if(SessionService.running()){
			var app = SessionService.details().app;
			if($rootScope.isMobile) {
				$scope.appLocation = 'applications/' + app + '/mobile-index.html';	
				//For reconnecting mobile users
				//
				//var name = $cookies.get('name');
				//if(name) {
				//	$scope.appLocation = 'applications/' + app + '/mobile-index.html';	
				//}
				//else {
				//	$location.path('/' + $routeParams.lobbyId, true);
				//}
			} else {
				$scope.appLocation = 'applications/' + app + '/index.html';
			}
		}
		else{
			SocketService.disconnect();
			$location.path('/', true);
		}
		
		$scope.leave = function() {
			$rootScope.$broadcast('leave');
			$location.path('/', true);
		};
	}
]);
}());