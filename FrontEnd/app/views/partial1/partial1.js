(function () {

'use strict';

  angular.module('SampleApp')

  .controller('MainController', [
    '$scope',
    function($scope) {
      $scope.test = "Testing...";
    }
  ]);

}());