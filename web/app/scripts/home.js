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
		var lobbySocket;
		
    	$scope.$watch(function(){ return LoginService.isLoggedIn();}, function (isLoggedIn){
			$scope.isLoggedIn = isLoggedIn;
			if(!$scope.isLoggedIn){
				$scope.showIcons();
			}
		});
	
        var host = 'http://api-anexd.rhcloud.com/';
        $scope.lobbyDelFlag = false;
        $scope.lobbyQR = '';
        $scope.type = '';
        
		$scope.users = [];
		
        var req = {
             method: 'POST',
             url: host + 'getAllGames',
        };   
        
        //POST REQUEST for all games
        $http(req).then(function(response)  {
			console.log(response);
            $scope.apps = response.data;
            for(var i = 0; i < $scope.apps.length; i++) {
                var obj = $scope.apps[i];
                $scope.apps[i].rating = Array.apply(null, new Array(obj.rating)).map(Number.prototype.valueOf,0);
            }
        });   
		
		var lobby = function(){
			lobbySocket.on('update', function(players){
				$scope.users = [];
				angular.forEach(players, function(value){
					this.push(value);	
				}, $scope.users);
			});
		};
		
		//Called on lobby creation submit
		$scope.launchMessage = 'Launch';
		$scope.isDisabled = false;
        
        $scope.getLobby = function(){
			//Disable submit button
			$scope.isDisabled = true;
			$scope.launchMessage = '';
            //The userid is in here
            var payload = {
				'creator': LoginService.getUserId(),
			};
			var req = {
				method: 'POST',
				url: host + 'getLobby',
				headers: {'Content-Type': 'application/json'},
				data: payload,
			};
			$http(req).then(function successCallback(response) {
				console.log(response);
				if(response.data.status === 'Success'){
					$scope.lobby = response.data.data.lobbyID;	
					deleteLobby();
				}
				else {
					$scope.launchApp();
				}
				
			}, function errorCallback(response) {
				console.log(response);
			});
        };
        
        //Called when the user closes a lobby
        function deleteLobby(){
            //Lobby Deletion Post
			var payload = {
				'lobbyID': $scope.lobby,
			};
			var req = {
				method: 'POST',
				url: host + 'delLobby',
				headers: {'Content-Type': 'application/json'},
				data: payload,
			};
			$http(req).then(function successCallback(response) {
				console.log(response);
				if(lobbySocket){
					lobbySocket.emit('close');	
					$scope.users = [];
				}
				if($scope.isDisabled){
					$scope.launchApp();
				}
			}, function errorCallback(response) {
				console.log(response);
			});
        }	
        
    	$scope.launchApp = function(){
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
                    $scope.showLobby = true;
                    $scope.lobby = response.data.data.pass;
                    //Lobby QR and password creation.
                    $scope.lobbyQR = 'harrymjones.com/anxed/' + $scope.lobby;
					$scope.isDisabled = false;
					$scope.launchMessage = 'Launch';
					
					//Instantiate Socket for lobby
					SocketService.emit('lobby', $scope.lobby);
					SocketService.on('lobby', function(data){
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
            //End of Lobby Post
            
            /*
            //SOCKET.ON for GameServer "lobbyconnect" event.
            SocketService.emit('lobbyconnect', {lobbyinfo})
            Read back some info
            SocketService.on('lobbyconnect', function (data) {
            });
            
            */  
    	};
		
		$scope.start = function(){
			$rootScope.lobby = $scope.lobby;
			$rootScope.app = $scope.app.gameID;
			lobbySocket.emit('start', {'lobby': $scope.lobby, 'app': $scope.app.gameID});
			$location.path($location.path() + '/' + $scope.app.gameID, true);
            //SOCKET.ON for GameServer "gameStart" event?
            //SocketService.emit('start',{});
        };     
		
		$scope.loadApp = function(app){
    		$scope.hideIcons = true;
    		$scope.app = app;
    	};

    	$scope.showIcons = function(){
    		$scope.hideIcons = false;
            //Wait for the windows to disappear before triggering transitions
            $scope.isDisabled = false;
			$scope.launchMessage = 'Launch';
			
			$timeout( function(){
                $scope.showLobby = false;
            }, 1000);
            
            if($scope.lobbyDelFlag === true){
                deleteLobby();
                
                //End of Lobby Deletion Post
                $scope.lobbyDelFlag = false;
            }
    	};
          	
    	$scope.setFilter = function(type){
    		$scope.type = type;
    	};
        
        //Local lobby information
        $scope.maxPlayers = '5';
		
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