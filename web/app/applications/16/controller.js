(function () {
'use strict';
angular.module('ANEXD')
.controller('TankController', [
	'$scope',
	'ANEXDService',
    function ($scope, ANEXDService) {
		var anexd = new ANEXDService();
        var showMusic = false;
        var musicUrl = '';
        
        var run = function(data) {
            showMusic = true;
            musicUrl = data;
            
        }
        
        var goback = function() {
            
        }
        
     
        
    }
])
});
