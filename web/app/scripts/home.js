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
(function () {
'use strict';
angular.module('ANEXD')
.controller('HomeController', [
	'$scope',
    '$timeout',
    'LoginService',
    '$http',
	'SocketService',
	'LobbySocket',
	'$location',
	'$rootScope',
    function ($scope, $timeout, LoginService, $http, SocketService, LobbySocket, $location, $rootScope) 
    {					
		/* Local and $scope variables */
        var host = 'http://api-anexd.rhcloud.com/';     //Host address for http requests
        $scope.lobbyDelFlag = false;                    //Flag to stop double clicking on submit
        $scope.lobbyQR = '';                            //The lobbies QR code
        $scope.type = '';                               //Application type, used in filtering
        $scope.users = [];                              //Users in the lobby
        $scope.launchMessage = 'Launch';                //
		$scope.isDisabled = false;                      //
        var lobbySocket;                                //
        $scope.maxPlayers = '5';                        //
		
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
            var req = {
                 method: 'POST',
                 url: host + 'getAllGames',
            };

            $http(req).then(function(response)  {
                $scope.apps = response.data;
                for(var i = 0; i < $scope.apps.length; i++) {
                    var obj = $scope.apps[i];
                    $scope.apps[i].rating = Array.apply(null, new Array(obj.rating)).map(Number.prototype.valueOf,0);
                }
            });   
        };
        
        $scope.getGames(); //Calling getGames to display applications. 
        
        /*
        * HJ80
        * Function displays lobby users on the frontend 
        */
        var lobby = function() {
            lobbySocket.on('update', function(players) {
                $scope.users = [];
                angular.forEach(players, function(value) {
                    this.push(value);	
                }, $scope.users);
            });
        };
        
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
				if(lobbySocket) {
					lobbySocket.emit('close');	//websocket emit called closed application
					$scope.users = [];
				}
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
					SocketService.emit('lobby', $scope.lobby);
					SocketService.on('lobby', function(data) {
						if(data){
							lobbySocket = new LobbySocket($scope.lobby);
							lobby();
							$location.path('/' + $scope.lobby, false);
						}
					});
                }    
            }, function errorCallback(response) {
                //show error and send again
				console.log(response);
            });
            
            /*
            //SOCKET.ON for GameServer "lobbyconnect" event.
            SocketService.emit('lobbyconnect', {lobbyinfo})
            Read back some info
            SocketService.on('lobbyconnect', function (data) {
            });
            */  
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
			lobbySocket.emit('start', {'lobby': $scope.lobby, 'app': $scope.app.gameID});
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
		
    
        
		/*
        //SOCKET.ON for GameServer "msgall" event.
        SocketService.on('msgall', function (data) {
            data will be msg: interfac{}
        });
        */
        
        /*
        //SOCKET.ON for GameServer "gameend" event.
        SocketService.on('gameend', function (data) {
            data will be response bool and feedback error
        });
        */
        
        /*
        //SOCKET.ON for GameServer "msgplayer" event.
        SocketService.on('msgplayer', function (data) {
            data will be response bool and feedback error
        });
        */
        
        /*
        //SOCKET.ON for GameServer "gamestart" event.
        SocketService.on('gamestart', function (data) {
            data will be response bool and feedback error
        });
        */
        
        /*
        //SOCKET.ON for AnonUsers "msgserver" event
        SocketService.emit('msgserver', {anonUserID, msg: interface}) 
        */
        
        /*
        //SOCKET.ON for AnonUsers "end" event
        SocketService.emit('end', {NODATA}) 
        */   
        
        /*
        //SOCKET.ON for AnonUsers "kick" event
        SocketService.emit('kick', {username})
        */  
        
        /*
        Socket for the lobby
        
        $scope.users = [
            {
                'id': '',
                'nickname': '',
                'ready': false,             
        }];
        
        //SOCKET.ON for GameServer "updatelobby" event.
        SocketService.on('updatelobby', function (data) {
            
            for (var i = 0; i < data.length(); i++) {       
                var incomingId = data[i].id;
                var incomingNickname = data[i].data.nickname;
                var incomingReady = data[i].data.ready;
                
                $scope.users.push({
                    'id': incomingId,
                    'nickname': incomingNickname,
                    'ready': incomingReady});
            }
        });
        */ 
    }
]);
}());