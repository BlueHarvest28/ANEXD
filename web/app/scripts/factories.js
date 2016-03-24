/*
*	TODO:	CLEAN UP OLD SOCKETS
			IMPROVE LOGIN SECURITY AND RELIABILITY
*/

(function () {
'use strict';
angular.module('ANEXD')
.factory('SessionService', ['$rootScope', '$cookies', '$http', 'md5', 'CONST', 'APIService', function ($rootScope, $cookies, $http, md5, CONST, APIService) {
	var loggedIn = false;
	var userId;
	var userEmail;
	var lobby;
	var app;
	var isRunning = false;
	
	if($cookies.get('userId') && $cookies.get('userEmail')){
		userId = $cookies.get('userId');
		userEmail = $cookies.get('userEmail');
		loggedIn = true;
	}

	var login = function (email, password) {
		// Creating password hashing using md5 
		var hash = md5.createHash(password);
		var payload = {
			'password': hash,
			'email': email
		};
		
		return APIService.post('login', payload).then(function(response){
			if(response){
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

	var logout = function () {
		loggedIn = false;
		$cookies.remove('userEmail');
		$cookies.remove('userId');
		userEmail = undefined;
		userId = undefined;
		$rootScope.$broadcast('logout');
	};

	var isLoggedIn = function () {
		if (loggedIn) {
			return true;
		} else {
			return false;
		}
	};
	
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
		
	var getUser = function () {
		if(userEmail){
			return userEmail;
		}
		else{
			return false;
		}
	};
	
	var getUserId = function () {
		if(userId){
			return userId;
		}
		else{
			return false;
		}
	};
	
	var create = function(lobbyId, appId){
		lobby = lobbyId;
		app = appId;
		isRunning = true;
	};
	
	var running = function(){
		return isRunning;
	};
	
	var details = function(){
		return {
			'lobby': lobby,
			'app': app,
		};
	};
	
	var close = function(){
		lobby = undefined;
		app = undefined;
		isRunning = false;
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
}])
.factory('APIService', ['$rootScope', '$http', 'CONST', function($rootScope, $http, CONST) {
	//var session;
	
	var post = function(event, data){
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
				$rootScope.$broadcast(CONST.ERROR, 'Request failed;', response.data.description);
				return false;
			}
			else{
				return response;
			}
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
/*
 *	Generic socket interface
 *	http://api-anexd.rhcloud.com:8080/socket.io/
 *	http://api-anexd.rhcloud.com/socket.io/:8080
 */
.factory('SocketService', function (socketFactory) {
//	var socket = socketFactory();
	var lobbySocket = io.connect('http://localhost:3002/');
	var socket = socketFactory({
		ioSocket: lobbySocket
	});
	return socket;
})
/*
 *	Service for ANEXD app developers. Provides an interface to the game server.
 */
.factory('ANEXDService', [
	'SocketService', 
	'$q', 
	'$timeout', 
	'$rootScope',
	function (SocketService, $q, $timeout, $rootScope) 
	{
		return function(){
			var socket;
			
//			if($rootScope.lobby && $rootScope.app && !generic){
//				socket = new AppSocket($rootScope.lobby, $rootScope.app);
//			}
//			//Otherwise we're in an app without a lobby (e.g. creating a quiz)
//			else {
				socket = SocketService;
//			}
			
			//Leave game if we receieve the message from PlayController
			$rootScope.$on('leave', function(){
				socket.emit('leave');
			});
			
			//Holds the most recent expected event
			var expected;

			//Sends a value to the server and promises a reply on the same event
			var sendToServer = function (event, val) {
				var defer = $q.defer();
				socket.emit('msgserver', {'event': event, 'data': val});

				//Fails if no reply is received in 3 seconds
				//TODO: retry
				var resolveTimout = $timeout(function () {
					defer.reject('failed to receive response');
				}, 6000);

				//Return from server
				socket.on(event, function (val) {
					$timeout.cancel(resolveTimout);
					defer.resolve(val);
				});
				return defer.promise;
			};

			//One expect function for each event that you could receive at any time
			//Updates expected variable with recent event result
			var expect = function (event) {
				socket.on(event, function (val) {
					expected = {
						'event': event,
						'val': val
					};
				});
			};

			//Scope watch getFromServer() for events defined by expect(event)
			var getFromServer = function () {
				return expected;
			};

			return {
				sendToServer: sendToServer,
				expect: expect,
				getFromServer: getFromServer
			};	
		};
}]);
}());