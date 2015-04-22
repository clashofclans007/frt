'use strict';

angular.module('peerflixServerApp')
  .controller('RechercheCtrl', function ($scope, $resource, $log, $q, $upload, torrentSocket) {
    //var Torrent = $resource('/rechercher/');

    var search = $resource('/searchSerie/:query',{},{'List':{ method: 'GET',
                                                              isArray: true
                                                            }}
                          );

    var searchEpisodes = $resource('/serie/:query');
    $scope.rechercher = function () {
      var elementARechercher =  $scope.elementRecherche;
      console.log("rechercher : " + elementARechercher);
      $scope.series = [];
      $scope.loading =true;
      return search.List({ query: elementARechercher }).$promise.then(function (reponseResultats) {
        //search.list
        console.debug(reponseResultats);
        angular.forEach(reponseResultats, function(value, key) {
          //console.debug(value);
          $scope.loading =false;
          $scope.series.unshift(value);
        });
        //$scope.series.unshift(reponseResultats);

      });

    };

    $scope.selectionSerie = function (serie) {
      console.log("selection serie :" + serie.title);


      $scope.episodes = [];
      $scope.loading =true;
      return searchEpisodes.get({ query:  serie.id }).$promise.then(function (result) {
      angular.forEach(result.episodes, function(value, key) {
          //console.debug(value);
          $scope.episodes.unshift(value);
          $scope.series = [];
          $scope.loading =false;
          $scope.series.unshift(serie);

        });

      });





    };

    $scope.selectionEpisode = function (episode) {
      console.log("selection serie :" + episode.title);
      console.log("magn serie :" + episode.magnet);

      var Torrent = $resource('/torrents/:infoHash');

      if (episode.magnet) {
        Torrent.save({ link: episode.magnet}).$promise.then(function (torrent) {
          //loadTorrent(torrent.infoHash);
          console.debug("Episode ajouté !")

        });

      }


    }

    $scope.filtreEpisode={};
    $scope.selectionSaison = function (saison) {
      console.log("selection saison :" + saison);
      $scope.filtreEpisode.seasonNumber=saison;

    };

/*    $scope.order = function(predicate, reverse) {
      $scope.episodes = orderBy($scope.episodes, predicate, reverse);
    };

    $scope.order('-episodeNumber',false);
*/

  }).filter('groupBy', ['$parse', function ($parse) {
    return function (list, group_by) {

        var filtered = [];
        var prev_item = null;
        var group_changed = false;
        // this is a new field which is added to each item where we append "_CHANGED"
        // to indicate a field change in the list
        //was var new_field = group_by + '_CHANGED'; - JB 12/17/2013
        var new_field = 'group_by_CHANGED';

        // loop through each item in the list
        angular.forEach(list, function (item) {

            group_changed = false;

            // if not the first item
            if (prev_item !== null) {

                // check if any of the group by field changed

                //force group_by into Array
                group_by = angular.isArray(group_by) ? group_by : [group_by];

                //check each group by parameter
                for (var i = 0, len = group_by.length; i < len; i++) {
                    if ($parse(group_by[i])(prev_item) !== $parse(group_by[i])(item)) {
                        group_changed = true;
                    }
                }


            }// otherwise we have the first item in the list which is new
            else {
                group_changed = true;
            }

            // if the group changed, then add a new field to the item
            // to indicate this
            if (group_changed) {
                item[new_field] = true;
            } else {
                item[new_field] = false;
            }

            filtered.push(item);
            prev_item = item;

        });

        return filtered;
    };
}]);
