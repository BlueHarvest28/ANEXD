(function () {
'use strict';
angular.module('ANEXD')
.controller('YTController', [
    '$scope',
    'ANEXDService',
    function ($scope, ANEXDService) {
    var anexd = new ANEXDService();
        $scope.messages = [];
        
        anexd.expect('comment');
        $scope.$watch(
            function() {
                return anexd.getFromServer();
            },
            function(data) {
                if(data){
                    if(data.event === 'comment') {
                        $scope.messages.push(data.val.data);
                    }
                }  
            }
        );
    }                            
])

.controller('MobileYTController', [
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