'use strict';

var path = require('path'),
  fs = require('fs'),
  ffmpeg = require('fluent-ffmpeg'),
  pump = require('pump');

module.exports = function (req, res, torrent, file) {
  var param = req.query.ffmpeg;
  console.log(req);
  function probe() {
    console.log("probe");
    var filePath = path.join(torrent.path, file.path);
    fs.exists(filePath, function (exists) {
      if (!exists) {
        return res.send(404, 'File doesn`t exist.');
      }
      return ffmpeg.ffprobe(filePath, function (err, metadata) {
        if (err) {
          console.error(err);
          return res.send(500, err.toString());
        }
        res.send(metadata);
      });
    });
  }

  function remux() {
    console.log("remux");
    res.type('video/mp4');
    var command = ffmpeg(file.createReadStream())
      .videoCodec('copy').audioCodec('aac').format('mp4')
      .outputOptions('-movflags frag_keyframe+empty_moov')
      .on('start', function (cmd) {
        console.log(cmd);
      })
      .on('error', function (err) {
        console.error(err);
      });
    pump(command, res);
  }

  var soustitre = "srt/5-11.srt";
  console.log("param : "+param );
  switch (param) {

    case 'probe':
      return probe();
    case 'remux':
      return remux();
    default:
      res.send(501, 'Not supported.');
  }
};
