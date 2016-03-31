/**
 * CO600 ANEXD Project Code
 *
 * Contributor(s): Harry Jones(HJ80) and Frederick Harrington(FH98)
 * index.js is the main frontend controller.
 * All other controllers are injected into index.html's ng-view, giving us session-wide persistence in this controller.
 * It handles the navigation header, logging in, out (and other account functions), and also displays errors.
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
	'$location',
    '$http',
    'md5',
	'CONST',
	'SessionService',
	'APIService',
	'SocketService',
    function ($scope, $rootScope, $timeout, $location, $http, md5, CONST, SessionService, APIService, SocketService) 
	{		
		//Check if the user is on mobile
		$scope.isMobile = $rootScope.isMobile;
		//Is the user logged in?
    	$scope.loggedIn = SessionService.isLoggedIn();    
		//Used to disable a button
        $scope.errorDisabled = false; 
		//Used for signing in / up; is this email recognised?
		$scope.newEmail = false;
		//Conditional show/hide vars
		$scope.shouldHide = true;
        $scope.showUpdate = false;
		
		//If logged in, get user's email to display on the header
    	if($scope.loggedIn){
    		$scope.user = SessionService.getUser();
    	}
		
		/*
		* HJ80
		* When we receive an error event, output it to the user for 5 seconds
		*/
		$scope.showError = false;
		$scope.$on(CONST.ERROR, function(event, error) {
			if(error){
				$scope.error = error;
				$scope.showError = true;
				$timeout( function(){
					$scope.showError = false;
				}, 5000);
			}
		});
		
		//Send the correct client type to the Go server
		//SEE: factories.js for more information on the SocketService functions
		var clientType;
		if($scope.isMobile){
			clientType = 'mobile';
		}
		else {
			clientType = 'desktop';
		}
		SocketService.promise('client', clientType, true)
		.then(function(response) {
			if(response){
				//Client connection successful - no action required
			}
		});
		
		//Hard move to the root path, used when clicking the ANEXD logo in the header
		$scope.home = function() {
			$location.path('/', true);
		};
        
        /*
        * HJ80
        * Function called when a user wants to login.
        * By this point, we already know if the email is recognised in the database or not
        * If it's a new user, we create them. If it's an existing user we log them straight in
		* SEE: factories.js for more information on the SessionService functions
        */ 
    	$scope.login = function(email, password) {
			//New user
			if($scope.newEmail){
				SessionService.createUser(email, password).then(function(result) {
					if(result){
						//Successful, force close the login modal
						$rootScope.$broadcast('closeModal');
						//Wait for the modal to animate out before updating
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
						//Successful, force close the login modal
						$rootScope.$broadcast('closeModal');
						//Wait for the modal to animate out before updating
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
        * Function called on email input in the login/signup modal
        * Check if the email exisits in the database.
		* SEE: factories.js for more information on the APIService functions
        */
		$scope.checkEmail = function(email) {
			//If empty, save the server the effort
			//(We have already checked that email is valid - this is just defensive)
			if(!email){
				return;
			}
			
			var payload = {
                'email' : email,
            };
			
            APIService.post('getUser', payload, false).then(
				function(response) {
					if(response.data.status === 'Success'){
						$scope.newEmail = false;
					}
					else if(response.data.status === 'Fail'){
						$scope.newEmail = true;
					}
            	}
			);
		};
        
        /*
        * FH98/HJ80
        * Function called when submit called on users settings page.
        * Function updates password to new password.
        * Function checks if the retyped password is correct.
		* Send the passwords to the changePassword API, and wait for a response
        */ 
        $scope.update = function(data) {
            $scope.errorDisabled = false;
			$scope.showUpdate = false; 
            
            //Double-check that the two passwords match
			//(This is already validated in index.html)
			if(data.npass === data.rpass) {
				var passwordHashCurrent = md5.createHash(data.cpass); 
				var passwordHash = md5.createHash(data.npass);
				
                var payload = {
                    'userID': SessionService.getUserId(),
                    'password': passwordHashCurrent,
                    'newpass': passwordHash,
                };
                
				APIService.post('changePassword', payload).then(
					function(response) {
						if(response){
							//Successful, close the login modal
							$rootScope.$broadcast('closeModal');
						}
                	}
				);
            } else {
                $scope.errorDisabled = true;
            }
        };
		
        /*
        * HJ80
        * Function is called when the user logs out.
        * Closes the modal and calls the relevant SessionService functions
        */ 
    	$scope.logout = function() {
			$rootScope.$broadcast('closeModal');
    		//Wait for the modal to animate out
    		$timeout(function() {
	            $scope.loggedIn = SessionService.logout();
    			$scope.user = undefined;
	        }, 150);
    	};
	}    
]);
}());