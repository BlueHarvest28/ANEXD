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
        
        anexd.sendToServer('ishost');
                
        $scope.run = function(data) {
            
            $scope.url = data;
            $scope.runFlag = true;
            console.log($scope.url);
            
            SC.oEmbed($scope.url, { auto_play: true }, function(oEmbed) {
                $scope.$apply($scope.player_html = $sce.trustAsHtml(oEmbed.html));
            });
               
        };
        
        $scope.play = function() {  
            SC.pause();
        };
    }
])
}());
