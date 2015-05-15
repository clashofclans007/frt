'use strict';

angular.module('peerflixServerApp')
  .controller('BrowseCtrl', function ($scope,$location, $resource, $log, $q, $upload, torrentSocket) {
    //var Torrent = $resource('/rechercher/');

    var searchEpisodes = $resource('/serie/:query');
    var search = $resource('/searchSerie/:query',{},{'List':{ method: 'GET',
                                                              isArray: true
                                                            }}
                          );

    var discover = $resource('/discover/:page');

    //$scope.series = [];
    $scope.loading =true;
    $scope.currentPage = 1;
    $scope.firstPage=true;
    var cpage = $scope.currentPage;


    discover.get({ page :  cpage }).$promise.then(function (reponseResultats) {

    //  console.debug(reponseResultats);
      angular.forEach(reponseResultats.series, function(value, key) {
        //console.debug(value);



      });
      $scope.series = reponseResultats.series;
      $scope.loading = false;
    });



    $scope.getNextPage = function(){
      $scope.currentPage +=1;
      discover.get({ page :  $scope.currentPage  }).$promise.then(function (reponseResultats) {
        $scope.series = reponseResultats.series;
        $scope.loading = false;
        $scope.firstPage=false;
      });
    }
    $scope.getPreviousPage = function(){

      if($scope.currentPage !=1){
        $scope.currentPage -=1;

        discover.get({ page :  $scope.currentPage  }).$promise.then(function (reponseResultats) {
          $scope.series = reponseResultats.series;
          $scope.loading = false;
          $scope.firstPage=false;
        });

        if($scope.currentPage <=1){
          $scope.firstPage=true;
        }
      }
    }

    $scope.rechercheEpisodesDeSerie = function (serie) {
      console.log("selection episodes de serie :" + serie.title);
      var elementARechercher =  serie.title;
      $scope.loading = true;

      $scope.series = [];
      $scope.loading =true;
      return search.List({ query: elementARechercher }).$promise.then(function (reponseResultats) {
        $scope.loading =false;
        var serie = reponseResultats[0];
        console.log("id de la serie : " + serie.id);

        console.log("redirection sur /show/" + serie.id);
        $location.path("/show/" + serie.id);
      });

    };




});
