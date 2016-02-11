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
		if($routeParams.lobbyId){
			$scope.id = parseInt($routeParams.lobbyId);
		}
		
        $scope.ready = false;
    	$scope.allowNicknames = true;
		$scope.showLobby = false;
        var host = 'http://api-anexd.rhcloud.com/';
        SocketService.on('message', function (message) {
        	console.log(message);
        });
        
        $scope.anonUser = {
			'nickname': '',
            'lobbyId': '',
		};
        /*
        //READY AND SUBMIT DISABLES
        $scope.readyIsDisabled = false;
        $scope.disableReadyButton = function() {
            $scope.readyIsDisabled = true;
        }
        $scope.submitIsDisabled = false;
        $scope.disableSubtmitButton = function() {
            $scope.submitIsDisabled = true;
        }
        */
			
		$scope.goBack = function(){
			$scope.showLobby = false;
			$scope.ready = false;
            //AnonUser Deletion Post
            var req = {
                method: 'POST',
                url: host + 'removeAnonUser',
                headers: {'Content-Type': 'application/json'},
                data: $scope.anonUser,
            };
            $http(req).then(function successCallback(response) {
				console.log(response);
            }, function errorCallback(response) {
				console.log(response);
            });
            //End of AnonUser Deletion Post
		};
		
		$scope.submitUser = function(){
			$scope.showLobby = true; //Will move in the post
            //AnonUser Submit Post
            var req = {
                method: 'POST',
                url: host + 'newAnonUsers',
                headers: {'Content-Type': 'application/json'},
                data: $scope.anonUser,
            };
            $http(req).then(function successCallback(response) {
				console.log(response);
            }, function errorCallback(response) {
				console.log(response);
            });
            //End of AnonUser Submit Post
		};
		
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