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

router.get('/visits_per_transmitter', function (req, res) {
  begin = req.query.begin;
  end = req.query.end;

  var query = client.query("SELECT row_to_json(fc) "
    + "FROM ( SELECT 'FeatureCollection' as type, array_to_json(array_agg(f)) as features "
    + "FROM (SELECT 'Feature' as type "
      + ", ST_AsGeoJSON(lg.coordinates)::json as geometry "
      + ", row_to_json(lp) as properties "
      + "FROM "
        + "(SELECT visits.transmitter_id, visits.count, t.coordinates "
          + "FROM (SELECT transmitter_id, COUNT(gid) as count FROM beacon_analytics WHERE start_time >= '" + begin + "' AND start_time < '" + end + "' GROUP BY transmitter_id) as visits "
          + "JOIN transmitters as t "
          + "ON visits.transmitter_id = t.transmitter_id) as lg "
        + "INNER JOIN "
          + "(SELECT visits.transmitter_id, visits.count "
          + "FROM (SELECT transmitter_id, COUNT(gid) as count FROM beacon_analytics WHERE start_time >= '" + begin + "' AND start_time < '" + end + "' GROUP BY transmitter_id) as visits "
          + "JOIN transmitters as t "
          + "ON visits.transmitter_id = t.transmitter_id) as lp "
        + "ON lg.transmitter_id = lp.transmitter_id ) as f ) as fc");

  query.on("row", function (row, result) {
    result.addRow(row);
  });

  query.on("end", function (result) {
    res.send(result.rows[0].row_to_json);
    res.end();
  });
});

router.get('/transmitters_visit', function (req, res) {
  transmitter_id = req.query.transmitter;

  var query = client.query("SELECT to_char(start_time, 'YYYY-MM-DD') as date, COUNT(gid) as visits FROM beacon_analytics "
    + "WHERE transmitter_id = " + transmitter_id + " GROUP BY to_char(start_time, 'YYYY-MM-DD') ORDER BY to_char(start_time, 'YYYY-MM-DD') asc;");

  query.on("row", function (row, result) {
    result.addRow(row);
  });

  query.on("end", function (result) {
    res.send(result.rows);
    res.end();
  });
});

router.get('/transmitters_visit_hourly', function (req, res) {
  transmitter_id = req.query.transmitter;
  date = req.query.date;

  var query = client.query("SELECT to_char(start_time, 'YYYY-MM-DD') as date, COUNT(gid) as visits FROM beacon_analytics "
    + "WHERE transmitter_id = " + transmitter_id + " GROUP BY to_char(start_time, 'YYYY-MM-DD') ORDER BY to_char(start_time, 'YYYY-MM-DD') asc;");

  var query = client.query("SELECT s.hour::int, coalesce(t.value,0) as visits FROM generate_series(0,23) AS s(hour) "
    + "LEFT OUTER JOIN "
    + "(SELECT COUNT(gid) AS value, EXTRACT(hour from start_time) AS hour "
      + "FROM beacon_analytics WHERE date_trunc('day',start_time) = '" + date + "' AND transmitter_id = " + transmitter_id
    + "GROUP BY hour) AS t "
    + "ON s.hour = t.hour;");

  query.on("row", function (row, result) {
    result.addRow(row);
  });

  query.on("end", function (result) {
    res.send(result.rows);
    res.end();
  });
});


module.exports = router;
