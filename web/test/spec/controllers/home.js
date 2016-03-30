'use strict';

describe('Controller: HomeController', function () {

	// load the controller's module
	beforeEach(module('ANEXD'));

	var scope,
		httpBackend,
		socket,
		controller;

	// Initialize the controller and a mock scope
	beforeEach(inject(function ($rootScope, $controller, $httpBackend, $http, _SocketService_) {
		scope = $rootScope.$new();
		httpBackend = $httpBackend;
		socket = _SocketService_;
		
		httpBackend.when('GET', './views/home.html').respond();
		
		httpBackend.when('POST', 'http://api-anexd.rhcloud.com/getAllGames').respond([{
			'gameID': '2',
			'name': 'Return of the Aliens',
			'image': 'images/return-of-the-aliens-tile.png',
			'description': 'CROP CIRCLES. CROP TRIANGLES. UFOs. WHERE DOES IT END, SHARON? WHERE?'
		}]);
		
		httpBackend.when('POST', 'http://api-anexd.rhcloud.com/newLobby').respond({
			'data': {
				'pass': 1
			}
		});
		
		httpBackend.when('POST', 'http://api-anexd.rhcloud.com/delLobby').respond({
			'data': {
				'status': 'Success'
			}
		});
		
		controller = $controller('HomeController', {
			$scope: scope,
			$http: $http
		});
	}));

	it('should get all applications', function () {
		httpBackend.expectPOST('http://api-anexd.rhcloud.com/getAllGames');
    	httpBackend.flush();
		expect(scope.apps.length).toBe(1);
	});
	
	it('should set the active app', function () {
		var app = {
			'gameID': '2',
			'name': 'Return of the Aliens',
			'image': 'images/return-of-the-aliens-tile.png',
			'description': 'CROP CIRCLES. CROP TRIANGLES. UFOs. WHERE DOES IT END, SHARON? WHERE?'
		};
		
		scope.selectApp(app);
		expect(scope.app).toBe(app);
	});
	
	it('should set the filter type to \'Games\'', function () {
		var type = 'Games';
		scope.setFilter(type);
		expect(scope.type).toBe(type);
	});
	
	it('should get all applications', function () {
		httpBackend.expectPOST('http://api-anexd.rhcloud.com/getAllGames');
    	httpBackend.flush();
		expect(scope.apps.length).toBe(1);
	});
	
	it('should create a new lobby', function () {
		scope.launchLobby();
		httpBackend.expectPOST('http://api-anexd.rhcloud.com/newLobby');
    	httpBackend.flush();
		socket.default.receive('hostlobby', true);
		expect(scope.lobbyQR).toBe('http://api-anexd.rhcloud.com/1');
	});
	
	it('should close the lobby', function () {
		scope.launchLobby();
		httpBackend.expectPOST('http://api-anexd.rhcloud.com/newLobby');
		httpBackend.flush();
		socket.default.receive('hostlobby', true);
		scope.closeLobby();
		httpBackend.expectPOST('http://api-anexd.rhcloud.com/delLobby');
    	httpBackend.flush();
		expect(scope.activeLobby).toBe(false);
	});
	
	it('should close windows on logout', function () {
		scope.hideIcons = true;
		scope.$broadcast('logout');
		expect(scope.hideIcons).toBe(false);
	});
});