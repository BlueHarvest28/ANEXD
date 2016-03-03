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
});
}());