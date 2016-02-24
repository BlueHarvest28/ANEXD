(function () {
'use strict';
angular.module('ANEXD')
.controller('MobileHomeController', [
	'$scope',
    '$http',
    'SocketService',
	'$routeParams',
    function ($scope, $http, SocketService, $routeParams) 
    {			
		
        $scope.ready = false;
    	$scope.allowNicknames = true;
		$scope.showLobby = false;
        $scope.inputError = false;
        var host = 'http://api-anexd.rhcloud.com/';
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
            
            //AnonUser Deletion Post
            var req = {
                method: 'POST',
                url: host + 'delAnonUser',
                headers: {'Content-Type': 'application/json'},
                data: $scope.anonUserID.userID,
            };
            $http(req).then(function successCallback(response) {
				console.log(response);
                
            }, function errorCallback(response) {
				console.log(response);
            });
            //End of AnonUser Deletion Post
            
            /*
            //SOCKET.ON for AnonUsers "leavelobby" event
            SocketService.emit('leavelobby', {$scope.anonUserID.userID}) 
            */
            
		};
        
        //Trigged by clicking submit
		$scope.submitUser = function(){
            $scope.inputError = false;
            
            //AnonUser Submit Post
            var req = {
                method: 'POST',
                url: host + 'newAnonUser',
                headers: {'Content-Type': 'application/json'},
                data: $scope.anonUser,
            };
            $http(req).then(function successCallback(response) {
                if(response.data.status === 'Fail') {
                    console.log('Fail'); 
                    console.log(response);
                } else {
                    console.log('Success');
                    console.log(response);
                    $scope.anonUserID.userID = response.data.id;
                    $scope.showLobby = true;
                    $scope.submitIsDisabled = false;
                }
            }, function errorCallback(response) {
                $scope.inputError = true;
				console.log(response);
            });
            //End of AnonUser Submit Post
            
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
                'id': '',
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