/**
 * CO600 ANEXD Project Code
 *
 * Contributor(s): Frederick Harrington(FH98) and Harry Jones(HJ80)
 * home.js is a part of the frontend web deveoplment
 * home.js manages all mobile based frontend in partnership with home.html
 * home.js does not contain functions for any of the navbar or signing/login functions.
 *
 * Copyright (C): University Of Kent 01/03/2016 
**/

/*
*	TODO: 	CONNECT TO GO
*			IMPROVE STATE RELIABILITY (SEE: APP.JS)
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
	'$routeParams',
	'CONST',
	'LoginService',
	'SocketService',
    function ($scope, $rootScope, $timeout, $http, $location, $routeParams, CONST, LoginService, SocketService) 
    {					
        $scope.type = '';
		var activeLobby = false;
		var openedApp = false;
		
		var initialise = function(){
			$scope.showLobby = false;
			$scope.launchMessage = 'Launch';
			$scope.users = [];
			$scope.lobbyQR = '';
			$scope.isDisabled = false;
			$scope.maxPlayers = '5';
			$scope.app = {};
		};
		
		initialise();
		
		SocketService.on('update', function(users){
			console.log('new users:', users);
			$scope.users = users;
		});
		
		//For reconnecting
		if($routeParams.lobbyId){
			console.log('lobby id:', $routeParams.lobbyId);
//			SocketService.emit('getappid', parseInt($routeParams.lobbyId));
//			
//			SocketService.on('sendappid', function(id){
//				$scope.game.gameid	
//			});
			
			//TEMPORARY; ALEX NEEDS TO SEND JAMES THE APP ID
			$scope.app.gameID = 2;
			$scope.app.name = 'Return of the Aliens';
			$scope.app.image = 'images/return-of-the-aliens-tile.png';
			$scope.hideIcons = true;
			$scope.lobby = $routeParams.lobbyId;
			$scope.showLobby = true;                                    //Load lobby
			$scope.lobbyQR = 'harrymjones.com/anxed/' + $scope.lobby;   //Lobby QR creation.
			$scope.isDisabled = false;
			$scope.launchMessage = 'Launch';
		}
		
        /*
        * HJ80
        * Checks LoginService for a logged in user.
        * Shows game icons if true.
        */        
    	$scope.$watch(function(){ return LoginService.isLoggedIn();}, function (isLoggedIn){
			$scope.isLoggedIn = isLoggedIn;
			if(!$scope.isLoggedIn) {
				$scope.hideIcons = false;
				//If we have an open app
				if(openedApp){
					//Close and delete any lobby instances
					$scope.closeLobby();
				}
			}
		});
	   
        /*
        * FH98 / HJ80
        * HTTP Post request to recieve application information.
        * HTTP Post request contains no data.
        * HTTP Post request recieves JSON object.
        * Function then sorts and displays the data held in the JSON object.
        */
        $scope.getGames = function() {
            var req = {
                 method: 'POST',
                 url: CONST.HOST + 'getAllGames',
            };
			
            $http(req).then(function(response)  {
				//Likely that the response failed to correctly populate the list, or we have an undiagnosed database error
				if(response.data[0].name === '' || response.data.status === 'Fail'){
					$rootScope.$broadcast(CONST.ERROR, 'Failed to load apps; no title on first app');
				}
				else{
					$scope.apps = response.data;
					for(var i = 0; i < $scope.apps.length; i++) {
						var obj = $scope.apps[i];
						$scope.apps[i].rating = Array.apply(null, new Array(obj.rating)).map(Number.prototype.valueOf,0);
					}	
				}
            }, function(response){
				$rootScope.$broadcast(CONST.ERROR, 'Failed to get apps; ' + response.description);
			});   
        };
        
        $scope.getGames(); //Calling getGames to display applications. 
        
        /*
        * FH98
        * Function is used to check if a LoginService logged in user has already created a lobby.
        * HTTP Post request contains the users id.
        * HTTP Post request receives boolean and the users old lobby id.
        * If a user does have a lobby open it deletes it by called deleteLobby().
        */
//        $scope.getLobby = function() {
//			$scope.isDisabled = true;  //Disable submit button
//			$scope.launchMessage = '';
//
//            var payload = {
//				'creator': LoginService.getUserId(), //Logged in users Id.
//			};
//			var req = {
//				method: 'POST',
//				url: CONST.HOST + 'getLobby',
//				headers: {'Content-Type': 'application/json'},
//				data: payload,
//			};
//			$http(req).then(function successCallback(response) {
//				if(response.data.status === 'Fail') {
//                    $rootScope.$broadcast(CONST.ERROR, 'Failed to get lobby;', response.data.description);
//                }
//                else {
//					console.log(response);
//					if(response.data.status === 'Success') {
//						$scope.lobby = response.data.data.lobbyID;	
//						deleteLobby(); //Deletes already open lobby if there is one
//					}
//					else {
//						$scope.launchLobby(); //Opens lobby
//					}
//				}
//			}, function errorCallback(response) {
//				$rootScope.$broadcast(CONST.ERROR, 'Failed to get lobby;', response.description);
//			});
//        };
        
        /*
        * FH98
        * Function is used to delete lobbies.
        * Called when a host/user leaves their lobby.
        * Called when the host has a lobby open when they create another.
        * HTTP Post request contains the lobbies Id.
        * HTTP Post request receives boolean
        */
        var deleteLobby = function() {
			var payload = {
				'lobbyID': $scope.lobby,  //lobby id to be removed from the database
			};
			
			var req = {
				method: 'POST',
				url: CONST.HOST + 'delLobby',
				headers: {'Content-Type': 'application/json'},
				data: payload,
			};
			
			$http(req).then(function successCallback(response) {
				if(response.data.status === 'Fail') {
                    $rootScope.$broadcast(CONST.ERROR, 'Failed to delete lobby; ' + response.data.description);
                }
                else {
					console.log(response);
					if($scope.isDisabled) {
						$scope.launchLobby();
					}
				}
			}, function errorCallback(response) {
				$rootScope.$broadcast(CONST.ERROR, 'Failed to delete lobby; ' + response.description);
			});
        };	
        
        /*
        * FH98/HJ80
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
                'creator': LoginService.getUserId(),
                'game': $scope.app.gameID,
                'size': $scope.maxPlayers,
            };
            
            var req = {
                method: 'POST',
                url: CONST.HOST + 'newLobby',
                headers: {'Content-Type': 'application/json'},
                data: payload,
            };
			
            $http(req).then(function(response) {
                if(response.data.status === 'Fail') {
                    $rootScope.$broadcast(CONST.ERROR, 'Failed to start lobby; ' + response.data.description);
                }
                else {
                    console.log(response);
                    $scope.showLobby = true;                                    //Load lobby
                    $scope.lobby = response.data.data.pass;                     //Lobby ID creation
                    $scope.lobbyQR = CONST.HOST + $scope.lobby;   //Lobby QR creation.
					$scope.isDisabled = false;
					$scope.launchMessage = 'Launch';
					
					//Instantiate Socket for lobby
					$location.path('/' + $scope.lobby, false);
					SocketService.emit('hostlobby', LoginService.getUserId());
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
            }, function errorCallback(response) {
                $rootScope.$broadcast(CONST.ERROR, 'Failed to start lobby; ' + response.description);
            });
    	};
		
        /*
        * HJ80
        * Function is called when the user starts the game.
        * Function emits the lobby information to the websocket connection.
        * Function sets path URL with game infomation. 
        */
		$scope.start = function() {
			$rootScope.lobby = $scope.lobby;
			$rootScope.app = $scope.app.gameID;
			SocketService.emit('start', {'lobby': $scope.lobby, 'app': $scope.app.gameID});
			$location.path($location.path() + '/' + $scope.app.gameID, true);
            //SOCKET.ON for GameServer "gameStart" event?
            //SocketService.emit('start',{});
        };     
		
        /*
        * HJ80
        * Function called when a application is seleced.
        */
		$scope.selectApp = function(app) {
			openedApp = true;
    		$scope.hideIcons = true;
    		$scope.app = app;
    	};

        /*
        * FH98/HJ80
        * Function is called to transition between lobby and homepage.
        * Function hides lobby and displays applications.
        */
    	$scope.closeLobby = function() {
			openedApp = false;
			//Show icons
    		$scope.hideIcons = false;
            //Wait for the windows to disappear before triggering transitions
            $scope.isDisabled = false;
			$scope.launchMessage = 'Launch';
			
			$timeout( function() {
                $scope.showLobby = false;
				initialise();
            }, 1000);
            
            if(activeLobby) {
                deleteLobby();
                activeLobby = false;
            }
    	};
          
        /*
        * HJ80
        * Function is called when the user changes filters.
        */
    	$scope.setFilter = function(type) {
    		$scope.type = type;
    	}; 
    }
]);
}());