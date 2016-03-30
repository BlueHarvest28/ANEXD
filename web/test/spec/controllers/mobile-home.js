'use strict';

describe('Controller: MobileHomeController', function () {

	// load the controller's module
	beforeEach(module('ANEXD'));
	
	var scope,
		socket,
		session,
		controller;
	
	// Initialize the controller and a mock scope
	beforeEach(inject(function ($rootScope, $controller, $httpBackend, _SocketService_, _SessionService_) {
		scope = $rootScope.$new();
		socket = _SocketService_;
		session = _SessionService_;
		
		$httpBackend.when('GET', './views/home.html').respond();
		
		controller = $controller('MobileHomeController', {
			$scope: scope
		});
	}));

	//13
	it('should join a lobby', function () {
		scope.name = 'Harry';
		scope.lobby = '12345';
		scope.join();
		socket.default.receive('joinlobby', true);
		socket.default.receive('getappid', '14');
		expect(session.details()).toEqual({'lobby': '12345', 'app': '14'});
	});
	
	//14
	it('should toggle ready state', function () {
		scope.toggleReady();
		expect(scope.ready).toBe(true);
		scope.toggleReady();
		expect(scope.ready).toBe(false);
	});
	
	//15
	it('should hide the lobby after closing', function () {
		scope.showLobby = true;
		socket.default.receive('close');
		expect(scope.showLobby).toBe(false);
	});
	
	//16
	it('should update the user list', function () {
		scope.users = [];
		socket.default.receive('updatelobby', [{'nickname': 'harry', 'ready': false}]);
		expect(scope.users.length).toBe(1);
	});
	
});