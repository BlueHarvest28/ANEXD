/**
* @ngdoc service
* @name ANEXD.SessionService
* @description 
* SessionService provides application-wide access to logging in, logging out, creating and removing sessions, and accessing their states
* @requires $rootScope
* @requires $cookies
* @requires $http
* @requires md5
* @requires CONST
* @requires APIService
*/
(function () {
'use strict';
angular.module('ANEXD')
.factory('SessionService', [
	'$rootScope', 
	'$cookies', 
	'$http', 
	'md5', 
	'CONST', 
	'APIService', 
	function ($rootScope, $cookies, $http, md5, CONST, APIService) {
		var loggedIn = false;
		var userId;
		var userEmail;
		var lobby;
		var app;
		var isRunning = false;
		
		//Check if the user has existing cookies, and automatically log them in if so
		if($cookies.get('userId') && $cookies.get('userEmail')){
			userId = $cookies.get('userId');
			userEmail = $cookies.get('userEmail');
			loggedIn = true;
		}
		
		/**
		* @ngdoc function
		* @name ANEXD.SessionService#login
		* @methodOf ANEXD.SessionService
		* @description attempt to log a user in given a validated existing email and password
		* @param {string} email - The user's email (confirmed by checkEmail to be a valid user email)
		* @param {string} password - The user's supposed password
		* @returns {boolean} True if the user successfully logs in, false otherwise
		*/
		var login = function (email, password) {
			// Creating password hashing using md5 
			var hash = md5.createHash(password);
			var payload = {
				'password': hash,
				'email': email
			};
			
			return APIService.post('login', payload, false).then(function(response){
				if(response.data.status === 'Success'){
					loggedIn = true;
					$cookies.put('userEmail', response.data.data.data.email);
					$cookies.put('userId', response.data.data.data.userID);
					//$cookies.put('userSession', response.data.data.session.cookie);
					
					userEmail = response.data.data.data.email;
					userId = response.data.data.data.userID;
					//APIService.session = response.data.data.session.cookie;
					return true;
				}
				else{
					return false;
				}
			});
		};
		
		/**
		* @ngdoc function
		* @name ANEXD.SessionService#logout
		* @methodOf ANEXD.SessionService
		* @description Log the user out, clear cookies, and broadcast the 'logout' event
		* @returns {undefined} No return as all actions are taken locally
		*/
		var logout = function () {
			loggedIn = false;
			$cookies.remove('userEmail');
			$cookies.remove('userId');
			userEmail = undefined;
			userId = undefined;
			$rootScope.$broadcast('logout');
		};
		
		/**
		* @ngdoc function
		* @name ANEXD.SessionService#isLoggedIn
		* @methodOf ANEXD.SessionService
		* @description Returns whether a user is currently logged in or not
		* @returns {boolean} True if the user is logged in, false otherwise
		*/
		var isLoggedIn = function () {
			if (loggedIn) {
				return true;
			} else {
				return false;
			}
		};
		
		/**
		* @ngdoc function
		* @name ANEXD.SessionService#createUser
		* @methodOf ANEXD.SessionService
		* @description Request to create a new user. If successful, call the login function on the new user.
		* @returns {boolean} True if the user is successfully created and logged in, false otherwise
		*/
		var createUser = function (email, password) {
			var hash = md5.createHash(password);
			var payload = {
				'username': email,
				'password': hash,
				'email': email
			};
			
			return APIService.post('newUser', payload).then(function(response){
				if(response){
					return login(email, password);
				}	
			});
		};
		
		/**
		* @ngdoc function
		* @name ANEXD.SessionService#getUser
		* @methodOf ANEXD.SessionService
		* @description Get the email of the user currently logged in, if any
		* @returns {string} User's email if logged in, false otherwise
		*/
		var getUser = function () {
			if(userEmail){
				return userEmail;
			}
			else{
				return false;
			}
		};
		
		/**
		* @ngdoc function
		* @name ANEXD.SessionService#getUserId
		* @methodOf ANEXD.SessionService
		* @description Get the id of the currently logged in user, if any
		* @returns {string} User's id if logged in, false otherwise
		*/
		var getUserId = function () {
			if(userId){
				return userId;
			}
			else{
				return false;
			}
		};
		
		/**
		* @ngdoc function
		* @name ANEXD.SessionService#create
		* @methodOf ANEXD.SessionService
		* @description Create a new session holding the lobby and application ids
		* @param {string} lobbyId - The lobby's id
		* @param {string} appId - The application's id
		*/
		var create = function(lobbyId, appId){
			lobby = lobbyId;
			app = appId;
			isRunning = true;
		};
		
		/**
		* @ngdoc function
		* @name ANEXD.SessionService#running
		* @methodOf ANEXD.SessionService
		* @description Check if a session is currently running
		* @returns {boolean} True if a session is running, false otherwise
		*/
		var running = function(){
			return isRunning;
		};
		
		/**
		* @ngdoc function
		* @name ANEXD.SessionService#details
		* @methodOf ANEXD.SessionService
		* @description Return the lobby and app ids of a running service
		* @returns {string} Object of two strings; {'lobby': lobby, 'app', app}
		*/
		var details = function(){
			if(isRunning){
				return {
					'lobby': lobby,
					'app': app,
				};	
			}
		};
		
		/**
		* @ngdoc function
		* @name ANEXD.SessionService#close
		* @methodOf ANEXD.SessionService
		* @description End a running session
		*/
		var close = function(){
			if(isRunning){
				lobby = undefined;
				app = undefined;
				isRunning = false;	
			}
		};
		
		return {
			login: login,
			logout: logout,
			isLoggedIn: isLoggedIn,
			createUser: createUser,
			getUser: getUser,
			getUserId: getUserId,
			create: create,
			running: running,
			details: details,
			close: close,
		};
	}
])
/**
* @ngdoc service
* @name ANEXD.APIService
* @description 
* APIService provides a simple interface for sending HTTP POST requests
* @requires $rootScope
* @requires $http
* @requires CONST
*/
.factory('APIService', ['$rootScope', '$http', 'CONST', function($rootScope, $http, CONST) {
	//var session;
	
	/**
	* @ngdoc function
	* @name ANEXD.APIService#post
	* @methodOf ANEXD.APIService
	* @description Post an HTTP POST request
	* @param {string} event The URL on the API to POST on
	* @param {string} data Any data to POST in JSON form
	* @param {boolean=true} error Should successful POSTs that return negative responses display an error message?
	* @returns {string} Either HTTP response on successful post or false otherwise
	*/
	var post = function(event, data, error){
		error = typeof error !== 'undefined' ? error : true;
		//data.cookie = session;
		var req = {
			method: 'POST',
			url: CONST.HOST + event,
			headers: {
				'Content-Type': 'application/json'
			},
			data: data,
		};
		
		return $http(req).then(function (response) {
			if (response.data.status === 'Fail') {
				console.log(response);
				if(error){
					$rootScope.$broadcast(CONST.ERROR, 'Request failed;', response.data.description);	
				}
			}
			return response;
		}, function errorCallback(response) {
			console.log(response);
			$rootScope.$broadcast(CONST.ERROR, 'Request failed;', response.description);
			return false;
		});	
	};
	
	return{
		//session: session,
		post: post,
	};
}])
/**
* @ngdoc service
* @name ANEXD.SocketService
* @description 
* SocketService provides an interface for sending and receiving websocket events.
* Also provides promises for sending then receiving a message on the same event.
* @requires $rootScope
* @requires $q
* @requires $timeout
* @requires CONST
* @requires socketFactory
*/
.factory('SocketService', [
	'$rootScope', 
	'$q', 
	'$timeout', 
	'CONST', 
	'socketFactory', 
	function ($rootScope, $q, $timeout, CONST, socketFactory) {
		//Used for web connection (same server)
//		var socket = socketFactory();
		var host = io.connect('http://api-anexd.rhcloud.com:8000');
		var socket = socketFactory({
			ioSocket: host
		});
		
		/**
		* @ngdoc function
		* @name ANEXD.SocketService#promise
		* @methodOf ANEXD.SocketService
		* @description Promises a response on the same event sent
		* @param {string} event The event to send the websocket message on
		* @param {string} val Contents of message
		* @param {boolean} error Whether to show errors on timeout (3 seconds)
		* @returns {string} Promise of the return message
		*/
		var promise = function (event, val, error) {
			var defer = $q.defer();
			socket.emit(event, val);
			
			//Fails if no reply is received in 6 seconds
			//TODO: retry?
			var resolveTimout = $timeout(function () {
				defer.reject('failed to receive response');
				//Do we want to send an error message if we don't get a reply?
				if(error){
					console.log('error:', event, val);
					$rootScope.$broadcast(CONST.ERROR, 'We\'re having problems connecting to the server right now, please try again; ' + event + ', ' + val);
				}
			}, 6000);
			
			//Return from server
			socket.on(event, function (response) {
				$timeout.cancel(resolveTimout);
				defer.resolve(response);
			});
			return defer.promise;
		};
		
		/**
		* @ngdoc function
		* @name ANEXD.SocketService#emit
		* @methodOf ANEXD.SocketService
		* @description Sends a message on the provided event (also possible using socket.default.emit)
		* @param {string} event The event to send the websocket message on
		* @param {string} val Contents of message
		*/
		var emit = function(event, val){
			socket.emit(event, val);
		};
		
		return {
			'default': socket,
			'emit': emit,
			'promise': promise,
		};
	}
])
/**
* @ngdoc service
* @name ANEXD.ANEXDService
* @description 
* Provides a simple interface for application developers to send and receive websocket messages from the server
* @requires $rootScope
* @requires $timeout
* @requires SocketService
*/
.factory('ANEXDService', [
	'SocketService', 
	'$timeout', 
	'$rootScope',
	function (SocketService, $timeout, $rootScope) {
		return function(){
			//Leave game if we receieve the message from PlayController
			$rootScope.$on('leave', function(){
				SocketService.default.emit('leave');
			});
			
			//Holds the most recent expected event
			var expected;
			
			/**
			* @ngdoc function
			* @name ANEXD.ANEXDService#sendToServer
			* @methodOf ANEXD.ANEXDService
			* @description Send a message to the server and wait for a reply using SocketService promise
			* @param {string} event The event to send the websocket message on
			* @param {string} val Contents of message
			*/
			var sendToServer = function (event, val) {
				return SocketService.promise('msg', {'event': event, 'data': val}).then(
					function(response) {
						return response;
					}
				);
			};
			
			/**
			* @ngdoc function
			* @name ANEXD.ANEXDService#expect
			* @methodOf ANEXD.ANEXDService
			* @description Call once for each message expected from the server that may be received at any time
			* Different from sendToServer in that it isn't in response to any other event
			* Results are gathered from the getFromServer function
			* @param {string} event The event to listen on
			*/
			var expect = function (event) {
				SocketService.default.on(event, function (val) {
					expected = {
						'event': event,
						'val': val
					};
				});
			};
			
			/**
			* @ngdoc function
			* @name ANEXD.ANEXDService#getFromServer
			* @methodOf ANEXD.ANEXDService
			* @description returns the most recent websocket message received being listened on by expect
			* Use $scope.$watch to access on the $digest cycle
			* @returns {string} Object of the event and data received from the most recent event
			*/
			var getFromServer = function () {
				return expected;
			};
			
			return {
				sendToServer: sendToServer,
				expect: expect,
				getFromServer: getFromServer
			};	
		};
	}
]);
}());