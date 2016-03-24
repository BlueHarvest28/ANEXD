/**
 * CO600 ANEXD Project Code
 *
 * Contributor(s): Harry Jones(HJ80) and Frederick Harrington(FH98)
 * home.js is a part of the frontend web deveoplment
 * home.js manages all mobile based frontend in partnership with home.html
 * home.js does not contain functions for any of the navbar or signing/login functions.
 *
 * Copyright (C): University Of Kent 01/03/2016 
**/

/*
*	TODO: 	CONNECT TO GO
*			PREPARE FOR RECONNECTIONS
*/

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
		var activeLobby;
		var openedApp;
		
		var lobbyId;
		var appId;
		
		$scope.apps = [];
		
		/**********************************
		*	INITIALISATION FUNCTIONS
		**********************************/
		
		//HJ80 - Variable setup for start and after closing a lobby
		var initialise = function(){
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
        * HTTP Post request to recieve application information.
        * HTTP Post request contains no data.
        * HTTP Post request recieves JSON object.
        * Function then sorts and displays the data held in the JSON object.
        */
        var getApps = function() {
            APIService.post('getAllGames').then(function(response){
				if(response){
					if(response.data[0].name === ''){
						$rootScope.$broadcast(CONST.ERROR, 'Failed to load apps; no title on first app');
					}
					else{
						for(var i = 0; i < response.data.length; i++){
							var current = response.data[i];
							current.rating = Array.apply(null, new Array(current.rating)).map(Number.prototype.valueOf,0);
							$scope.apps.push(current);		
						}
					}
				}
			});
        };
        
        getApps();
		
		/**********************************
		*	SOCKET EVENTS FOR HOST -> GO
		**********************************/
		
		//HJ80 - When the player list is updated
		SocketService.on('updatelobby', function(users){
			console.log('new users:', users);
			$scope.users = users;
		});
		
		//HJ80 - On server restart or force exit
		SocketService.on('close', function(){
			$scope.closeLobby();
		});
		
		//For reconnecting
//		if($routeParams.lobbyId){
//			console.log('lobby id:', $routeParams.lobbyId);
//			$location.path('/', true);
//			SocketService.emit('getappid', parseInt($routeParams.lobbyId));
//			
//			SocketService.on('sendappid', function(id){
//				$scope.game.gameid	
//			});
//			
//			//TEMPORARY; ALEX NEEDS TO SEND JAMES THE APP ID
//			$scope.app.gameID = 2;
//			$scope.app.name = 'Return of the Aliens';
//			$scope.app.image = 'images/return-of-the-aliens-tile.png';
//			$scope.hideIcons = true;
//			$scope.lobby = $routeParams.lobbyId;
//			$scope.showLobby = true;                                    //Load lobby
//			$scope.lobbyQR = CONST.HOST + $scope.lobby;   //Lobby QR creation.
//			$scope.isDisabled = false;
//			$scope.launchMessage = 'Launch';
//		}
		
		/**********************************
		*	LOBBY EVENTS
		**********************************/
        
        /*
        * HJ80 / FH98
        * Function called when the user starts a lobby with a selected application.
        * HTTP Post request containing the users id, the application id and the lobby size.
        * HTTP Post request receives lobby id.
        * Function uses lobby id to create QR code.
        * Function instantiate web socket connection.
        */
    	$scope.launchLobby = function() {
			$scope.isDisabled = true;
			$scope.launchMessage = '';
    		activeLobby = true;
			
            var payload = {
                'creator': SessionService.getUserId(),
                'game': appId,
                'size': $scope.maxPlayers,
            };
            
            APIService.post('newLobby', payload).then(function(response){
				if(response){
                    console.log(response);
					SocketService.connect();
					
					lobbyId = response.data.data.pass;
					SessionService.create(lobbyId, appId);
                    
					$scope.showLobby = true;
                    $scope.lobbyQR = CONST.HOST + lobbyId;
					$scope.isDisabled = false;
					$scope.launchMessage = 'Launch';
					
					//Instantiate Socket for lobby
					$location.path('/' + lobbyId, false);
					SocketService.emit('hostlobby', SessionService.getUserId());
					//TODO: PROMISE FUNCTION FOR SUCCESSFUL RETURN
					
					//Statement for assigning host to sockets (if necessary)
					//SocketService.emit('client', 'host');
					
//					SocketService.on('lobby', function(data) {
//						if(data){
//							lobbySocket = new LobbySocket($scope.lobby);
//							lobby();
//							$location.path('/' + $scope.lobby, false);
//						}
//					});
                }    
            });
    	};     
		
		/*
        * HJ80
        * Function is called when the user starts the game.
        * Function emits the lobby information to the websocket connection.
        * Function sets path URL with game infomation. 
        */
		$scope.start = function() {
			SocketService.emit('start', {'lobby': lobbyId, 'app': appId});
			$location.path($location.path() + '/' + appId, true);
        };
		
		/*
        * HJ80 / FH98
        * Function is called to transition between lobby and homepage.
        * Function hides lobby and displays applications.
        */
    	$scope.closeLobby = function() {
			//Wait for the windows to disappear before triggering transitions
			$scope.hideIcons = false;
			
			$timeout( function() {
				initialise();
            }, 1000);
            
            if(activeLobby) {
                var payload = {
					'lobbyID': SessionService.details().lobby,
				};
				
				APIService.post('delLobby', payload);
				
                activeLobby = false;
				SessionService.close();
				SocketService.disconnect();
				$location.path('/', false);
            }
    	};
		
		//HJ80 - listen for a logout event, then close anything running 
		$scope.$on('logout', function(){
			$scope.hideIcons = false;
			//If we have an open app
			if(openedApp){
				//Close and delete any lobby instances
				$scope.closeLobby();
			}
			SocketService.disconnect();
			$location.path('/', true);
		});
		
		//HJ80 - Called on application selection.
		$scope.selectApp = function(app) {
			openedApp = true;
    		$scope.hideIcons = true;
    		$scope.app = app;
			appId = app.gameID;
    	};
          
        //HJ80 - Called when the user changes filters.
		$scope.type = '';
    	$scope.setFilter = function(type) {
    		$scope.type = type;
    	}; 
    }
]);
}());