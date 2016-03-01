(function () {
'use strict';
angular.module('ANEXD')
.controller('IndexController', [
    '$scope',
	'$rootScope',
    '$timeout',
    'LoginService',
    '$http',
    'md5',
    function ($scope, $rootScope, $timeout, LoginService, $http, md5)
    {		
    	$scope.loggedIn = LoginService.isLoggedIn();
        $scope.errorDisabled = false;
		$scope.shouldHide = true;
        var host = 'http://api-anexd.rhcloud.com/';
        
    	if($scope.loggedIn){
    		$scope.user = LoginService.getUser();
    	}

    	$scope.login = function(email, password){
			//New user
			if($scope.newEmail){
				var createUser = LoginService.createUser(email, password);
				createUser.then(function(result) {
					if(result){
						$scope.shouldHide = true;
						$timeout( function(){
							$scope.loggedIn = true;
						}, 150);
						$scope.user = LoginService.getUser();
					}
				});	
			//Existing user
			} else {
				var loggedIn = LoginService.login(email, password);
				loggedIn.then(function(result) {
					if(result){
						$scope.shouldHide = true;
						$timeout( function(){
							$scope.loggedIn = true;
						}, 150);
						$scope.user = LoginService.getUser();	
					}
				});	
			}
    	}; 
		
		$scope.newEmail = false;
		$scope.checkEmail = function(email){
			if(!email){
				return;
			}

			var payload = {
                'email' : email,
            };
            var req = {
                method: 'POST',
                url: host + 'getUser',
                headers: {'Content-Type': 'application/json'},
                data: payload,
            };
            $http(req).then(function(response) {
            	if(response.data.status === 'Success'){
            		$scope.newEmail = false;
            	}
            	else if(response.data.status === 'Fail'){
            		$scope.newEmail = true;
            	}
            }, function errorCallback(response) {
                console.log(response);
            });
		};
        
        //Settings FRED WIP
        $scope.update = function(data){
            console.log(data);
            $scope.errorDisabled = false;
            
            var passwordHashCurrent = md5.createHash(data.cpass); 
            var passwordHash = md5.createHash(data.npass);
            var passwordHashRepeat = md5.createHash(data.rpass);
            
            if(passwordHash === passwordHashRepeat) {
                var payload = {
                    'userID': LoginService.getUserId(),
                    'password': passwordHashCurrent,
                    'newpass': passwordHash,
                };
                console.log(payload);

                var req = {
                    method: 'POST',
                    url: host + 'changePassword',
                    headers: {'Content-Type': 'application/json'},
                    data: payload,
                };
                $http(req).then(function(response) {
                    console.log(response);
                    $scope.shouldHide = true;
                }, function errorCallback(response) {
                    console.log(response);
                });
                $scope.shouldHide = false;                                
            } else {
                $scope.errorDisabled = true;
            }
        };
		
    	$scope.logout = function(){
			$scope.shouldHide = false;
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
		scope: {
			shouldHide: '@'	
		},
		link: function(scope, elm) {
			scope.$watch('shouldHide', function(value){
				if(value){
					elm.modal('hide');
				}
			});
		}
	};
})
.directive('compareTo', function() {
	return {
        require: 'ngModel',
        scope: {
            comparitor: '=compareTo',
			shouldValidate: '='
        },
        link: function(scope, element, attributes, ngModel) {
            ngModel.$validators.compareTo = function(modelValue) {
                if(scope.shouldValidate){
					return modelValue === scope.comparitor;
				} else {
					return true;
				}
            };
 
            scope.$watch('comparitor', function() {
				ngModel.$validate();	
            });
        }
    };
});
}());