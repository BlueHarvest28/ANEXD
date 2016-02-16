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

    	$scope.login = function(form){
			console.log(form.$invalid);
			$scope.shouldHide = false;
			//Wait for the modal to animate out
			$timeout( function(){
				$scope.loggedIn = LoginService.login(form.email.$modelValue, form.password.$modelValue);
				if($scope.loggedIn){
					$scope.user = LoginService.getUser();
				}
			}, 150);	
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
                console.log(response);
            }, function errorCallback(response) {
                console.log(response);
            });

			
			// if(email === 'hj80@kent.ac.uk'){
			// 	console.log('sweet');
			// 	$scope.newEmail = false;
			// 	//$scope.repeatPassword = '';
			// } else {
			// 	$scope.newEmail = true;
			// }
			// console.log(email);	
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
            }
        };

		$scope.shouldHide = true;
		
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
			$(elm).find('.login-submit').on('click', function() {
				if(scope.shouldHide === 'true'){
					elm.modal('hide');
				} else {
					console.log('not hiding');
					return;
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