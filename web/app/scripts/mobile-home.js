(function () {
'use strict';
angular.module('ANEXD')
.controller('MobileHomeController', [
	'$scope',
    '$http',
    'SocketService',
    function ($scope, $http, SocketService) 
    {			
		
        SocketService.on('message', function (message) {
        	console.log(message);
        });
        
        $scope.anonUser = {
			'nickname': ''
		};
		
		$scope.ready = false;
    	$scope.allowNicknames = true;	
		$scope.showLobby = false;
        
        var host = 'http://api-anexd.rhcloud.com/';
		
		$scope.goBack = function(){
			$scope.showLobby = false;
			$scope.ready = false;
		};
		
		$scope.submitUser = function(){
			$scope.showLobby = true;
            
            var req = {
                 method: 'POST',
                 url: host + 'userReady',
                 data: $scope.anonUser
            };            
            
            $http(req).then(function successCallback(response) {
				console.log(response);
            }, function errorCallback(response) {
				console.log(response);
            }); 
		};
		
		$scope.toggleReady = function(){
			$scope.ready = !$scope.ready;
            
            var req = {
                 method: 'POST',
                 url: host + 'userReady',
                 data: {ready: true},
            };
            
            //POST For player ready
            $http(req).then(function successCallback(response) {
				console.log(response);
            }, function errorCallback(response) {
				console.log(response);
            });        
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