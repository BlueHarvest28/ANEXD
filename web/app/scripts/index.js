(function () {
'use strict';
angular.module('ANEXD')
.controller('IndexController', [
    '$scope',
	'$rootScope',
    '$timeout',
    'LoginService',
    '$http',
    function ($scope, $rootScope, $timeout, LoginService, $http) 
    {		
    	$scope.loggedIn = LoginService.isLoggedIn();
        $scope.errorDisabled = false;
        var host = 'http://api-anexd.rhcloud.com/';
        
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
        
        //Settings FRED WIP
        $scope.update = function(data){
            console.log(data);
            $scope.errorDisabled = false;
            
            if(data.pass === data.rpass){
                console.log('Password Changed');
                //Hash here
                //Want Alex to REMOVE password field
                
            /*
                var payload = {
                    "userID": "",
                    "password": "",
                    "newpass": ""
                };
                var req = {
                    method: 'POST',
                    url: host + 'changePassword',
                    headers: {'Content-Type': 'application/json'},
                    data: payload,
                };
                $http(req).then(function(response) {
                    console.log(response);
                }, function errorCallback(response) {
                    console.log(response);
                });
            */
  
            } else {
                console.log('Passwords do not Match');
                $scope.errorDisabled = true;
            }
            
            if(data.user !== '') {
                console.log('Username Changed');
            }
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