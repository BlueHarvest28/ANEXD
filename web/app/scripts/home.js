(function () {

'use strict';

  angular.module('ANEXD')

  .controller('HomeController', [
    '$scope',
    function($scope) {
      $scope.test = 'Testing...';
    }
  ]);

}());