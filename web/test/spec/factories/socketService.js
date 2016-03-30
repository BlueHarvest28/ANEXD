'use strict';

describe('Factory: SocketService', function () {

	// load the controller's module
	beforeEach(module('ANEXD'));

	var scope,
		httpBackend,
		socket;

	// Initialize the controller and a mock scope
	beforeEach(inject(function ($rootScope, $controller, $httpBackend, _SocketService_) {
		scope = $rootScope.$new();
		socket = _SocketService_;
		httpBackend = $httpBackend;
		
		httpBackend.when('GET', './views/home.html').respond();

		httpBackend.when('POST', 'http://api-anexd.rhcloud.com/test-example').respond({'status': 'Success'});
	}));

	//24
	it('should send a message and return a promise response', inject(function ($q) {
		var test;
		var defer = $q.defer();
		defer.resolve('test-in');
		spyOn(socket, 'promise').and.returnValue(defer.promise);
		socket.promise('test-1', 'test-out').then(function(response){
			test = response;
		});
		expect(test).toBeUndefined();
		scope.$apply();
		expect(test).toEqual('test-in');
	}));
	
	//25
	it('should send a message and fail', inject(function ($q) {
		var test;
		var defer = $q.defer();
		defer.resolve('failed to receive response');
		spyOn(socket, 'promise').and.returnValue(defer.promise);
		socket.promise('test-2', 'test-out').then(function(response){
			test = response;
		});
		expect(test).toBeUndefined();
		scope.$apply();
		expect(test).toEqual('failed to receive response');
	}));

});