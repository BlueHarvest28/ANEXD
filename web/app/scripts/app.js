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
    'ngMessages',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])
  .config([
    '$locationProvider',
    '$routeProvider',
    function($locationProvider, $routeProvider) {
      $locationProvider.hashPrefix('!');
      // routes
      $routeProvider
        .when('/', {
          templateUrl: './views/home.html',
          controller: 'HomeController'
        })
        .otherwise({
           redirectTo: '/'
        });
    }
  ])
    
  .factory('LoginService', ['$cookies', function($cookies) {
  var user;
  var loggedIn = false;
  return {

    login: function(email, password) {

      //call API, passing password, username or email
      //Regex to check if its a username or email
      if(email === 'hj80@kent.ac.uk' && password === 'test'){
        user = 'Harry Jones';
        loggedIn = true;
		    $cookies.put('userCookie', user);
      }
      else{
        loggedIn = false;a
      }
      return loggedIn;
    },
    logout: function() {
      loggedIn = false;
      user = undefined;
	  $cookies.remove('userCookie');
      return loggedIn;
    },
    isLoggedIn: function() {
		var cookie = $cookies.get('userCookie');
		if(cookie){
			user = cookie;
			//console.log(user);
			loggedIn = true;
			//console.log(loggedIn);
		}
		return loggedIn;
    },
     getUser: function() { 
      return user; 
    }
  };
}]);
