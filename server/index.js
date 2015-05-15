'use strict';

var rangeParser = require('range-parser'),
  pump = require('pump'),
  _ = require('lodash'),
  express = require('express'),
  multipart = require('connect-multiparty'),
  fs = require('fs'),
  path = require('path'),
  request = require('request'),

  ffmpeg = require('./ffmpeg'),
  store = require('./store'),
  progress = require('./progressbar'),
  stats = require('./stats'),

  api = express();

api.use(express.json());
api.use(express.logger('dev'));

var eztv = require('eztv');
var util = require('util');


function serialize(torrent) {
  if (!torrent.torrent) {
    return { infoHash: torrent.infoHash };
  }
  return {
    infoHash: torrent.infoHash,
    name: torrent.torrent.name,
    interested: torrent.amInterested,
    ready: torrent.torrent.ready,
    files: torrent.torrent.files,
    progress: progress(torrent.bitfield.buffer)
  };
}


api.get('/subs/:file',function(req,res){
  var subsfile;
  if( req.params.file){
    subsfile=req.params.file;
  }
  console.log(" Getting subs for :" + subsfile);

  var resultat = "srt";

  res.send(resultat);


});

api.get('/discover/:page',function(req,res){
  var page = 1;
  if( req.params.page){
    page = req.params.page;
  }
  console.log("appel : http://eztvapi.re/shows/" + page );

  //appel api 
  request("http://eztvapi.re/shows/"+page, function (error, response, body) {

   if (!error && response.statusCode == 200){
      var resultat ={};
      var listSeries = [];
      var json = JSON.parse(body);

      console.log("json length" + json.length);

      for(var i= 0; i < json.length; i++)
      {
        var e = json[i];
        console.log(e);
        //convertisseur
        /*var serie = {};

        serie.title = e.title;
        serie.image = e.images.poster
         */
        listSeries.push(e);
      }

      resultat.series = listSeries;
      //console.log("Resultat :" + list);
      res.send(resultat);
    }
    else{
      console.log("Erreur :" + resultat);

      res.status(500).send({ error: 'Something blew up!' });
    }



 });


});

api.get('/searchSerie/:querystr', function(req, res) {

  var q = req.params.querystr;
  console.log("recherche de serie: " + q);

  //res.send([{nom:"CCC",magnet:"CCC URL"},{nom:"DDD",magnet:"DDD url"}]);
  eztv.getShows({query:q}, function(error, results) {

    if(error){
      console.log("Erreur : " + error);
    }
    //console.log("Resultats :" + results);

    res.send(results);

    //res.send(results);


  });

});

api.get('/serie/:id', function(req, res) {

  var id = req.params.id;
  console.log("recherche de la serie: " + id);

  eztv.getShowEpisodes(id, function(error, results) {

    if(error){
      console.log("Erreur : " + error);
    }
    console.log("Resultats :" + results);

    res.send(results);

    //res.send(results);


  });

});

api.get('/torrents', function (req, res) {
  res.send(store.list().map(serialize));
});

api.get('/torrents/:infoHash', function (req, res) {
  var torrent = store.get(req.params.infoHash);
  if (!torrent) {
    return res.send(404);
  }
  res.send(serialize(torrent));
});

api.delete('/torrents/:infoHash', function (req, res) {
  var torrent = store.get(req.params.infoHash);
  if (!torrent) {
    return res.send(404);
  }
  store.remove(req.params.infoHash);
  res.send(200);
});

api.post('/torrents', function (req, res) {
  store.add(req.body.link, function (err, infoHash) {
    if (err) {
      console.error(err);
      res.send(500, err);
    } else {
      res.send({ infoHash: infoHash });
    }
  });
});

api.post('/upload', multipart(), function (req, res) {
  var file = req.files && req.files.file;
  if (!file) {
    return res.send(500, 'file is missing');
  }
  store.add(file.path, function (err, infoHash) {
    if (err) {
      console.error(err);
      res.send(500, err);
    } else {
      res.send({ infoHash: infoHash });
    }
    fs.unlink(file.path);
  });
});

api.get('/torrents/:infoHash/stats', function (req, res) {
  var torrent = store.get(req.params.infoHash);
  if (!torrent) {
    return res.send(404);
  }
  res.send(stats(torrent));
});

api.get('/torrents/:infoHash/files', function (req, res) {
  var torrent = store.get(req.params.infoHash);
  if (!torrent) {
    return res.send(404);
  }
  res.setHeader('Content-Type', 'application/x-mpegurl; charset=utf-8');
  res.send('#EXTM3U\n' + torrent.files.map(function (f) {
    return '#EXTINF:-1,' + f.path + '\n' +
      req.protocol + '://' + req.get('host') + '/torrents/' + req.params.infoHash + '/files/' + encodeURIComponent(f.path);
  }).join('\n'));
});

api.all('/torrents/:infoHash/files/:path([^"]+)', function (req, res) {

  var torrent = store.get(req.params.infoHash), file;

  if (!torrent || !(file = _.find(torrent.files, { path: req.params.path }))) {
    return res.send(404);
  }

  if (typeof req.query.ffmpeg !== 'undefined') {
    console.log("ffmep query is not undefined");
    return ffmpeg(req, res, torrent, file);
  }

  var range = req.headers.range;
  range = range && rangeParser(file.length, range)[0];
  res.setHeader('Accept-Ranges', 'bytes');
  res.type(file.name);
  console.log("file  :" + file.name);
  console.log("Length : " + file.length);
  req.connection.setTimeout(3600000);


  if (!range) {
    res.setHeader('Content-Length', file.length);
    if (req.method === 'HEAD') {
      return res.end();
    }

    console.log("creation du readStream NOt ragne")
    return pump(file.createReadStream(), res);
  }

  res.statusCode = 206;
  res.setHeader('Content-Length', range.end - range.start + 1);
  res.setHeader('Content-Range', 'bytes ' + range.start + '-' + range.end + '/' + file.length);

  if (req.method === 'HEAD') {
    return res.end();
  }

  console.log("Pumping range :" +  util.inspect(range, false, null));

  console.log("file : " + util.inspect(file, false, null));




  //evoie de la video en streaming sur le navigateur
  pump(file.createReadStream(range), res);

  //var proc = require('child_process')

});

module.exports = api;
