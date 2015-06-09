function displayVisitsOnMap(date) {
  var visitsPerTransmitterJSON = 'http://localhost:3000/aggregate_analytics?date=' + date;

  var getRadius = d3.scale.sqrt().domain([0, 5000]).range([0, 25]);
  var getDwellColor = d3.scale.linear().domain([0, 3600]).range(['steelblue', 'brown']);

  showSpinner();
  var timeStart = $.now();
  queue().defer(d3.json, visitsPerTransmitterJSON).await(visitsReady);

  function visitsReady(error, data) {
    var timeEnd = ($.now() - timeStart)/1000;
    $('#timestamp').html('Query returned in ' + timeEnd + ' seconds.');
    $('#reset').removeClass('hidden');

    var visitsStyle = {
      color: '#fff',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.5
    };

    var dataLayer = L.geoJson(data, {
      pointToLayer: function (feature, latlng) {
        var label = 'Visits: ' + feature.properties.visits + '<br>'
                  + 'Average Dwell: ' + convertSecondsToReadable(feature.properties.dwell_time_in_sec);

        visitsStyle.radius = getRadius(feature.properties.visits);
        visitsStyle.fillColor = getDwellColor(feature.properties.dwell_time_in_sec);
        visitsStyle.className = 'visits-circle transmitter-' + feature.properties.transmitter_id;
        return L.circleMarker(latlng, visitsStyle).bindLabel(label);
      },
      onEachFeature: listenForEvents
    });

    displayData(dataLayer);

    function listenForEvents(feature, layer) {
      layer.on('click', function (e) {
        handleSelectedTransmitter(feature.properties.transmitter_id, layer.options.className);
      });
    }
  }
}

function handleSelectedTransmitter(transmitter_id, classes) {
  var transmitterClass = '.transmitter-' + transmitter_id;
  var newClasses = classes + ' circle-selected';

  if($(transmitterClass).attr('class').includes('circle-selected')) {
    location.reload();
  }
  else {
    $('.visits-circle').attr('fill-opacity', 0.15);

    var oldSelectedClass = $('.circle-selected').attr('class');

    if(oldSelectedClass) {
      var classes = oldSelectedClass.split(' ');
      var updClasses = classes[0] + ' ' + classes[1];

      $('.circle-selected').attr('class', updClasses);
    }

    $(transmitterClass).attr('fill-opacity', 0.75).attr('class', newClasses);

    chartDailyVisitsForTransmitter(transmitter_id);
  }
}

function displayChartDwellLegend() {
  var ramps = [
    {
      name: "Dwell Times",
      color: d3.scale.linear().range(['steelblue', 'brown'])
    }
  ];

  var width = 1140,
      height = 20;

  var ramp = d3.select('#chart-legend-dwell').selectAll(".ramp")
    .data(ramps).enter().append("div")
    .attr("class", "ramp")
    .style("width", width + "px")
    .style("height", height + "px")
    .style("top", height + "px");

  var canvas = ramp.append("canvas")
    .attr("width", width)
    .attr("height", 1)
    .style("width", width + "px")
    .style("height", height + "px")
    .each(function(d) {
      var context = this.getContext("2d"),
          image = context.createImageData(width, 1);
      for (var i = 0, j = -1, c; i < width; ++i) {
        c = d3.rgb(d.color(i / (width - 1)));
        image.data[++j] = c.r;
        image.data[++j] = c.g;
        image.data[++j] = c.b;
        image.data[++j] = 255;
      }
      context.putImageData(image, 0, 0);
    });
}

function getNextDay(date) {
  var temp = new Date(date + 'T00:00:00Z');
  temp.setDate(temp.getDate() + 1);

  var dateString = padStr(temp.getUTCFullYear()) + '-' +
                   padStr(1 + temp.getUTCMonth()) + '-' +
                   padStr(temp.getUTCDate());
  return dateString;
}

function padStr(i) {
  return (i < 10) ? "0" + i : "" + i;
}

function convertSecondsToReadable(seconds) {
  var date = new Date(seconds * 1000);
  var str = '';

  if(date.getUTCDate()-1 > 0) {
    str += date.getUTCDate()-1 + " days, ";
  }
  if(date.getUTCHours() > 0) {
    str += date.getUTCHours() + " hours, ";
  }
  if(date.getUTCMinutes() > 0) {
    str += date.getUTCMinutes() + " minutes, ";
  }
  
  str += date.getUTCSeconds() + " seconds";
  return str;
}