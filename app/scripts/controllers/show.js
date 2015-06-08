'use strict';

angular.module('peerflixServerApp')
  .controller('ShowCtrl', function ($scope, $routeParams, $resource, $log, $q, $upload, torrentSocket) {

    var search = $resource('/searchSerie/:query',{},{'List':{ method: 'GET',
                                                              isArray: true
                                                            }}
                          );

    var searchEpisodes = $resource('/serie/:query');
    if(!$scope.episodes){
      initEpisodes();
    }

    function initEpisodes(){

      $scope.filtreEpisode={};
      $scope.loading =true;

      searchEpisodes.get({ query:  $routeParams.id }).$promise.then(function (result) {
        $scope.serie=result;
        $scope.loading =false;
      });
    }





    function getInfoSerie(){
      //imdbid
    }

    $scope.selectionSaison = function (saison) {
      console.log("selection saison :" + saison);
      $scope.filtreEpisode.seasonNumber=saison;

    };

    $scope.selectionEpisode = function (episode) {
      console.log("selection serie :" + episode.title);
      console.log("magn serie :" + episode.magnet);

      var Torrent = $resource('/torrents/:infoHash');

      if (episode.magnet) {
        $scope.loading = true;
        Torrent.save({ link: episode.magnet}).$promise.then(function (torrent) {
          //loadTorrent(torrent.infoHash);
          console.debug("Episode ajouté !")
          $scope.loading = false;

        });

      }


    }


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
