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
  .factory('LoginService', function() {
  var user;
  var loggedIn  = false;
  return {
    login: function(email, password) {
      if(email === 'hj80@kent.ac.uk' && password === 'test'){
        user = 'Harry Jones';
        loggedIn = true;
      }
      else{
        loggedIn = false;
      }
      return loggedIn;
    },
    logout: function() {
      loggedIn = false;
      user = undefined;
      return loggedIn;
    },
    isLoggedIn: function() {
      return loggedIn;
    },
    getUser: function() { 
      return user; 
    }
  };
});
