(function () {
'use strict';
  angular.module('ANEXD')
  .controller('IndexController', [
    '$scope',
    function ($scope) 
    {
    	$scope.user = 'Harry Jones';
    }
  ]);
}());