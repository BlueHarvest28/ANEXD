/*
*	TODO: COMMENTS
*/

(function () {
'use strict';
angular.module('ANEXD')
.directive('scrollOnClick', function () {
	return {
		restrict: 'A',
		link: function (scope, elm, attrs) {
			var idToScroll = attrs.href;
			elm.on('click', function () {
				var target;
				if (idToScroll) {
					target = $(idToScroll);
				} else {
					target = elm;
				}
				$('body, html').animate({
					scrollTop: target.offset().top - 60
				}, 'slow');
			});
		}
	};
})
.directive('requireLogin', function (LoginService) {
	return {
		restrict: 'A',
		scope: {
			callback: '&loginCallback'
		},
		link: function (scope, elm) {
			elm.on('click', function () {
				if (!LoginService.isLoggedIn()) {
					var loginModal = $('.login-modal');
					loginModal.modal('show');
					loginModal.on('hidden.bs.modal', function () {
						//Only listen to the first modal closure
						loginModal.off('hidden.bs.modal');
						if (LoginService.isLoggedIn()) {
							scope.callback();
							scope.$apply();
						}
					});
				} else {
					scope.callback();
					scope.$apply();
				}
			});
		}
	};
})
.directive('hideOnSubmit', function() {
	return{
		restrict: 'A',
		scope: {
			shouldHide: '@'	
		},
		link: function(scope, elm) {
			scope.$watch('shouldHide', function(value){
				if(value){
					elm.modal('hide');
				}
			});
		}
	};
})
.directive('compareTo', function() {
	return {
        require: 'ngModel',
        scope: {
            comparitor: '=compareTo',
			shouldValidate: '='
        },
        link: function(scope, element, attributes, ngModel) {
            ngModel.$validators.compareTo = function(modelValue) {
                if(scope.shouldValidate){
					return modelValue === scope.comparitor;
				} else {
					return true;
				}
            };
 
            scope.$watch('comparitor', function() {
				ngModel.$validate();	
            });
        }
    };
});
}());