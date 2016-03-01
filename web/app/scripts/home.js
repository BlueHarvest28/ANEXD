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
		        
    	$scope.$watch(function(){ return LoginService.isLoggedIn();}, function (isLoggedIn){
			$scope.isLoggedIn = isLoggedIn;
			if(!$scope.isLoggedIn){
				$scope.showIcons();
			}
		});
	
        var host = 'http://api-anexd.rhcloud.com/';
        $scope.lobbyDelFlag = false;
        $scope.lobbyQR = '';
        $scope.lobbyPass = '';
        $scope.lobbyId = '000000';
        $scope.type = '';
        
        //Called when the user closes a lobby
        function deleteLobby(){
            //Lobby Deletion Post
			var payload = {
				'lobbyID': $scope.lobbyId, //The lobbyid is in here
			};
			console.log(payload);
			var req = {
				method: 'POST',
				url: host + 'delLobby',
				headers: {'Content-Type': 'application/json'},
				data: payload,
			};
			$http(req).then(function successCallback(response) {
				console.log(response);
			}, function errorCallback(response) {
				console.log(response);
			});
        }
        
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
        
        $scope.start = function(){
            console.log('gameStart'); 
            //SOCKET.ON for GameServer "gameStart" event?
            //SocketService.emit('start',{});
        };        
        
        $scope.getLobby = function(){
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
					$scope.lobbyId = response.data.data.lobbyID;	
					deleteLobby();
				}
				$scope.launchApp();
			}, function errorCallback(response) {
				console.log(response);
			});
        };
                
        $scope.apps = [
           { 
            'name': '',
            'type': '',
            'description': '',
            'image': '',
            'rating': '',
            }
        ];  
        
        var req = {
             method: 'POST',
             url: host + 'getAllGames',
        };   
        
        //POST REQUEST for all games
        $http(req).then(function(response)  {
            $scope.apps = response.data;
            for(var i = 0; i < $scope.apps.length; i++) {
                var obj = $scope.apps[i];
                $scope.apps[i].rating = Array.apply(null, new Array(obj.rating)).map(Number.prototype.valueOf,0);
            }
        });   
        
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

        //Called on lobby creation submit
		$scope.launchMessage = 'Launch';
		$scope.isDisabled = false;
        
    	$scope.launchApp = function(){
			$scope.isDisabled = true;
			$scope.launchMessage = '';
    		$scope.lobbyDelFlag = true;
            
            //Lobby Post
            //!!!TEMP NEEDS CHANGING WHEN USER CAN LOG IN!!!
            var payload = {
                'creator': LoginService.getUserId(),
                'game': $scope.app.gameID,
                'size': $scope.lobby.max,
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
                    //Get the lobbyCode
                    $scope.lobbyId = response.data.data.id;
                    $scope.lobbyPass = response.data.data.pass;
                    //Lobby QR and password creation.
                    $scope.lobbyQR = 'harrymjones.com/anxed/' + $scope.lobbyPass;
					$scope.isDisabled = false;
					$scope.launchMessage = 'Launch';
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