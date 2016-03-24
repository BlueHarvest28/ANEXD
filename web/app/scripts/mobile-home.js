/**
 * CO600 ANEXD Project Code
 *
 * Contributor(s): Frederick Harrington(fh98) and Harry Jones(hj80)
 * mobile-home.js is a part of the frontend web deveoplment
 * mobile-home.js manages all mobile based frontend in partnership with mobile-home.html
 *
 * Copyright (C): University Of Kent 01/03/2016 
**/

/*
*	TODO:	INTEGRATE WITH GO
*/

(function () {
'use strict';
angular.module('ANEXD')
.controller('MobileHomeController', [
	'$scope',
	'$routeParams',
	'$location',
	'$rootScope',
	'$cookies',
	'SessionService',
	'SocketService',
    function ($scope, $routeParams, $location, $rootScope, $cookies, SessionService, SocketService)
	{
        $scope.ready = false;                             
		$scope.showLobby = false;                        
        $scope.inputError = false;                        
		$scope.users = [];     
		var appId;
		
		//If set, get the lobby id from url (e.g. QR code)
		if($routeParams.lobbyId){
			$scope.lobby = $routeParams.lobbyId;
		}
        
        /*
        * FH98/HJ80
        *
        */
		$scope.back = function(){
			$scope.showLobby = false;
			$scope.ready = false;
            $scope.users = [];
			
			//Leave lobby
			SocketService.disconnect();
		};
		
		/*
        * HJ80
        *
        */
		var connect = function(){
			SocketService.on('start', function(){
				console.log('starting');
				$cookies.put('name', $scope.name);
				$location.path($location.path() + '/' + appId, true);
			});
			
			SocketService.on('updatelobby', function(users){
				console.log('new users:', users);
				$scope.users = users;
			});
			
			SocketService.on('close', function(){
				$scope.back();
			});
		};
		
        /*
        * HJ80 / FH98
        *
        */
		$scope.join = function(){
            $scope.inputError = false;
            $scope.showLobby = true;
            $scope.submitIsDisabled = false;
			
			//TODO: WAIT FOR CONFIRMATION
			SocketService.connect();
			SocketService.emit('joinlobby', {'nickname': $scope.name, 'lobbyid': parseInt($scope.lobby)});
			//TEMPORARY - NEED TO GET THE APP ID FROM THE LOBBY
			SessionService.create($scope.lobby, 14);
			appId = 14;
			//Statement for assigning host to sockets (if necessary)
			//SocketService.emit('client', 'mobile');
			
			$location.path('/' + $scope.lobby, false);
			connect();
		};
		
        /*
        * HJ80 / FH98
        *
        */
        $scope.toggleReady = function(){
			$scope.ready = !$scope.ready;
			SocketService.emit('setready', {'nickname': $scope.name, 'ready': $scope.ready});
		};
    }
]);
}());