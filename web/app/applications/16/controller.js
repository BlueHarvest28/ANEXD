(function () {
'use strict';
angular.module('ANEXD')
.controller('SCController', [
	'$scope',
	'ANEXDService',
    '$sce',
    function ($scope, ANEXDService, $sce) {
		var anexd = new ANEXDService();
        $scope.url = '';
        $scope.runFlag = '';
        $scope.messages = [];
        
        anexd.sendToServer('ishost');
                
        $scope.run = function(data) {
            $scope.url = data;
            $scope.runFlag = true;
            console.log($scope.url);
            
            SC.oEmbed($scope.url, { auto_play: true }, function(oEmbed) {
                $scope.$apply($scope.player_html = $sce.trustAsHtml(oEmbed.html));
            });
        }; 
        
        $scope.message = function(data) {
            $scope.messages.push(data, )
        }
    }
}
                                 ])
}());
        
.controller('MobileSCController', [
	'$scope',
	'ANEXDService',
	function ($scope, ANEXDService) {
		var anexd = new ANEXDService();        
        
        
        
.directive('dateNow', ['$filter', function($filter) {
  return {
    link: function( $scope, $element, $attrs) {
      $element.text($filter('date')(new Date(), $attrs.dateNow));
    }
  };
}])
