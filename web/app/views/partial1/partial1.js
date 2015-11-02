(function () {

'use strict';

  angular.module('ANEXD')

  .controller('MainController', [
    '$scope',
    function($scope) {
      $scope.test = "Testing...";
    }
  ]);

}());