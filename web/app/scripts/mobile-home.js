(function () {
'use strict';
angular.module('ANEXD')
.controller('MobileHomeController', [
	'$scope',
    '$http',
    'SocketService',
	'$routeParams',
	'LobbySocket',
    function ($scope, $http, SocketService, $routeParams, LobbySocket) 
    {			
		
        $scope.ready = false;
    	$scope.allowNicknames = true;
		$scope.showLobby = false;
        $scope.inputError = false;
        //UNUSED
		//var host = 'http://api-anexd.rhcloud.com/';
        SocketService.on('message', function (message) {
        	console.log(message);
        });
        $scope.anonUserID = {
            'userID': '',
        };
        $scope.anonUser = {
			'username': '',
            'lobby': '',
		};
		if($routeParams.lobbyId){
			$scope.anonUser.lobbyId = $routeParams.lobbyId;
		}
        
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
        
        //Trigged on the back button from the lobby
        //NOT WORKING
		$scope.goBack = function(){
			$scope.showLobby = false;
			$scope.ready = false;
            
            //SHOULD SEND WEBSOCKET TO REMOVE ANON USER
            
		};
        
		var lobbySocket;
        //Trigged by clicking submit
		$scope.submitUser = function(){
            $scope.inputError = false;
            $scope.showLobby = true;
            $scope.submitIsDisabled = false;
			
			//Instantiate Socket with LobbyId as the namespace
			lobbySocket = new LobbySocket($scope.anonUser.lobbyId);
            
            /*
            //SOCKET.ON for AnonUsers "joinlobby" event
            SocketService.emit('joinlobby', {anonUserID.userID})
            SocketService.on('joinlobby', function (data) {
                listen for reply
            });
            */  
		};
		
        //Trigged by clicking the ready submit
        $scope.toggleReady = function(){
			$scope.ready = !$scope.ready;
            
            /*
            //SOCKET.ON for AnonUsers "setready" event
            SocketService.emit('setready'{anonUser.nickname, true})      
            SocketService.on('setready', function (data) {
                Response on success
            });
            */ 
		};

        /*
        $scope.users = [{
                'player': '',
                'nickname': '',
                'ready': false,             
        }];

        SocketService.on('updatelobby', function (data) {
        
        if($scope.showlobby == true){
            for (var i = 0; i < data.length(); i++) {
                var incomingId = data[i].id;
                var incomingNickname = data[i].data.nickname;
                var incomingReady = data[i].data.ready;

                $scope.users.push({
                    'id': incomingId,
                    'nickname': incomingNickname,
                    'ready': incomingReady
                });
            }
            }
        });
*/       

		$scope.users = [
			{
				'name': 'Edgar Badgerdon',
				'ready': false,
			},
			{
				'name': 'Audrey Mincebucket',
				'ready': false,
			},
			{
				'name': 'Manuel Slimesta',
				'ready': false,
			},
			{
				'name': 'Ina Sprinkfitz',
				'ready': true,
			},
			{
				'name': 'Hunch McScrape',
				'ready': false,
			},
			{
				'name': 'Edgar Badgerdon',
				'ready': false,
			},
			{
				'name': 'Audrey Mincebucket',
				'ready': false,
			},
			{
				'name': 'Manuel Slimesta',
				'ready': false,
			},
			{
				'name': 'Ina Sprinkfitz',
				'ready': true,
			},
			{
				'name': 'Hunch McScrape',
				'ready': false,
			},
			{
				'name': 'Edgar Badgerdon',
				'ready': false,
			},
			{
				'name': 'Audrey Mincebucket',
				'ready': false,
			},
			{
				'name': 'Manuel Slimesta',
				'ready': false,
			},
			{
				'name': 'Ina Sprinkfitz',
				'ready': true,
			},
			{
				'name': 'Hunch McScrape',
				'ready': false,
			},
			{
				'name': 'Edgar Badgerdon',
				'ready': false,
			},
			{
				'name': 'Audrey Mincebucket',
				'ready': false,
			},
			{
				'name': 'Manuel Slimesta',
				'ready': false,
			},
			{
				'name': 'Ina Sprinkfitz',
				'ready': true,
			},
			{
				'name': 'Hunch McScrape',
				'ready': false,
			},
		];
    }
]);
}());