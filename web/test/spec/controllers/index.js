'use strict';

describe('Controller: IndexController', function () {

	// load the controller's module
	beforeEach(module('ANEXD'));

	var rootScope,
		scope,
		httpBackend;

	// Initialize the controller and a mock scope
	beforeEach(inject(function ($rootScope, $controller, $httpBackend) {
		rootScope = $rootScope;
		scope = $rootScope.$new();
		httpBackend = $httpBackend;
		
		httpBackend.when('GET', './views/home.html').respond();
		
		httpBackend.when('POST', 'http://api-anexd.rhcloud.com/login').respond({
			'status': 'Success',
			'data': {
				'data': {
					'data': {
						'email': 'hj80@kent.ac.uk',
						'userID': 20
					}
				}
			}
		});
		
		httpBackend.when('POST', 'http://api-anexd.rhcloud.com/newUser').respond({
			'status': 'Success' 
		});
		
		httpBackend.when('POST', 'http://api-anexd.rhcloud.com/getUser').respond({
			'status': 'Fail'
		});
		
		httpBackend.when('POST', 'http://api-anexd.rhcloud.com/changePassword').respond({
			'status': 'Success' 
		});
		
		$controller('IndexController', {
			$scope: scope
		});
	}));
	
	//1
	it('should log in an existing user', function () {
		expect(scope.user).toBeUndefined();
		scope.newEmail = false;
		scope.login('hj80@kent.ac.uk', 'test');
		httpBackend.expectPOST('http://api-anexd.rhcloud.com/login');
    	httpBackend.flush();
		expect(scope.user).toBeDefined();
	});
	
	//2
	it('should create a new user and log in', function () {
		expect(scope.user).toBeUndefined();
		scope.newEmail = true;
		scope.login('newguy@kent.ac.uk', 'test');
		httpBackend.expectPOST('http://api-anexd.rhcloud.com/newUser');
    	httpBackend.flush();
		expect(scope.user).toBeDefined();
	});
	
	//3
	it('should log the user out', inject(function ($timeout) {
		scope.user = 'Edgar Badgerdon';
		scope.logout();
		$timeout.flush();
		expect(scope.user).toBeUndefined();
	}));
	
	//4
	it('should set the newEmail flag to true', function () {
		scope.newEmail = false;
		scope.checkEmail('gorgonzola@kent.ac.uk');
		httpBackend.expectPOST('http://api-anexd.rhcloud.com/getUser');
    	httpBackend.flush();
		expect(scope.newEmail).toBe(true);
	});
	
	//5
	it('should update the user\'s password', function () {
		scope.update({
			'cpass': 'test',
			'npass': 'testy',
			'rpass': 'testy'
		});
		
		httpBackend.expectPOST('http://api-anexd.rhcloud.com/changePassword');
    	httpBackend.flush();
		spyOn(rootScope, '$broadcast').and.callThrough();
		rootScope.$broadcast('closeModal');
		expect(rootScope.$broadcast).toHaveBeenCalledWith('closeModal');
	});
	
});