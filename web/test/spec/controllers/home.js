'use strict';

describe('Controller: IndexController', function () {

	// load the controller's module
	beforeEach(module('ANEXD'));

	var HomeController,
		scope;

	// Initialize the controller and a mock scope
	beforeEach(inject(function ($controller, $rootScope, $http) {
		scope = $rootScope.$new();
		HomeController = $controller('HomeController', {
			$scope: scope,
			$http: $http
		});
	}));

//	it('should attach a list of awesomeThings to the scope', function () {
//		HomeController.getGames();
//		expect(scope.apps).toBe();
//	});
});