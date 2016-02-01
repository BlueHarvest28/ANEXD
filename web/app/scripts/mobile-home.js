(function () {
'use strict';
angular.module('ANEXD')
.controller('MobileHomeController', [
	'$scope',
    function ($scope) 
    {			
		$scope.anonUser = {
			'nickname': '',
			'email': ''
		};
		
		$scope.ready = false;
    	$scope.allowNicknames = true;	
		$scope.showLobby = false;
		
		$scope.goBack = function(){
			$scope.showLobby = false;
			$scope.ready = false;
		};
		
		$scope.submitUser = function(){
			if($scope.anonUser.nickname === ''){
				$scope.anonUser.nickname = $scope.anonUser.email;
			}
			$scope.showLobby = true;
		};
		
		$scope.toggleReady = function(){
			$scope.ready = !$scope.ready;
		};
		
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