(function () {
'use strict';
angular.module('ANEXD')
.controller('IndexController', [
    '$scope',
	'$rootScope',
    '$timeout',
    'LoginService',
    function ($scope, $rootScope, $timeout, LoginService) 
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
	
		$scope.isMobile = $rootScope.isMobile;
	}    
])
.directive('hideOnSubmit', function(){
	return{
		restrict: 'A',
		link: function(scope, elm, attrs) {
			console.log(attrs.shouldHide);
			var shouldHide = attrs.shouldHide;
			if(shouldHide){
				console.log('panic');
				return;
			} else {
				//in js, set variable for whether the form was successful or not 
				//Put that variable into an html attribute, might have to wrap in {{variable name}}
				$(elm).find('.login-submit').on('click', function() {
					elm.modal('hide');
				});
			}
		}
	};
});
}());