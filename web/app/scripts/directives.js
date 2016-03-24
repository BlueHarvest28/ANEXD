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
.directive('requireLogin', function (SessionService) {
	return {
		restrict: 'A',
		scope: {
			callback: '&loginCallback'
		},
		link: function (scope, elm) {
			elm.on('click', function () {
				if (!SessionService.isLoggedIn()) {
					var loginModal = $('.login-modal');
					loginModal.modal('show');
					scope.$on('closeModal', function(){
						console.log('yes');
						console.log('logged in?', SessionService.isLoggedIn());
						if (SessionService.isLoggedIn()) {
							scope.callback();
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
			scope.$on('closeModal', function(){
				console.log('hide modal');
				elm.modal('hide');
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