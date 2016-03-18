(function () {
'use strict';
angular.module('ANEXD')
.factory('LoginService', ['$cookies', '$http', 'md5', function ($cookies, $http, md5) {
	var host = 'http://api-anexd.rhcloud.com/';
	var loggedIn = false;

	var login = function (email, password) {
		// Creating password hashing using md5 
		var passwordHash = md5.createHash(password);

		var payload = {
			'password': passwordHash,
			'email': email
		};
		var req = {
			method: 'POST',
			url: host + 'login',
			headers: {
				'Content-Type': 'application/json'
			},
			data: payload,
		};
		return $http(req).then(function (response) {
			if (response.data.status === 'Success') {
				loggedIn = true;
				console.log(response.data.data);
				$cookies.put('userEmail', response.data.data.email);
				$cookies.put('userID', response.data.data.userID);
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
		if ($cookies.get('userEmail')) {
			return true;
		} else {
			return false;
		}
	};

	var getUser = function () {
		return $cookies.get('userEmail');
	};

	var createUser = function (email, password) {
		var passwordHash = md5.createHash(password);

		var payload = {
			'username': email,
			'password': passwordHash,
			'email': email
		};
		var req = {
			method: 'POST',
			url: host + 'newUser',
			headers: {
				'Content-Type': 'application/json'
			},
			data: payload,
		};
		return $http(req).then(function (response) {
			if (response.data.status === 'Success') {
				loggedIn = true;
				console.log(response.data.email);
				$cookies.put('userEmail', response.data.email);
				$cookies.put('userID', response.data.userID);
				return true;
			} else if (response.data.status === 'Fail') {
				console.log(response);
				console.log('sign up failed');
				return false;
			}
		}, function errorCallback(response) {
			console.log(response);
		});
	};

	var getUserId = function () {
		return $cookies.get('userID');
	};

	return {
		login: login,
		logout: logout,
		isLoggedIn: isLoggedIn,
		getUser: getUser,
		createUser: createUser,
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
 *	Socket interface for lobbies
 */
.factory('LobbySocket', function (socketFactory) {
	return function (lobbyId) {
		var lobbySocket = io.connect('http://localhost:3002/' + lobbyId);
		var socket = socketFactory({
			ioSocket: lobbySocket
		});
		return socket;
	};
})
/*
 *	Socket interface for players
 */
.factory('PlayerSocket', function (socketFactory) {
	return function(socketId){
		var playerSocket = io.connect('http://localhost:3002/' + socketId);
		var socket = socketFactory({
			ioSocket: playerSocket
		});
		return socket;	
	};
})
/*
 *	Socket interface for app server / ANEXD API
 */
.factory('AppSocket', function (socketFactory) {
	return function(lobbyId, appId){
		var appSocket = io.connect('http://localhost:3002/' + lobbyId + '/' + appId);	
		var socket = socketFactory({
			ioSocket: appSocket
		});
		return socket;	
	};
})
/*
 *	Service for ANEXD app developers. Provides an interface to the game server.
 */
.factory('ANEXDService', [
	'AppSocket', 
	'SocketService', 
	'$q', 
	'$timeout', 
	'$rootScope',
	function (AppSocket, SocketService, $q, $timeout, $rootScope) 
	{
		//*Early implementation*
		//If we're in an app AND lobby (e.g. multiplayer game)
		return function(generic){
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