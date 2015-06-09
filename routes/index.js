var express = require('express');
var router = express.Router();
var async = require('async');

var dbconfig = require('/srv/www/geoplots/shared/config/opsworks.js');
var AWS_DATABASE_URL = 'postgres://' 
  + dbconfig.db['username'] 
  + dbconfig.db['password'] 
  + dbconfig.db['host']
  + ':' + dbconfig.db['port']
  + '/' + dbconfig.db['database'];

var pg = require('pg');
var database_uri = AWS_DATABASE_URL || process.env.DATABASE_URL || "postgres://geoplots:geoplots@127.0.0.1/geoplots";
var client = new pg.Client(database_uri);
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
        + "(SELECT visits.transmitter_id, visits.count, visits.dwell, t.coordinates "
          + "FROM (SELECT transmitter_id, COUNT(gid) as count, AVG(dwell_time) as dwell FROM beacon_analytics WHERE start_time >= '" 
            + begin + "' AND start_time < '" + end + "' GROUP BY transmitter_id) as visits "
          + "JOIN transmitters as t "
          + "ON visits.transmitter_id = t.transmitter_id) as lg "
        + "INNER JOIN "
          + "(SELECT visits.transmitter_id, visits.count, visits.dwell "
          + "FROM (SELECT transmitter_id, COUNT(gid) as count, AVG(dwell_time) as dwell FROM beacon_analytics WHERE start_time >= '" 
            + begin + "' AND start_time < '" + end + "' GROUP BY transmitter_id) as visits "
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

router.get('/aggregate_analytics', function (req, res) {
  date = req.query.date;

  var query = client.query("SELECT row_to_json(fc) "
    + "FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features "
    + "FROM (SELECT 'Feature' As type "
      + ", ST_AsGeoJSON(lg.coordinates)::json As geometry "
      + ", row_to_json((SELECT l FROM (SELECT transmitter_id, visits, dwell_time_in_sec) As l "
        + ")) As properties "
      + "FROM aggregate_analytics As lg WHERE analytics_date = '" + date + "'  ) As f )  As fc;")

  query.on("row", function (row, result) {
    result.addRow(row);
  });

  query.on("end", function (result) {
    res.send(result.rows[0].row_to_json);
    res.end();
  });
});

router.get('/daily_visits', function (req, res) {
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

router.get('/hourly_visits', function (req, res) {
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

router.get('/paths', function (req, res) {
  receiver_id = req.query.receiver;

  var query = client.query("SELECT visits.transmitter_id, visits.start_time, visits.end_time, visits.dwell_time, ST_Y(t.coordinates) as lat, ST_X(t.coordinates) as lon "
    + "FROM (SELECT transmitter_id, start_time, end_time, dwell_time FROM beacon_analytics WHERE receiver_id = " + receiver_id + " ORDER BY start_time asc) as visits "
    + "JOIN transmitters as t "
    + "ON visits.transmitter_id = t.transmitter_id;");

  query.on("row", function (row, result) {
    result.addRow(row);
  });

  query.on("end", function (result) {
    var data = result.rows;

    var paths = [];
    var currentPath = [];
    
    var dateRange = {
      start: data[0].start_time,
      end: data[data.length - 1].end_time
    };
    var dwellEvents = [];
    
    currentPath.push([data[0].lat, data[0].lon]);

    async.forEachOfSeries(data, function (value, key, callback) {
      // handle last element; STAHP!
      if((parseInt(key) + 1) == data.length) {
        var transmitter1 = value,
            transmitter2 = value;
      }
      else {
        var transmitter1 = value,
            transmitter2 = data[parseInt(key) + 1];
      }

      var transmitter1Id = transmitter1.transmitter_id,
          transmitter2Id = transmitter2.transmitter_id;

      var transmitterPair;

      if(transmitter1Id < transmitter2Id) {
        transmitterPair = transmitter1Id + '_' + transmitter2Id; 
      }
      else {
        transmitterPair = transmitter2Id + '_' + transmitter1Id; 
      }

      var arrival = new Date(transmitter2.start_time),
           depart = new Date(transmitter1.start_time);
      var travelTime = arrival - depart;
      var travelFactor = 5 * 60 * 1000;

      computeMaxTravelTime(transmitter1Id, transmitter2Id, function(result) {
        if(result.length != 0) {
          finishRow(result[0].time_in_seconds * 1000);
        }
        else {
          finishRow(0);
        }
      });

      function finishRow(maxTravelTime) {
        // last record to process
        if((parseInt(key) + 1) == data.length) {
          paths.push(currentPath);

          var dwellEvent = {
            coordinates: [transmitter1.lat, transmitter1.lon],
            dwellTimeInMillis: transmitter1.dwell_time * 1000
          };
          dwellEvents.push(dwellEvent);

          callback();
        }
        // same transmitter back-to-back, break
        else if(maxTravelTime == 0) {
          callback();
        }
        else if(travelTime > (maxTravelTime + travelFactor)) {
          // add currentPath and start a new path
          paths.push(currentPath);
          currentPath = [];
          currentPath.push([transmitter2.lat, transmitter2.lon]);

          var dwellEvent = {
            coordinates: [transmitter1.lat, transmitter1.lon],
            dwellTimeInMillis: transmitter1.dwell_time * 1000
          };
          dwellEvents.push(dwellEvent);

          callback();
        }
        else {
          // add the next transmitter to current path
          currentPath.push([transmitter2.lat, transmitter2.lon]);
          callback();
        }
      }
    }, finishRequest);
    
    function finishRequest(err) {
      var response = {
        dateRange: dateRange,
        timeSpentMillis: dateRange.end - dateRange.start,
        dwellEvents: dwellEvents,
        paths: paths
      }

      res.send(response);
      res.end();
    }
  });
});

function computeMaxTravelTime(transmitter1, transmitter2, callback) {
  var transmitterPair;

  if(transmitter1 < transmitter2) {
    transmitterPair = transmitter1.toString() + '_' + transmitter2.toString(); 
  }
  else {
    transmitterPair = transmitter2.toString() + '_' + transmitter1.toString(); 
  }

  var query = client.query("SELECT time_in_seconds FROM transmitter_distances WHERE transmitter_pair = '" + transmitterPair + "';");

  query.on("row", function (row, result) {
    result.addRow(row);
  });

  query.on("end", function (result) {
    callback(result.rows);
  });
}

module.exports = router;
