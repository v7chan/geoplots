var express = require('express');
var router = express.Router();

var pg = require('pg');
var conString = "postgres://geoplots:geoplots@127.0.0.1/geoplots"
var client = new pg.Client(conString);
client.connect();

router.get('/', function(req, res) {
  res.render('index', { title: 'geoPlots' });
});

router.get('/transmitters', function (req, res) {
  var query = client.query("SELECT row_to_json(fc) "
    + "FROM ( SELECT 'FeatureCollection' as type, array_to_json(array_agg(f)) as features "
    + "FROM (SELECT 'Feature' as type "
      + ", ST_AsGeoJSON(lg.coordinates)::json as geometry "
      + ", row_to_json(lp) as properties "
      + "FROM transmitters as lg "
        + "INNER JOIN (SELECT transmitter_id FROM transmitters) as lp "
        + "ON lg.transmitter_id = lp.transmitter_id ) as f ) as fc");

  query.on("row", function (row, result) {
    result.addRow(row);
  });

  query.on("end", function (result) {
    res.send(result.rows[0].row_to_json);
    res.end();
  });
});

router.get('/visits/:transmitter_id', function (req, res) {
  var query = client.query("SELECT row_to_json(fc) "
    + "FROM ( SELECT 'FeatureCollection' as type, array_to_json(array_agg(f)) as features "
    + "FROM (SELECT 'Feature' as type "
      + ", ST_AsGeoJSON(lg.coordinates)::json as geometry "
      + ", row_to_json(lp) as properties "
      + "FROM beacon_analytics as lg "
        + "INNER JOIN (SELECT gid FROM beacon_analytics WHERE transmitter_id = " + req.params.transmitter_id + " AND latitude != 0) as lp "
        + "ON lg.gid = lp.gid ) as f ) as fc");

  query.on("row", function (row, result) {
    result.addRow(row);
  });

  query.on("end", function (result) {
    res.send(result.rows[0].row_to_json);
    res.end();
  });
});

module.exports = router;
