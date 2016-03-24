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

/*
*	TODO:	IMPROVE LOGIN RELIABILITY (SEE: FACTORIES.JS)
*/

(function () {
'use strict';
angular.module('ANEXD')
.controller('IndexController', [
    '$scope',
	'$rootScope',
    '$timeout',
	'$location',
    '$http',
    'md5',
	'CONST',
	'SessionService',
	'SocketService',
    function ($scope, $rootScope, $timeout, $location, $http, md5, CONST, SessionService, SocketService)
    {		
        /* Local and $scope variables */
		$scope.isMobile = $rootScope.isMobile;             //Check if the user is on mobile
    	$scope.loggedIn = SessionService.isLoggedIn();       //Is the user logged in
        $scope.errorDisabled = false;                      //Used to disable a button
		$scope.shouldHide = true;                          //Used to hide parts of HTML
        $scope.showUpdate = false;
		
		$scope.showError = false;
		$scope.$on('error', function(event, error){
			console.log('error', error);
			if(error){
				$scope.error = error;
				$scope.showError = true;
				$timeout( function(){
					$scope.showError = false;
				}, 5000);
			}
		});
		
		$scope.home = function(){
			SocketService.disconnect();
			$location.path('/', true);
		};
		
        //If someone is logged in then get that users id
    	if($scope.loggedIn){
    		$scope.user = SessionService.getUser();
    	}
		
		//Set the flag to false
		$scope.newEmail = false;
        
        /*
        * HJ80
        * Function is called when a user wants to login
        * Function contains parts for a new and existing users
        * Calls SessionService with both createUser() and login() 
        */ 
    	$scope.login = function(email, password) {
			//New user
			if($scope.newEmail){
				SessionService.createUser(email, password).then(function(result) {
					if(result){
						$rootScope.$broadcast('closeModal');
						$timeout( function(){
							$scope.loggedIn = true;
						}, 150);
						$scope.user = SessionService.getUser();
					}
				});	
			//Existing user
			} else {
				SessionService.login(email, password).then(function(result) {
					if(result){
						$rootScope.$broadcast('closeModal');
						$timeout( function(){
							$scope.loggedIn = true;
						}, 150);
						$scope.user = SessionService.getUser();	
					}
				});
			}
    	}; 
        
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
                url: CONST.HOST + 'getUser',
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
                $rootScope.$broadcast(CONST.ERROR, 'Failed to check email;', response.description);
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
			$scope.showUpdate = false;
            
            var passwordHashCurrent = md5.createHash(data.cpass); 
            var passwordHash = md5.createHash(data.npass);
            var passwordHashRepeat = md5.createHash(data.rpass);
            
            if(passwordHash === passwordHashRepeat) {
                var payload = {
                    'userID': SessionService.getUserId(),
                    'password': passwordHashCurrent,
                    'newpass': passwordHash,
                };
                console.log(payload);

                var req = {
                    method: 'POST',
                    url: CONST.HOST + 'changePassword',
                    headers: {'Content-Type': 'application/json'},
                    data: payload,
                };
                $http(req).then(function(response) {
                    console.log(response);
                    $scope.shouldHide = true;
                }, function errorCallback(response) {
                    $rootScope.$broadcast(CONST.ERROR, 'Couldn\'t update user;', response.description);
                });
                $scope.shouldHide = false;                                
            } else {
                $scope.errorDisabled = true;
            }
        };
		
        /*
        * HJ80
        * Function is called when the user logout.
        * Function calles two SessionService functions, logout and getUser.
        * Function contains timeout function. 
        */ 
    	$scope.logout = function() {
			$rootScope.$broadcast('closeModal');
    		//Wait for the modal to animate out
    		$timeout( function(){
	            $scope.loggedIn = SessionService.logout();
    			$scope.user = undefined;
	        }, 150);
    	};
	
        //Check if the user is on mobile
		$scope.isMobile = $rootScope.isMobile;
	}    
]);
}());