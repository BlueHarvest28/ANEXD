/**
 * CO600 ANEXD Project Code
 *
 * Contributor(s): Harry Jones(HJ80) and Frederick Harrington(FH98)
 * home.js is a part of the frontend web development
 * home.js manages desktop users, from selecting applications to launching lobbies
 *
 * Copyright (C): University Of Kent 01/03/2016 
**/
(function () {
'use strict';
angular.module('ANEXD')
.controller('HomeController', [
	'$scope',
	'$rootScope',
    '$timeout',
    '$http',
	'$location',
	'CONST',
	'APIService',
	'SessionService',
	'SocketService',
    function ($scope, $rootScope, $timeout, $http, $location, CONST, APIService, SessionService, SocketService) 
    {				
		var openedApp;
		var lobbyId;
		var appId;
		
		$scope.apps = [];
		
		/*
		* HJ80
		* Variable setup for start and after closing a lobby
		*/
		var initialise = function() {
			openedApp = false;
			$scope.showLobby = false;
			//Text shown on the launch button
			$scope.launchMessage = 'Launch';
			$scope.users = [];
			$scope.lobbyQR = '';
			$scope.isDisabled = false;
			$scope.maxPlayers = '5';
			//Selected app
			$scope.app = {};
		};
		initialise();
		
		/*
        * FH98 / HJ80
        * Function requests all applications
        * It then manipulates and displays them on the frontend via $scope.apps
		* SEE: factories.js for more information on APIService functions
        */
        var getApps = function() {
            APIService.post('getAllGames').then(function(response) {
				if(response){
					//Possibly an unexpected API error; successful return but empty sets
					if(response.data[0].name === ''){
						$rootScope.$broadcast(CONST.ERROR, 'Failed to load apps; no title on first app');
					}
					else{
						for(var i = 0; i < response.data.length; i++){
							var current = response.data[i];
							//JavaScript magic for converting the integer rating into an array
							current.rating = Array.apply(null, new Array(current.rating)).map(Number.prototype.valueOf,0);
							//Add to frontend list
							$scope.apps.push(current);		
						}
					}
				}
			});
        };
        getApps();
		
		
		/*
		* HJ80
		* Socket events for updating the lobby and non-user cancellation
		* SEE: factories.js for more information on SocketService functions
		*/
		SocketService.default.on('updatelobby', function(users) {
			$scope.users = users;
		});
		
		SocketService.default.on('close', function() {
			$scope.closeLobby();
		});	
		
		/*
		* HJ80
		* Function called when the user selects a filter
		* Affects which applications are visible to the user
		*/
		$scope.type = '';
    	$scope.setFilter = function(type) {
    		$scope.type = type;
    	}; 
        
		/*
		* HJ80
		* Function called when an app is selected
		* copies application's data into local variables
		*/
		$scope.selectApp = function(app) {
			openedApp = true;
    		$scope.hideIcons = true;
    		$scope.app = app;
			appId = app.gameID;
    	};
		
        /*
        * HJ80 / FH98
        * Function called when the user starts a lobby with a selected application.
		* Creates a new lobby and, if successful, initialises the lobbyid and QR code
        * Then, it begins the websocket communications
        */
    	$scope.launchLobby = function() {
			$scope.isDisabled = true;
			$scope.launchMessage = '';
    		$scope.activeLobby = true;
			
            var payload = {
                'creator': SessionService.getUserId(),
                'game': appId,
                'size': $scope.maxPlayers,
            };
            
            APIService.post('newLobby', payload).then(function(response) {
				if(response){
					lobbyId = response.data.data.pass;
					$scope.lobbyQR = CONST.HOST + lobbyId;
					
					var data = {
						'lobbyid': lobbyId,
						'username': SessionService.getUser(),
					};
					
					SocketService.promise('hostlobby', data, true).then(
						function(result) {
							if(result){
								//Create a new lobby session
								//SEE: factories.js for more information on SessionService functions
								SessionService.create(lobbyId, appId);
								$scope.showLobby = true;
								$scope.isDisabled = false;
								$scope.launchMessage = 'Launch';
								//Shift the URL to the lobbyid without refreshing
								$location.path('/' + lobbyId, false);
							}	
						}
					);
                }    
            });
    	};     
		
		/*
        * HJ80
        * Function is called when the user starts the game.
        * Function informs the Go server of desire to start
        */
		$scope.start = function() {
			SocketService.promise('start', null, true).then(
				function(response) {
					if(response){
						if(response.complete){
							//If successful, launch and hard load to the application page
							SocketService.default.emit('launch');
							$location.path($location.path() + '/' + appId, true);	
						}
						else if(response.failed){
							//Output the failure
							$rootScope.$broadcast(CONST.ERROR, 'Failed to start app; ' + response.feedback);
						}	
					}
				}
			);
        };
		
		/*
        * HJ89/FH98
        * Function is called to transition between lobby and homepage.
        * Function closes any active lobby or selection and displays applications.
        */
    	$scope.closeLobby = function() {
			$scope.hideIcons = false;
			
			//Wait for the windows to disappear before triggering re-initialisation
			$timeout( function() {
				initialise();
            }, 1000);
			
            if($scope.activeLobby) {
                var payload = {
					'lobbyID': SessionService.details().lobby,
				};
				
				//Delete the active lobby
				APIService.post('delLobby', payload);
                $scope.activeLobby = false;
				//End the session
				SessionService.close();
				//Inform Go
				SocketService.default.emit('leave');
				//Soft shift to the root path
				$location.path('/', false);
            }
    	};
		
		/*
		* HJ80
		* Listen for a logout event, and close anything running
		*/
		$scope.$on('logout', function() {
			$scope.hideIcons = false;
			//If we have an open app
			if(openedApp){
				//Close and delete any lobby instances
				$scope.closeLobby();
			}
			//Inform Go server
			SocketService.default.emit('leave');
		});
    }
]);
}());