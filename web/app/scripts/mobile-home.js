/**
 * CO600 ANEXD Project Code
 *
 * Contributor(s): Frederick Harrington(fh98) and Harry Jones(hj80)
 * mobile-home.js is a part of the frontend web deveoplment
 * mobile-home.js manages all mobile based frontend in partnership with mobile-home.html
 *
 * Copyright (C): University Of Kent 01/03/2016 
**/
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
        /* Local and $scope variables */
        $scope.ready = false;                             //
		$scope.showLobby = false;                         //
        $scope.inputError = false;                        //
		$scope.users = [];                                //
        //UNUSED
		//var host = 'http://api-anexd.rhcloud.com/';     //Host address for http requests
		
		//If set, get lobby id from url
		if($routeParams.lobbyId){
			$scope.lobby = $routeParams.lobbyId;
		}
		
		SocketService.on('updatelobby', function(users){
			console.log('new users:', users);
			$scope.users = users;
		});
        
		//Instance of lobby socket
		var lobbySocket;
		
        /*
        * FH98/HJ80
        *
        */
		$scope.goBack = function(){
			$scope.showLobby = false;
			$scope.ready = false;
            
			//Leave lobby
			SocketService.emit('leave');
		};
		
		/*
        * HJ80
        *
        */
		var lobby = function(){
			SocketService.emit('join', $scope.name);
			
			SocketService.on('start', function(){
				console.log('starting');
				//TODO: replace with actual app id
				$location.path($location.path() + '/' + 14, true);
				$cookies.put('name', $scope.name);
			});
			
			SocketService.on('update', function(data){
				$scope.users = [];
				angular.forEach(data, function(value){
					this.push(value);
				}, $scope.users);
			});
			
			SocketService.on('close', function(){
				$scope.goBack();
			});
		};
        
        /*
        * FH98/HJ80
        *
        */
		$scope.join = function(){
            $scope.inputError = false;
            $scope.showLobby = true;
            $scope.submitIsDisabled = false;
			
			//TEMPORARY - NEED TO GET THE APP ID FROM THE LOBBY
			$rootScope.lobby = $scope.lobby;
			$rootScope.app = 14;
			
			SocketService.emit('joinlobby', {'nickname': $scope.name, 'lobbyid': parseInt($scope.lobby)});
			//Instantiate Socket with LobbyId as the namespace
//			lobbySocket = new LobbySocket($scope.lobby);
			lobby();
			$location.path('/' + $scope.lobby, false);
		};
		
        /*
        * FH98/HJ80
        *
        */
        $scope.toggleReady = function(){
			$scope.ready = !$scope.ready;
			SocketService.emit('setready', {'nickname': $scope.name, 'ready': $scope.ready});
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