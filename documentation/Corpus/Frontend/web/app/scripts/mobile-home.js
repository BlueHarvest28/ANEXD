/**
 * CO600 ANEXD Project Code
 *
 * Contributor(s): Harry Jones(hj80) and Frederick Harrington(fh98)
 * mobile-home.js manages all mobile user lobby connections
 *
 * Copyright (C): University Of Kent 01/03/2016 
**/
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
        * Return the user to the home screen and clear scope variables
        */
		$scope.back = function(){
			$scope.showLobby = false;
			$scope.ready = false;
            $scope.users = [];
			
			//Inform the server
			SocketService.emit('leave');
		};
		
		/*
        * HJ80
        * Called after a successful lobby generation
		* Listens on relevant socket events to update the lobby
        */
		SocketService.default.on('start', function(response){
			if(!response.failed){
				//Create cookie for reconnecting
				$cookies.put('name', $scope.name);
				//Move to the application page
				$location.path($location.path() + '/' + appId, true);
			}
		});

		//Update the player list
		SocketService.default.on('updatelobby', function(users){
			$scope.users = users;
		});
		//Go back if the lobby is closed by the host
		SocketService.default.on('close', function(){
			$scope.back();
		});
		
        /*
        * HJ80
        * Attempt to join a lobby
        */
		$scope.join = function(){
            $scope.inputError = false;
            $scope.showLobby = true;
            $scope.submitIsDisabled = false;
			
			var data = {
				'lobbyid': $scope.lobby,
				'username': $scope.name
			};
			
			SocketService.promise('joinlobby', data, true).then(
				function(response){
					if(response){
						//Follow-up call for retrieving the app's id
						SocketService.promise('getappid', null, true).then(
							function(response){
								appId = response;
								SessionService.create($scope.lobby, appId);
								$location.path('/' + $scope.lobby, false);
							}
						);
					}
				}
			);
		};
		
        /*
        * HJ80
        * Toggle the mobile user's ready status
		* Send the result to the server
        */
        $scope.toggleReady = function(){
			$scope.ready = !$scope.ready;
			SocketService.emit('setready', $scope.ready);
		};
    }
]);
}());