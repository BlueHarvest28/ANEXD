'use strict';

describe('Factory: SessionService', function () {

	// load the controller's module
	beforeEach(module('ANEXD'));

	var scope,
		httpBackend,
		login,
		session;

	// Initialize the controller and a mock scope
	beforeEach(inject(function ($rootScope, $controller, $httpBackend, _SessionService_) {
		scope = $rootScope.$new();
		session = _SessionService_;
		httpBackend = $httpBackend;
		
		httpBackend.when('GET', './views/home.html').respond();
		
		login = httpBackend.when('POST', 'http://api-anexd.rhcloud.com/login').respond({
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
	}));

	//20
	it('should log in an existing user', function () {
		session.login('hj80@kent.ac.uk', 'test').then(function(response){
			expect(response).toBe(true);	
		});
		httpBackend.expectPOST('http://api-anexd.rhcloud.com/login');
    	httpBackend.flush();
	});
	
	//21
	it('should fail to log in an existing user', function () {
		login.respond({'status': 'Fail'});
		session.login('hj80@kent.ac.uk', 'wrongpass').then(function(response){
			expect(response).toBe(false);	
		});
		httpBackend.expectPOST('http://api-anexd.rhcloud.com/login');
    	httpBackend.flush();
	});
	
	//22
	it('should create a new user and log in', function () {
		session.createUser('gorgonzola@kent.ac.uk', 'test').then(function(response){
			expect(response).toBe(true);	
		});
		httpBackend.expectPOST('http://api-anexd.rhcloud.com/newUser');
    	httpBackend.flush();
	});
	
	//23
	it('should create a session, check it, and close it', function () {
		session.create('12345', '14');
		expect(session.details()).toEqual({'lobby': '12345', 'app': '14'});
		expect(session.running()).toBe(true);
		session.close();
		expect(session.running()).toBe(false);
	});
});