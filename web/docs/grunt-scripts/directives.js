/**
 * CO600 ANEXD Project Code
 *
 * Contributor(s): Harry Jones(HJ80)
 * Directives.js holds all of the front-end directives.
 * These provide angular-style access to the DOM
 * By keeping these out of controllers, we maintain a more valid MVC framework
 *
 * Copyright (C): University Of Kent 24/03/2016 
**/

(function () {
'use strict';
angular.module('ANEXD')
/*
*	HJ80
*	Scroll to the provided anchor when this element is clicked
*/
.directive('scrollOnClick', function () {
	return {
		restrict: 'A',
		link: function (scope, elm, attrs) {
			var id = attrs.href;
			elm.on('click', function () {
				var target;
				if (id) {
					target = $(id);
					console.log('target', target.offset());
				} else {
					target = elm;
				}
				//Animate to position, minus navigation bar
				$('body, html').animate({
					scrollTop: target.offset().top - 60
				}, 'slow');
			});
		}
	};
})
/*
*	HJ80
*	Stop users from activating functionality without being logged in
*	Intercepts click events and waits until SessionService confirms login
*	Once validated, executed provided callback
*/
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
					//Force the bootstrap login modal open
					loginModal.modal('show');
					//Don't run the callback till the closeModal success call
					//(Only sent on login, create user, and logout)
					scope.$on('closeModal', function(){
						//Secondary validation for successful login
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
/*
*	HJ80
*	Ensures the login modal is closed after receiving the closeModal success call
*/
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
/*
*	HJ80
*	Used to compare two form inputs for equivalence
*	Adds the result to the form validators to allow for native error messaging
*/
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
			
			//Watch for changes in the model to check
            scope.$watch('comparitor', function() {
				ngModel.$validate();	
            });
        }
    };
});
}());