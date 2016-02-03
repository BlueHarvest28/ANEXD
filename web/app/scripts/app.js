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
    'ngTouch',
    'ja.qr'
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

/*
        FRED ADDED
        call API, passing password, username or email
        if it returns true set the email to user and log them in.

        function fetch() {
        $http.get("http://www.theAPI.com/?t=" + email + "&" + password)
          .success(function(response){$scope.details = response;});

    Once the user has moved out of the box (active)
      Check email is in the database
        if yes 
          allow password and submit as normal
          check email, password and log in
        if no 
          as the email fails
            disable the submit, sign in page
            ask if they want to sign up?
              if no
                they correct their email
              if yes
                make area larger and add a reenter password box
                submit loging turns to sign up.
                input data needs to then be pushed as new user
                again password hashed.

*/


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
