(function () {
'use strict';
  angular.module('ANEXD')
  .controller('IndexController', [
    '$scope',
    function ($scope) 
    {
    	$scope.loggedIn = false;
    	$scope.checkAccount = function(email, password){
    		console.log(email, password);
    		if(email === 'hj80@kent.ac.uk' && password === 'test'){
    			$scope.user = 'Harry Jones';
    			$scope.loggedIn = true;
    		}
    	};
    	$scope.logout = function(){
    		$scope.loggedIn = false;
    	}
    }
  ]);
}());