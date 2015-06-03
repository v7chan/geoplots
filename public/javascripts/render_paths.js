function displayPaths(receiverId) {
  var pathJSON = 'http://localhost:3000/paths?receiver=' + receiverId;

  $('#reset').removeClass('hidden');
  showSpinner();
  var timeStart = $.now();
  queue().defer(d3.json, pathJSON).await(pathReady);

  function pathReady(error, data) {
    var paths = data.paths;
    var dwellEvents = data.dwellEvents;
    var distinctPaths = paths.length;

    var getPathColor = d3.scale.cubehelix()
      .domain([0, paths.length - 1])
      .range([d3.hsl(60, .6, 0.7), d3.hsl(-120, .6, 0)]);

    var maxDwellTime = d3.max(dwellEvents, function(d) { return +d.dwellTimeInMillis; });
    if(maxDwellTime > 14400000) { maxDwellTime = 14400000; }

    var getDwellColor = d3.scale.linear()
      .domain([0, maxDwellTime])
      .range(['steelblue', 'brown']);

    clearMap();

    $.each(paths, function(index, path) {
      addPathToMap(index, path, getPathColor);
    });

    $.each(dwellEvents, function(index, dwellEvent) {
      addDwellEventToMap(index, dwellEvent, getDwellColor);
    });

    var duration = convertMillisToReadable(data.timeSpentMillis);
    var start = new Date(data.dateRange.start),
          end = new Date(data.dateRange.end);

    $('#legend-text-start').html(toDateString(start));
    $('#legend-text-duration').html('Interaction Length: ' + duration);
    $('#legend-text-end').html(toDateString(end));

    $('#legend-dwell-text-short').html('0 minutes');
    if(maxDwellTime == 14400000) {
      $('#legend-dwell-text-long').html('4+ hours');
    }
    else {
      $('#legend-dwell-text-long').html(convertMillisToReadable(maxDwellTime));
    }
    
    var timeEnd = ($.now() - timeStart)/1000;
    $('#timestamp').html('Displaying receiver ' + receiverId + ' with ' + distinctPaths + ' paths. Query returned in ' + timeEnd + ' seconds.');
    hideSpinner();
  }
}

function addPathToMap(index, path, getPathColor) {
  var polyline_options = {
    color: getPathColor(index),
    weight: 2.5,
    lineJoin: 'round',
    lineCap: 'round',
    className: 'event-path path-index-' + index
  };

  dataLayer = L.polyline(path, polyline_options);
  displayMultiData(dataLayer);
}

function addDwellEventToMap(index, dwellEvent, getDwellColor) {
  var circleMarkerOptions = {
    fillColor: getDwellColor(dwellEvent.dwellTimeInMillis),
    radius: getZoomRadiusForDwellEvents(),
    color: '#fff',
    weight: 1,
    opacity: 1,
    fillOpacity: 0.6,
    className: 'event-dwell dwell-index-' + index
  };

  var label = 'Dwell Time: ' + convertMillisToReadable(dwellEvent.dwellTimeInMillis);

  dataLayer = L.circleMarker(dwellEvent.coordinates, circleMarkerOptions)
    .bindLabel(label)
    .on('click', function (e) {
      handleSelectedEventDwell(index);
      handleSelectedEventPath(index);
    });
  displayDwellEventsLayer(dataLayer);
}

function handleSelectedEventPath(index) {
  var clickedPathClass = 'path-index-' + index;
  var clickedPathClasses = $('.' + clickedPathClass).attr('class');

  if(clickedPathClasses.includes('path-selected')) {
    resetAllPaths();
  }
  else {
    $('.event-path').attr('opacity', 0.20);
    removeOldSelected();
    $('.' + clickedPathClass).attr('class', 'event-path ' + clickedPathClass + ' path-selected leaflet-clickable');
    $('.' + clickedPathClass).attr('opacity', 1);
  }

  function resetAllPaths() {
    $('.' + clickedPathClass).attr('class', 'event-path ' + clickedPathClass + ' leaflet-clickable');
    $('.event-path').attr('opacity', 1);
  }

  function removeOldSelected() {
    var oldClasses = $('.path-selected').attr('class');

    if(oldClasses) {
      var classes = oldClasses.split(' ');
      var updatedClasses = classes[0] + ' ' + classes[1] + ' leaflet-clickable';
      $('.path-selected').attr('class', updatedClasses);
    }
  }
}

function handleSelectedEventDwell(index) {
  var clickedDwellClass = 'dwell-index-' + index;
  var clickedDwellClasses = $('.' + clickedDwellClass).attr('class');

  if(clickedDwellClasses.includes('dwell-selected')) {
    resetAllDwells();
  }
  else {
    $('.event-dwell').attr('opacity', 0.6);
    removeOldSelected();
    $('.' + clickedDwellClass).attr('class', 'event-dwell ' + clickedDwellClass + ' dwell-selected leaflet-clickable');
    $('.' + clickedDwellClass).attr('opacity', 1);
  }

  function resetAllDwells() {
    $('.' + clickedDwellClass).attr('class', 'event-dwell ' + clickedDwellClass + ' leaflet-clickable');
    $('.event-dwell').attr('opacity', 0.6);
  }

  function removeOldSelected() {
    var oldClasses = $('.dwell-selected').attr('class');

    if(oldClasses) {
      var classes = oldClasses.split(' ');
      var updatedClasses = classes[0] + ' ' + classes[1] + ' leaflet-clickable';
      $('.dwell-selected').attr('class', updatedClasses);
    }
  }
}

function displayPathsLegend() {
  var ramps = [
    {
      name: "Paths Over Time",
      color: d3.scale.cubehelix().range([d3.hsl(60, .6, 0.7), d3.hsl(-120, .6, 0)])
    }
  ];

  var width = 1140,
      height = 20;

  var ramp = d3.select('#legend').selectAll(".ramp")
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

function displayDwellLegend() {
  var ramps = [
    {
      name: "Dwell Times",
      color: d3.scale.linear().range(['steelblue', 'brown'])
    }
  ];

  var width = 1140,
      height = 20;

  var ramp = d3.select('#legend-dwell').selectAll(".ramp")
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

function convertMillisToReadable(millis) {
  var date = new Date(millis);
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

function toDateString(date) {
  var year = date.getUTCFullYear();
  var month = parseInt(date.getUTCMonth()) + 1;
  var mDate = date.getUTCDate();
  var hours = date.getUTCHours();
  var mins = date.getUTCMinutes();
  var seconds = date.getUTCSeconds();

  if(parseInt(month) < 10) {
    month = 0 + month.toString();
  }

  if(parseInt(mDate) < 10) {
    mDate = 0 + mDate.toString();
  }

  if(parseInt(hours) < 10) {
    hours = 0 + hours.toString();
  }

  if(parseInt(mins) < 10) {
    mins = 0 + mins.toString();
  }

  if(parseInt(seconds) < 10) {
    seconds = 0 + seconds.toString();
  }

  var string = year + '-' + month + '-' + mDate + ' '
             + hours + ':' + mins + ':' + seconds
  return string;
}