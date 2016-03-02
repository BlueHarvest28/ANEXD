'use strict';

angular
.module('ANEXD', [
'ngAnimate',
'ngCookies',
'ngResource',
'ngRoute',
'ngSanitize',
'ngTouch',
'angular-md5',
'ja.qr',
'btford.socket-io'
])
.config([
	'$locationProvider',
	'$routeProvider',
	'$sceDelegateProvider',
function ($locationProvider, $routeProvider, $sceDelegateProvider) {
	
	$sceDelegateProvider.resourceUrlWhitelist([
		// Allow same origin resource loads.
		'self',
		// Allow loading from our assets domain.  Notice the difference between * and **.
		//'http://srv*.assets.example.com/**'
	]);

	$locationProvider.hashPrefix('!');
	var isMobile = (function () {
		var check = false;
		(function (a) {
			if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) {
				check = true;
			}
		})(navigator.userAgent || navigator.vendor || window.opera);
		return check;
	})();

	console.log('viewing on mobile?', isMobile);
	$routeProvider
	.when('/', {
		templateUrl: (isMobile) ? '/views/mobile-home.html' : './views/home.html',
		controller: (isMobile) ? 'MobileHomeController' : 'HomeController'
	})
	.when('/:lobbyId', {
		templateUrl: (isMobile) ? '/views/mobile-home.html' : './views/home.html',
		controller: (isMobile) ? 'MobileHomeController' : 'HomeController'
	})
	.when('/:lobbyId/:appId', {
		templateUrl: '/views/play.html',
		controller: 'PlayController'
	})
	.otherwise({
		redirectTo: '/'
	});
}])
.run([
	'$rootScope',
	'$location',
	function ($rootScope, $location) {
		$rootScope.isMobile = (function () {
			var check = false;
			(function (a) {
				if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) {
					check = true;
				}
			})(navigator.userAgent || navigator.vendor || window.opera);
			return check;
		})();

		// register listener to watch route changes
		$rootScope.$on('$routeChangeStart', function (event, next) {
			if (next.templateUrl === '/views/mobile-home.html' && !$rootScope.isMobile) {
				$location.path('/');
			}
		});
	}
])
.factory('LoginService', ['$cookies', '$http', 'md5', function ($cookies, $http, md5) {
	var host = 'http://api-anexd.rhcloud.com/';
	var loggedIn = false;

	var login = function(email, password){
		// Creating password hashing using md5 
		var passwordHash = md5.createHash(password);

		var payload = {
		  'password': passwordHash,
		  'email' : email
		};
		var req = {
			method: 'POST',
			url: host + 'login',
			headers: {'Content-Type': 'application/json'},
			data: payload,
		};
		return $http(req).then(function(response) {
			if(response.data.status === 'Success'){
				loggedIn = true;
				console.log(response.data.data);
				$cookies.put('userEmail', response.data.data.email);
				$cookies.put('userID', response.data.data.userID);
				return true;
			} 
			else if(response.data.status === 'Fail'){
				return false;
			}
		}, function errorCallback(response) {
			console.log(response);
		});
	};
	
	var logout = function(){
		loggedIn = false;
		$cookies.remove('userEmail');
		$cookies.remove('userID');
		return loggedIn;
	};
	
	var isLoggedIn = function(){
		if($cookies.get('userEmail')){
			return true;
		} else {
			return false;
		}
	};
	
	var getUser = function(){
		return $cookies.get('userEmail');
	};
	
	var createUser = function(email, password){
		var passwordHash = md5.createHash(password);
		
		var payload = {
			'username': email,
			'password' : passwordHash,
			'email' : email
		};
		var req = {
			method: 'POST',
			url: host + 'newUser',
			headers: {'Content-Type': 'application/json'},
			data: payload,
		};
		return $http(req).then(function(response) {
			if(response.data.status === 'Success'){
				loggedIn = true;
				console.log(response.data.email);
				$cookies.put('userEmail', response.data.email);
				$cookies.put('userID', response.data.userID);
				return true;
			}
			else if(response.data.status === 'Fail'){
				console.log(response);
				console.log('sign up failed');
				return false;
			}
		}, function errorCallback(response) {
			console.log(response);
		});
	};
	
	var getUserId = function(){
		return $cookies.get('userID');
	};
	
	return { 
		login: login,
		logout: logout,
		isLoggedIn: isLoggedIn,
		getUser: getUser,
		createUser: createUser,
		getUserId : getUserId
	};
}])
//NEED TO CHANGE THE HOST to API HOST
.factory('SocketService', function (socketFactory) {
	var myIoSocket = io.connect('http://localhost:3002/567');
	console.log(myIoSocket);

	var socket = socketFactory({
		ioSocket: myIoSocket
	});

	return socket;
})
.factory('ANEXDService', ['SocketService', '$q', '$timeout', function (SocketService, $q, $timeout) {
	var expected;
	
	var sendToServer = function(event, val){
		var defer = $q.defer();
		
		SocketService.emit(event, val);
		
		var resolveTimout = $timeout(function() {
			defer.reject('failed to receive response');
		}, 3000);
		
		SocketService.on(event, function(val) {
			$timeout.cancel(resolveTimout);
			defer.resolve(val);
    	});
		
		return defer.promise;
	};
	
	var expect = function(event){
		SocketService.on(event, function(val) {
			expected = {
				'event' : event,
				'val' : val
			}; 
		});
	};
	
	var getFromServer = function() {
		return expected;
	};
	
//	var event = 'nextQuestion';
//	// Setup reactor
//    //var callbacks = {};
//    SocketService.on(event, function(val) {
//		console.log(val);
////      var data = angular.fromJson(event.data);
////      if (angular.isDefined(callbacks[data.request_id])) {
////        var callback = callbacks[data.request_id];
////        delete callbacks[data.request_id];
////        callback.resolve(data);
////      } else {
////        $log.error("Unhandled message: %o", data);
////        messages.unhandled.push(data);
////      }
//    });
	
	return { 
		sendToServer: sendToServer,
		expect: expect,
		getFromServer: getFromServer
	};
}]);