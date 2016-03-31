/**
 * CO600 ANEXD Project Code
 *
 * Contributor(s): Harry Jones(HJ80)
 * play.js forwards the correct app files on to the desktop and mobile UIs
 *
 * Copyright (C): University Of Kent 01/03/2016 
**/
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
			} else {
				$scope.appLocation = 'applications/' + app + '/index.html';
			}
		}
		else{
			SocketService.default.emit('leave');
			$location.path('/', true);
		}
		
		$scope.leave = function() {
			$rootScope.$broadcast('leave');
			$location.path('/', true);
		};
	}
]);
}());