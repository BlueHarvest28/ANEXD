/**
 * CO600 ANEXD Project Code
 *
 * Contributor(s): Frederick Harrington(FH98) and Harry Jones(HJ80)
 * index.js is a part of the frontend web deveoplment
 * index.js manages all mobile based frontend in partnership with index.html
 * index.js includes functions for signing in and login.
 *
 * Copyright (C): University Of Kent 01/03/2016 
**/
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
        /* Local and $scope variables */
		$scope.isMobile = $rootScope.isMobile;             //Check if the user is on mobile
    	$scope.loggedIn = LoginService.isLoggedIn();       //Is the user logged in
        $scope.errorDisabled = false;                      //Used to disable a button
		$scope.shouldHide = true;                          //Used to hide parts of HTML
        var host = 'http://api-anexd.rhcloud.com/';        //Host address for http requests
        
        
        //If the someone is logged in then get that users id
    	if($scope.loggedIn){
    		$scope.user = LoginService.getUser();
    	}
        
        /*
        * HJ80
        * Function is called when a user wants to login
        * Function contains parts for a new and existing users
        * Calls LoginService with both createUser() and login() 
        */ 
    	$scope.login = function(email, password) {
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
		
        //Set the flag to false
		$scope.newEmail = false;
        
        /*
        * HJ80
        * Function called on email input
        * Function checks if the email exisits in the database.
        * HTTP Post request contains submitted email
        * HTTP Post request receives boolean
        */
		$scope.checkEmail = function(email) {
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
        
        /*
        * FH98
        * Function called when submit called on users settings page.
        * Function updates password to new password.
        * Function checks if the retyped password is correct.
        * HTTP Post request contains user Id, current password and new password.
        * HTTP Post request recieves boolean.
        */ 
        $scope.update = function(data) {
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
		
        /*
        * HJ80
        * Function is called when the user logout.
        * Function calles two LoginService functions, logout and getUser.
        * Function contains timeout function. 
        */ 
    	$scope.logout = function() {
			$scope.shouldHide = false;
    		//Wait for the modal to animate out
    		$timeout( function(){
	            $scope.loggedIn = LoginService.logout();
    			$scope.user = LoginService.getUser();
	        }, 150);
    	};
	
        //Check if the user is on mobile
		$scope.isMobile = $rootScope.isMobile;
	}    
])
.directive('hideOnSubmit', function() {
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