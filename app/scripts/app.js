'use strict';

angular
  .module('peerflixServerApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute',
    'btford.socket-io',
    'rt.encodeuri',
    'angularFileUpload'
  ])
  .config(['$routeProvider', '$compileProvider', function ($routeProvider,$compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|magnet|mailto|chrome-extension):/);


    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/recherche', {
        templateUrl: 'views/recherche.html',
        controller: 'RechercheCtrl'
      })
      .when('/browse', {
        templateUrl: 'views/browse.html',
        controller: 'BrowseCtrl'
      })
      .when('/show/:id',{
        templateUrl :'views/serie.html',
        controller : 'ShowCtrl'
      })
      //.when('/player/:infoHash/files/:path',{
      .when('/player',{
        templateUrl :'views/player.html',
        controller : 'playerCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  }])
  .run(function () {
    window.addEventListener('dragover', function(e) {
      e.preventDefault();
    }, false);
    window.addEventListener('drop', function(e) {
      e.preventDefault();
    }, false);
  });
