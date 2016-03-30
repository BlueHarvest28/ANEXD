'use strict';

describe('Factory: ANEXDService', function () {
	
	beforeEach(module('ANEXD'));

	var scope,
		httpBackend,
		Anexd,
		anexd,
		socket;
	
	beforeEach(inject(function ($rootScope, $controller, $httpBackend, _ANEXDService_, _SocketService_) {
		scope = $rootScope.$new();
		Anexd = _ANEXDService_;
		anexd = new Anexd();
		socket = _SocketService_;
		httpBackend = $httpBackend;
		httpBackend.when('GET', './views/home.html').respond();
	}));
	
	it('should send a message and return a promise', inject(function ($q) {
		var test;
		var defer = $q.defer();
		defer.resolve('test-in');
		spyOn(anexd, 'sendToServer').and.returnValue(defer.promise);
		anexd.sendToServer('test-3', 'test-out').then(function(response){
			test = response;
		});
		expect(test).toBeUndefined();
		scope.$apply();
		expect(test).toEqual('test-in');
	}));
	
	it('should expect then receive a message and return it', function() {
		anexd.expect('test-4');
		socket.default.receive('test-4', 'test-in');
		expect(anexd.getFromServer().val).toEqual('test-in');
	});

});