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
 *	Socket interface for game server / ANEXD API
 */
.factory('GameSocket', function (socketFactory) {
	var gameSocket = io.connect('http://localhost:3002/567/1');
	var socket = socketFactory({
		ioSocket: gameSocket
	});
	return socket;
})
/*
 *	Service for ANEXD app developers. Provides an interface to the game server.
 */
.factory('ANEXDService', ['GameSocket', '$q', '$timeout', function (GameSocket, $q, $timeout) {
	//*Early implementation*
	//Holds the most recent expected event
	var expected;

	//Sends a value to the server and promises a reply on the same event
	var sendToServer = function (event, val) {
		var defer = $q.defer();
		GameSocket.emit(event, val);

		//Fails if no reply is received in 3 seconds
		//TODO: retry
		var resolveTimout = $timeout(function () {
			defer.reject('failed to receive response');
		}, 3000);

		//Return from server
		GameSocket.on(event, function (val) {
			$timeout.cancel(resolveTimout);
			defer.resolve(val);
		});
		return defer.promise;
	};

	//One expect function for each event that you could receive at any time
	//Updates expected variable with recent event result
	var expect = function (event) {
		GameSocket.on(event, function (val) {
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
}]);
}());