(function () {
'use strict';
angular.module('ANEXD')
.controller('HomeController', [
	'$scope',
    '$timeout',
    'LoginService',
    '$http',
	'SocketService',
    function ($scope, $timeout, LoginService, $http, SocketService) 
    {			
		SocketService.on('message', function (message) {
        	console.log(message);
        });
		        
    	$scope.$watch(LoginService.isLoggedIn, function (isLoggedIn){
			$scope.isLoggedIn = isLoggedIn;
			if(!$scope.isLoggedIn){
				$scope.showIcons();
			}
		});
	
        var host = 'http://api-anexd.rhcloud.com/';
        //Flag stops lobby deletion 
        $scope.lobbyDelFlag = false;
        $scope.lobbyQR = '';
        $scope.lobbyCode= '000000';
        
        /*
        NEED TO WAIT UNTIL ALEX HAS DONE THE API FUNCTION FOR THIS
        $scope.apps = [
           { 
            'id': '',
            'name': '',
            'type': '',
            'description': '',
            'image': '',
            'rating': [1,2,3],
            }
        ];  
        
        var req = {
             method: 'POST',
             url: host + 'getAllGames',
        };   
        
        //POST REQUEST for all games
        $http(req).success(function(results)  {         
            $scope.apps = results.data;
        });   
*/
        
        //Will be removed when api is working
    	$scope.apps = [
    		{
    			'name': 'The Satan Test',
    			'type': 'Quiz',
    			'description': 'Think you know Satan? Think Again in this exceptionally pagan quiz.',
    			'image': 'images/satan-tile.png',
    			'rating': [1,2,3],
    		},
    		{
    			'name': 'The Satan Test 2',
    			'type': 'Quiz',
    			'description': 'MORE SATANIC GLORY FOR THE MASSES BOOYAKASHA. This is an unnecessarily long title, let\'s see if we can handle this one well',
    			'image': 'images/satan-tile.png',
    			'rating': [1,2,3,4],
    		},
    		{
    			'name': 'The Satan Test 3',
    			'type': 'Game',
    			'description': 'Please stop requesting Satan quizzes.',
    			'image': 'images/satan-tile.png',
    			'rating': [1,2],
    		},
    		{
    			'name': 'The Satan Test 4',
    			'type': 'Game',
    			'description': 'BACK BY UNPOPULAR DEMAND WE JUST REALLY NEEDED THE MONEY',
    			'image': 'images/satan-tile.png',
    			'rating': [1,2],
    		},
    	];
        
        /*
        $scope.users = [
            {
                'id': '',
                'nickname': '',
                'ready': false,             
        }];
        
        //SOCKET.ON for lobby anonUsers.
        SocketService.on('anonUsers', function (data) {
            
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
        
        //Will be removed when api is working
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
        ];
        
        //Local lobby information
        $scope.lobby = {
            max: '5',
        };

    	$scope.loadApp = function(app){
    		$scope.hideIcons = true;
    		$scope.app = app;
    	};

    	$scope.showIcons = function(){
    		$scope.hideIcons = false;
            //Wait for the windows to disappear before triggering transitions
            $timeout( function(){
                $scope.showLobby = false;
            }, 1000);
            
            if($scope.lobbyDelFlag === true){
                //Lobby Deletion Post
                var payload = {
                    'creator': '1', //The userid is in here
                };
                var req = {
                    method: 'POST',
                    url: host + 'removeLobby',
                    headers: {'Content-Type': 'application/json'},
                    data: payload,
                };
                $http(req).then(function successCallback(response) {
                    console.log(response);
                }, function errorCallback(response) {
                    console.log(response);
                });
                //End of Lobby Deletion Post
                $scope.lobbyDelFlag = false;
            }
    	};

    	$scope.type = '';
    	$scope.setFilter = function(type){
    		$scope.type = type;
    	};
        
        //Disable multiple lobby submits
        $scope.isDisabled = false;
        $scope.disableButton = function() {
            $scope.isDisabled = true;
        };
        
        //Called on lobby creation submit
    	$scope.launchApp = function(){
    		$scope.lobbyDelFlag = true;

            //Tempory
            var temp1 = Math.floor(Math.random() * 90 + 10);
            var temp2 = Math.floor(Math.random() * 90 + 10);
            
            //Lobby Post
            var payload = {
                'creator': temp1.toString(),    // Will be the id of the user - LoginService.getUser()
                'game': temp2.toString(),       // Will be the id of the game - $scope.app.name, or something
                'pass': $scope.lobbyCode.toString(), //Will be removing
                'size': $scope.lobby.max,
                'title': 'will be removed', // will be removing
            };

            var req = {
                method: 'POST',
                url: host + 'newLobby',
                headers: {'Content-Type': 'application/json'},
                data: payload,
            };

            $http(req).success(function successCallback(response) {
				console.log(response);
                $scope.showLobby = true;
                $scope.isDisabled = false;
                $scope.lobbyCode = response.id;
                
                //Lobby QR and password creation.
                $scope.lobbyQR = 'harrymjones.com/anxed/' + $scope.lobbyCode;
                
            }, function errorCallback(response) {
                //show error and send again
				console.log(response);
            });
            //End of Lobby Post
    	};
    }
])
.directive('scrollOnClick', function() {
	return {
	    restrict: 'A',
	    link: function(scope, elm, attrs) {
	     	var idToScroll = attrs.href;
	      	elm.on('click', function() {
	        	var target;
		        if (idToScroll) {
		          	target = $(idToScroll);
		        } else {
		          	target = elm;
		        }
	        	$('body, html').animate({scrollTop: target.offset().top-60}, 'slow');
	      	});
	    }
	};
})
.directive('requireLogin', function (LoginService) {
	return{
		restrict: 'A',
		scope: {
	    	callback: '&loginCallback'
	    },
		link: function(scope, elm) {
	      	elm.on('click', function() {
	        	if(!LoginService.isLoggedIn()){
	        		var loginModal = $('.login-modal');
	        		loginModal.modal('show');
	        		loginModal.on('hidden.bs.modal', function() {
	        			//Only listen to the first modal closure
	        			loginModal.off('hidden.bs.modal');
	        			if(LoginService.isLoggedIn()){
	        				scope.callback();
	        				scope.$apply();
	        			}
	        		});
	        	} else {
	        		scope.callback();
	        		scope.$apply();
	        	}
	      	});
	    }
	};
});
}());