(function () {
'use strict';
  angular.module('ANEXD')
  .controller('HomeController', [
    '$scope',
    function ($scope) 
    {
    	$scope.apps = [
    		{
    			'name': 'The Satan Test',
    			'type': 'Quiz',
    			'description': 'Think you know Satan? Think Again in this exceptionally pagan quiz.',
    			'image': 'images/satan-tile.png',
    		},
    		{
    			'name': 'The Satan Test 2',
    			'type': 'Quiz',
    			'description': 'MORE SATANIC GLORY FOR THE MASSES BOOYAKASHA. This is an unnecessarily long title, let\'s see if we can handle this one well',
    			'image': 'images/satan-tile.png',
    		},
    		{
    			'name': 'The Satan Test 3',
    			'type': 'Game',
    			'description': 'Please stop requesting Satan quizzes.',
    			'image': 'images/satan-tile.png',
    		}
    	];

    	$scope.loadTile = function(app){
    		$scope.hideIcons = true;
    		$scope.app = app;
    	};

    	$scope.showIcons = function(){
    		$scope.hideIcons = false;
    	};

    	$scope.setFilter = function(type){
    		$scope.type = type;
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
	});
}());