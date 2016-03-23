/*
*	TODO:	CLEAN UP OLD SOCKETS
			IMPROVE LOGIN SECURITY AND RELIABILITY
*/

(function () {
'use strict';
angular.module('ANEXD')
.factory('LoginService', ['$rootScope', '$cookies', '$http', 'md5', 'CONST', function ($rootScope, $cookies, $http, md5, CONST) {
	var loggedIn = false;

	var login = function (email, password) {
		// Creating password hashing using md5 
		var hash = md5.createHash(password);

		var payload = {
			'password': hash,
			'email': email
		};
		
		var req = {
			method: 'POST',
			url: CONST.HOST + 'login',
			headers: {
				'Content-Type': 'application/json'
			},
			data: payload,
		};
		
		return $http(req).then(function (response) {
			if (response.data.status === 'Success') {
				loggedIn = true;
				$cookies.put('userEmail', response.data.data.email);
				$cookies.put('userId', response.data.data.userID);
				return true;
			} else if (response.data.status === 'Fail') {
				return false;
			}
		}, function errorCallback(response) {
			console.log(response);
		});
	};

	var logout = function () {
		loggedIn = false;
		$cookies.remove('userEmail');
		$cookies.remove('userID');
		return loggedIn;
	};

	var isLoggedIn = function () {
		if ($cookies.get('userEmail') && $cookies.get('userId')) {
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
		
		var req = {
			method: 'POST',
			url: CONST.HOST + 'newUser',
			headers: {
				'Content-Type': 'application/json'
			},
			data: payload,
		};
		
		return $http(req).then(function (response) {
			if (response.data.status === 'Fail') {
				$rootScope.$broadcast(CONST.ERROR, 'Failed to create user;', response.data.description);
				return false;
			}
			else{
				loggedIn = true;
				
				//Date for cookie expiration - 2 days from now
				var expiry = new Date();
        		expiry.setDate(expiry.getDate() + 2);
				
				$cookies.put('userEmail', response.data.email, {
					expires: expiry
				});
				$cookies.put('userId', response.data.userID, {
					expires: expiry
				});
				
				return true;	
			}
		}, function errorCallback(response) {
			$rootScope.$broadcast(CONST.ERROR, 'Failed to create user;', response.description);
		});
	};
	
	var getUser = function () {
		if($cookies.get('userEmail')){
			return $cookies.get('userEmail');
		}
		else{
			return false;
		}
	};
	
	var getUserId = function () {
		if($cookies.get('userId')){
			return parseInt($cookies.get('userId'));
		}
		else{
			return false;
		}
	};
	
	return {
		login: login,
		logout: logout,
		isLoggedIn: isLoggedIn,
		createUser: createUser,
		getUser: getUser,
		getUserId: getUserId
	};
}])
/*
 *	Generic socket interface
 *	http://api-anexd.rhcloud.com:8080/socket.io/
 *	http://api-anexd.rhcloud.com/socket.io/:8080
 */
.factory('SocketService', function (socketFactory) {
	var lobbySocket = io.connect('http://localhost:3002/');
	var socket = socketFactory({
		ioSocket: lobbySocket
	});
	return socket;
})
/*
*	OLD SOCKETS
*/
///*
// *	Socket interface for lobbies
// */
//.factory('LobbySocket', function (socketFactory) {
//	return function (lobbyId) {
//		var lobbySocket = io.connect('http://localhost:3002/' + lobbyId);
//		var socket = socketFactory({
//			ioSocket: lobbySocket
//		});
//		return socket;
//	};
//})
///*
// *	Socket interface for players
// */
//.factory('PlayerSocket', function (socketFactory) {
//	return function(socketId){
//		var playerSocket = io.connect('http://localhost:3002/' + socketId);
//		var socket = socketFactory({
//			ioSocket: playerSocket
//		});
//		return socket;	
//	};
//})
///*
// *	Socket interface for app server / ANEXD API
// */
//.factory('AppSocket', function (socketFactory) {
//	return function(lobbyId, appId){
//		var appSocket = io.connect('http://localhost:3002/' + lobbyId + '/' + appId);	
//		var socket = socketFactory({
//			ioSocket: appSocket
//		});
//		return socket;	
//	};
//})
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