(function () {
'use strict';
angular.module('ANEXD')
.controller('IndexController', [
    '$scope',
    '$timeout',
    'LoginService',
    function ($scope, $timeout, LoginService) 
    {
    	$scope.loggedIn = LoginService.isLoggedIn();
    	
    	if($scope.loggedIn){
    		$scope.user = LoginService.getUser();
    	}

    	$scope.login = function(email, password){
    		//Wait for the modal to animate out
    		$timeout( function(){
	            $scope.loggedIn = LoginService.login(email, password);
	    		if($scope.loggedIn){
	    			$scope.user = LoginService.getUser();
	    		}
	        }, 150);
    	};

    	$scope.logout = function(){
    		//Wait for the modal to animate out
    		$timeout( function(){
	            $scope.loggedIn = LoginService.logout();
    			$scope.user = LoginService.getUser();
	        }, 150);
    	};
    }
])
.directive('hideOnSubmit', function(){
	return{
		restrict: 'A',
		link: function(scope, elm) {
	      	$(elm).find('.login-submit').on('click', function() {
        		elm.modal('hide');
	      	});
	    }
	};
});
}());