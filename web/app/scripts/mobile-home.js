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
            'userID': ''   
        };
        $scope.anonUser = {
			'username': '',
            'lobby': '',
		};
		if($routeParams.lobbyId){
			$scope.anonUser.lobbyId = $routeParams.lobbyId;
		}
        
        //Trigged on the back button from the lobby
		$scope.goBack = function(){
			$scope.showLobby = false;
			$scope.ready = false;
            
            //AnonUser Deletion Post
            var req = {
                method: 'POST',
                url: host + 'delAnonUser',
                headers: {'Content-Type': 'application/json'},
                data: $scope.anonUserID,
            };
            $http(req).then(function successCallback(response) {
				console.log(response);
                
            }, function errorCallback(response) {
				console.log(response);
            });
            //End of AnonUser Deletion Post
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
				console.log(response);
                $scope.anonUserID.userID = response.data.id;
                $scope.showLobby = true;
                $scope.submitIsDisabled = false;
            }, function errorCallback(response) {
                $scope.inputError = true;
				console.log(response);
            });
            //End of AnonUser Submit Post
		};
		
        //Trigged by clicking the ready submit
        $scope.toggleReady = function(){
			$scope.ready = !$scope.ready;
            //AnonUser Ready Post
            var req = {
                 method: 'POST',
                 url: host + 'userReady',
                 data: {ready: true},
            };
            $http(req).then(function successCallback(response) {
				console.log(response);
            }, function errorCallback(response) {
				console.log(response);
            });
            //End of AnonUser Ready Post
		};

        /*
        $scope.users = [{
                'id': '',
                'nickname': '',
                'ready': false,             
        }];

        SocketService.on('anonUsers', function (data) {
        
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