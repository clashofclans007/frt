'use strict';

angular.module('peerflixServerApp')
  .controller('playerCtrl', function ($scope, $routeParams, $resource, $log, $q, $upload, torrentSocket) {

    function initVideoPlayer() {
      $scope.hash = $routeParams.infoHash;
      $scope.file = $routeParams.path;
      $scope.torrentURL="/torrents/"+$routeParams.hash+"/files/"+$routeParams.file;
      console.log("URL torrent " + $scope.torrentURL);
    }

    console.log("Hash : " + $routeParams.hash );
    console.log("File : " + $routeParams.file );

    initVideoPlayer();

    $scope.selectSubs = function(element) {
      console.log("Selection soustitre");
      $scope.$apply(function(scope) {
            //.log('files:', element.files);
            // Turn the FileList object into an Array
            $scope.subs = []
            for (var i = 0; i < element.files.length; i++) {
              var st = element.files[i];
              $scope.subs.push(element.files[i]);
              console.log(element.files[i]);

              $upload.upload({
                url: '/subs',
                file: $scope.subs

              }).then(function (response) {
                 console.log("UPLOADED");

              });

              // Ajout du track avec le lien vers le soustitre

              var video = document.getElementById("videoplayer");
              var track;

              //video.addEventListener("loadedmetadata", function() {
                //   console.log("event loadedMetadata");
               track = document.createElement('track');
               track.kind = "subtitles";
               track.label = "Francais";
               track.srclang = 'fr';
               track.src = "/subs/" + st.name;
               track.mode = "showing";


               video.appendChild(track);

              //  console.log("video texttrack : "+ video.textTracks[video.textTracks.length]);
              //  video.textTracks[video.textTracks.length].mode = "showing"; // thanks Firefox

            }
      });

    }

  });
