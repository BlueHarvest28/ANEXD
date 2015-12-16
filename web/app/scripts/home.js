(function () {
'use strict';
angular.module('ANEXD')
.controller('HomeController', [
	'$scope',
    '$timeout',
    'LoginService',
    function ($scope, $timeout, LoginService) 
    {			
    	$scope.$watch(LoginService.isLoggedIn, function (isLoggedIn){
			$scope.isLoggedIn = isLoggedIn;
			if(!$scope.isLoggedIn){
				$scope.showIcons();
			}
		});
	
        // Make function to get games from API. 
        // Put into array like below.
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
                'ready': true,
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
    	};

    	$scope.type = '';
    	$scope.setFilter = function(type){
    		$scope.type = type;
    	};

        // Pass prams from form and send to APIh
    	$scope.launchApp = function(){
    		$scope.showLobby = true;
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