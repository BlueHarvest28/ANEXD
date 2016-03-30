'use strict';

describe('Factory: APIService', function () {

	// load the controller's module
	beforeEach(module('ANEXD'));

	var scope,
		httpBackend,
		api;

	// Initialize the controller and a mock scope
	beforeEach(inject(function ($rootScope, $controller, $httpBackend, _APIService_) {
		scope = $rootScope.$new();
		api = _APIService_;
		httpBackend = $httpBackend;
		
		httpBackend.when('GET', './views/home.html').respond();
		
		httpBackend.when('POST', 'http://api-anexd.rhcloud.com/test-example').respond({'status': 'Success'});
	}));

	//19
	it('should send a POST request', function () {
		api.post('test-example').then(function(response){
			expect(response).toBeDefined();
		});
		httpBackend.expectPOST('http://api-anexd.rhcloud.com/test-example');
    	httpBackend.flush();
	});

});