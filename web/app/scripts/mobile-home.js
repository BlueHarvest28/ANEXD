/**
 * CO600 ANEXD Project Code
 *
 * Contributor(s): Harry Jones(hj80) and Frederick Harrington(fh98)
 * mobile-home.js is a part of the frontend web deveoplment
 * mobile-home.js manages all mobile based frontend in partnership with mobile-home.html
 *
 * Copyright (C): University Of Kent 01/03/2016 
**/

/*
*	TODO:	COMMENTS
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
        * HJ80/FH98
        *
        */
		$scope.back = function(){
			$scope.showLobby = false;
			$scope.ready = false;
            $scope.users = [];
			
			//Leave lobby
			SocketService.default.emit('leave');
		};
		
		/*
        * HJ80
        *
        */
		var connect = function(){
			SocketService.default.on('start', function(response){
				if(!response.failed){
					$cookies.put('name', $scope.name);
					$location.path($location.path() + '/' + appId, true);
				}
			});
			
			SocketService.default.on('updatelobby', function(users){
				console.log(users);
				$scope.users = users;
			});
			
			SocketService.default.on('close', function(){
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
			console.log('lobby id', $scope.lobby);
			//TODO: WAIT FOR CONFIRMATION
			var data = {
				'lobbyid': $scope.lobby,
				'username': $scope.name
			};
			SocketService.promise('joinlobby', data, true).then(
				function(response){
					if(response){
						SocketService.promise('getappid', null, true).then(
							function(response){
								appId = response;
								SessionService.create($scope.lobby, appId);
								$location.path('/' + $scope.lobby, false);
								connect();	
							}
						);
					}
				}
			);
		};
		
        /*
        * HJ80 / FH98
        *
        */
        $scope.toggleReady = function(){
			$scope.ready = !$scope.ready;
			SocketService.default.emit('setready', $scope.ready);
		};
    }
]);
}());