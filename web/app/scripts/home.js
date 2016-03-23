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
*			TIDY UP DEPENDENCIES
*			IMPROVE STATE RELIABILITY (SEE: APP.JS)
*			FIX APP LAUNCH PAGE WITHOUT IMAGES
*/

(function () {
'use strict';
angular.module('ANEXD')
.controller('HomeController', [
	'$scope',
    '$timeout',
    'LoginService',
    '$http',
	'SocketService',
	'$location',
	'$rootScope',
	'$routeParams',
    function ($scope, $timeout, LoginService, $http, SocketService, $location, $rootScope, $routeParams) 
    {					
		/* Local and $scope variables */
        var host = 'http://api-anexd.rhcloud.com/';     //Host address for http requests
        $scope.lobbyDelFlag = false;                    //Flag to stop double clicking on submit
        $scope.lobbyQR = '';                            //The lobbies QR code
        $scope.type = '';                               //Application type, used in filtering
        $scope.users = [];                              //Users in the lobby
        $scope.launchMessage = 'Launch';                //
		$scope.isDisabled = false;                      //
        $scope.maxPlayers = '5';      
		$scope.app = {};
		
		SocketService.emit('message', 'test');
		
		SocketService.on('update', function(users){
			console.log('new users:', users);
			$scope.users = users;
		});
		
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
				$scope.showIcons();
			}
		});
	   
        /*
        * FH98
        * HTTP Post request to recieve application information.
        * HTTP Post request contains no data.
        * HTTP Post request recieves JSON object.
        * Function then sorts and displays the data held in the JSON object.
        */
        $scope.getGames = function() {
			console.log('get games');
            var req = {
                 method: 'POST',
                 url: host + 'getAllGames',
            };
			
            $http(req).then(function(response)  {
				//Likely that the response failed to correctly populate the list, or we have an undiagnosed database error
				if(response.data[0].name === ''){
					console.log('fail');
					$rootScope.$broadcast('error', 'Failed to load apps');
				}
				else{
					$scope.apps = response.data;
					for(var i = 0; i < $scope.apps.length; i++) {
						var obj = $scope.apps[i];
						$scope.apps[i].rating = Array.apply(null, new Array(obj.rating)).map(Number.prototype.valueOf,0);
					}	
				}
            });   
        };
        
        $scope.getGames(); //Calling getGames to display applications. 
        
        /*
        * HJ80
        * Function displays lobby users on the frontend 
        */
//        var lobby = function() {
//			lobbySocket.emit('hostlobby', LoginService.getUserId());
//			
//            lobbySocket.on('update', function(players) {
//                $scope.users = [];
//                angular.forEach(players, function(value) {
//                    this.push(value);	
//                }, $scope.users);
//            });
//        };
        
        /*
        * FH98
        * Function is used to check if a LoginService logged in user has already created a lobby.
        * HTTP Post request contains the users id.
        * HTTP Post request receives boolean and the users old lobby id.
        * If a user does have a lobby open it deletes it by called deleteLobby().
        */
        $scope.getLobby = function() {
			$scope.isDisabled = true;  //Disable submit button
			$scope.launchMessage = '';

            var payload = {
				'creator': LoginService.getUserId(), //Logged in users Id.
			};
			var req = {
				method: 'POST',
				url: host + 'getLobby',
				headers: {'Content-Type': 'application/json'},
				data: payload,
			};
			$http(req).then(function successCallback(response) {
				console.log(response);
				if(response.data.status === 'Success') {
					$scope.lobby = response.data.data.lobbyID;	
					deleteLobby(); //Deletes already open lobby if there is one
				}
				else {
					$scope.launchApp(); //Opens lobby
				}
				
			}, function errorCallback(response) {
				console.log(response);
			});
        };
        
        /*
        * FH98
        * Function is used to delete lobbies.
        * Called when a host/user leaves their lobby.
        * Called when the host has a lobby open when they create another.
        * HTTP Post request contains the lobbies Id.
        * HTTP Post request receives boolean
        */
        function deleteLobby() {
            
			var payload = {
				'lobbyID': $scope.lobby,  //lobby id to be removed from the database
			};
			var req = {
				method: 'POST',
				url: host + 'delLobby',
				headers: {'Content-Type': 'application/json'},
				data: payload,
			};
			$http(req).then(function successCallback(response) {
				console.log(response);
//				lobbySocket.emit('close');	//websocket emit called closed application
				if($scope.isDisabled) {
					$scope.launchApp();
				}
			}, function errorCallback(response) {
				console.log(response);
			});
        }	
        
        /*
        * FH98/HJ80
        * Function called when the user starts a lobby with a selected application.
        * HTTP Post request containing the users id, the application id and the lobby size.
        * HTTP Post request receives lobby id.
        * Function uses lobby id to create QR code.
        * Function instantiate web socket connection.
        */
    	$scope.launchApp = function() {
    		$scope.lobbyDelFlag = true;
            var payload = {
                'creator': LoginService.getUserId(),
                'game': $scope.app.gameID,
                'size': $scope.maxPlayers,
            };
            
            var req = {
                method: 'POST',
                url: host + 'newLobby',
                headers: {'Content-Type': 'application/json'},
                data: payload,
            };
			
            $http(req).then(function(response) {
                if(response.data.status === 'Fail') {
                    console.log(response);
                }
                else {
                    console.log(response);
                    $scope.showLobby = true;                                    //Load lobby
                    $scope.lobby = response.data.data.pass;                     //Lobby ID creation
                    $scope.lobbyQR = 'harrymjones.com/anxed/' + $scope.lobby;   //Lobby QR creation.
					$scope.isDisabled = false;
					$scope.launchMessage = 'Launch';
					
					//Instantiate Socket for lobby
					$location.path('/' + $scope.lobby, false);
					SocketService.emit('hostlobby', parseInt(LoginService.getUserId()));
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
                //show error
				console.log(response);
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
		$scope.loadApp = function(app) {
    		$scope.hideIcons = true;
    		$scope.app = app;
    	};

        /*
        * FH98/HJ80
        * Function is called to transition between lobby and homepage.
        * Function hides lobby and displays applications.
        */
    	$scope.showIcons = function() {
    		$scope.hideIcons = false;
            //Wait for the windows to disappear before triggering transitions
            $scope.isDisabled = false;
			$scope.launchMessage = 'Launch';
			
			$timeout( function() {
                $scope.showLobby = false;
            }, 1000);
            
            if($scope.lobbyDelFlag === true) {
                deleteLobby();
                $scope.lobbyDelFlag = false;
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