'use strict';

/**
 * @ngdoc overview
 * @name webApp
 * @description
 * # webApp
 *
 * Main module of the application.
 */
angular
	.module('ANEXD', [
	'ngAnimate',
	'ngCookies',
	'ngResource',
	'ngRoute',
	'ngSanitize',
	'ngTouch',
	'ja.qr',
	'btford.socket-io'
])
	.config([
	'$locationProvider',
	'$routeProvider',
	function ($locationProvider, $routeProvider) {
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
				.when('/quiz', {
					templateUrl: (isMobile) ? '/views/mobile-quiz.html' : './views/quiz.html',
					controller: (isMobile) ? 'MobileQuizController' : 'QuizController'
				})
				.when('/:lobbyId', {
					templateUrl: '/views/mobile-home.html',
					controller: 'MobileHomeController'
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
	.factory('LoginService', ['$cookies', function ($cookies) {
		var user;
		var loggedIn = false;
    //scope.$watch::
		return {

			login: function (email, password) {
				if (email === 'hj80@kent.ac.uk' && password === 'test') {
			 		user = 'Harry Jones';
			 		loggedIn = true;
			 		$cookies.put('userCookie', user);
			 	} else {
			 		loggedIn = false;
			 	}
			 	return loggedIn;
			 },
    //Mo@kent.com
    //password: moa
    //userID: 6
    //encrypted: "5f4dcc3b5aa765d61d8327deb882cf99"

    // var request{
    //   method: 'POST',
    //             url: host + '/getUser',
    //             headers: {
    //               'Content-Type': 'application/json'
    //             },
    //             data: {
    //               'email': email;     
    //             }
    //   }
      
    // get user 
    // if user exists, login api
    //if doenst exist create
    // api resp

    // No Log-in
//    if(request.status == "Fail"){
//      user = undefined;
//      console.log("yoututue");
//      loggedIn = false;
//      console.log("Get out!");
//    }
//    // Login 
//    else if(request.status = "Success"){
//      loggedIn = true;
//      user = request.data.email;
//      $cookies.put('userCookie', user);
//      console.log(request.data.email + " : tooolllooloolol");
//      console.log("Come in for a cup of tea");
//    }
//    // Neither: No login and re login for now... Sign up will replace this
//    else{
//      loggedIn = false;
//      user = undefined;
//      console.log(request.status + " : Searching for Charizard...");
//    }
//    return loggedIn;
//    console.log(request.username + "ALAAALAAALAAALAAAALAAALLLAAA");
//    },

			 logout: function () {
			 	loggedIn = false;
			 	user = undefined;
			 	$cookies.remove('userCookie');
			 	return loggedIn;
			 },
			isLoggedIn: function () {
				var cookie = $cookies.get('userCookie');
				if (cookie) {
					user = cookie;
					//console.log(user);
					loggedIn = true;
					//console.log(loggedIn);
				}
				return loggedIn;
			},
			getUser: function () {
				return user;
			}
		};
}])

.factory('SocketService', function (socketFactory) {
	var myIoSocket = io.connect('http://localhost:3002/');
	console.log(myIoSocket);

	var socket = socketFactory({
		ioSocket: myIoSocket
	});

	return socket;
});