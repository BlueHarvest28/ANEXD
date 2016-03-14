'use strict';

describe('Controller: IndexController', function () {

	// load the controller's module
	beforeEach(module('ANEXD'));

	var IndexController,
		scope;

	// Initialize the controller and a mock scope
	beforeEach(inject(function ($controller, $rootScope) {
		scope = $rootScope.$new();
		IndexController = $controller('IndexController', {
			$scope: scope
		});
	}));

	//  it('should attach a list of awesomeThings to the scope', function () {
	//    expect(IndexController.login('fakeemail@fake.fake', 'test')).toBe(3);
	//  });
});