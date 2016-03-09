(function () {
'use strict';
angular.module('ANEXD')
.controller('MobileHomeController', [
	'$scope',
    '$http',
    'SocketService',
	'$routeParams',
	'LobbySocket',
	'$location',
	'$rootScope',
	'$cookies',
    function ($scope, $http, SocketService, $routeParams, LobbySocket, $location, $rootScope, $cookies)
	{
        $scope.ready = false;
		$scope.showLobby = false;
        $scope.inputError = false;
		$scope.users = [];
		
        //UNUSED
		//var host = 'http://api-anexd.rhcloud.com/';
		
		//If set, get lobby id from url
		if($routeParams.lobbyId){
			$scope.lobby = $routeParams.lobbyId;
		}
        
		//Instance of lobby socket
		var lobbySocket;
		
        /************************
		*	Lobby back button	*
		*************************/
		$scope.goBack = function(){
			$scope.showLobby = false;
			$scope.ready = false;
            
			//Leave lobby
			lobbySocket.emit('leave');
		};
		
		/********************
		*	Lobby socket	*
		*********************/
		var lobby = function(){
			lobbySocket.emit('join', $scope.name);
			
			lobbySocket.on('start', function(){
				//TODO: replace with actual app id
				$location.path($location.path() + '/' + 2, true);
				$cookies.put('name', $scope.name);
			});
			
			lobbySocket.on('update', function(data){
				$scope.users = [];
				angular.forEach(data, function(value){
					this.push(value);
				}, $scope.users);
			});
			
			lobbySocket.on('close', function(){
				$scope.goBack();
			});
		};
        
        /****************
		*	Join lobby	*
		*****************/
		$scope.join = function(){
            $scope.inputError = false;
            $scope.showLobby = true;
            $scope.submitIsDisabled = false;
			
			//TEMPORARY - NEED TO GET THE APP ID FROM THE LOBBY
			$rootScope.lobby = $scope.lobby;
			$rootScope.app = 5;
			
			//Instantiate Socket with LobbyId as the namespace
			lobbySocket = new LobbySocket($scope.lobby);
			lobby();
			$location.path('/' + $scope.lobby, false);
		};
		
        /************************
		*	Toggle ready status	*
		*************************/
        $scope.toggleReady = function(){
			$scope.ready = !$scope.ready;
			lobbySocket.emit('ready', $scope.ready);
		};
		
		/*
        //SOCKET.ON for gameServer "kick" event
        SocketService.on('kick', function (data) {
            Display data(reason)
            $scope.goBack();
        });
        */
        
        /*
        //SOCKET.ON for AnonUsers "msgserver" event
        SocketService.emit('msgserver', {anonUserID, msg: interface}) 
        */   
        
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
    }
]);
}());