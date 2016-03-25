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
                        
        $scope.run = function(data) {
            $scope.url = data;
            $scope.runFlag = true;
            
            SC.oEmbed($scope.url, {}, function(oEmbed) {
                $scope.$apply($scope.player_html = $sce.trustAsHtml(oEmbed.html));
            });
        }; 
        
        anexd.expect('comment');
        $scope.$watch(
            function() {
                return anexd.getFromServer();
            },
            function(data) {
                if(data){
                    if(data.event === 'comment') {
                        //console.log(data.val);
                        $scope.messages.push(data.val.data);
                        //console.log($scope.messages);
                    }
                }  
            }
        );
    }                            
])
.controller('MobileSCController', [
	'$scope',
	'ANEXDService',
	function ($scope, ANEXDService) {
		var anexd = new ANEXDService();
        $scope.messages = [];
        
        $scope.message = function(data) {
            if(data !== ''){
                $scope.chat = '';
                console.log(data);
                $scope.messages.push(data);
                anexd.sendToServer('comment', data);
            }
        };
    }
]);
}());