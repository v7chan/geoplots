function displayPaths(receiverId) {
  var pathJSON = 'http://localhost:3000/paths?receiver=' + receiverId;

  $('#reset').removeClass('hidden');
  showSpinner();
  var timeStart = $.now();
  queue().defer(d3.json, pathJSON).await(pathReady);

  function pathReady(error, data) {
    var paths = data.paths;

    var distinctPaths = paths.length;
    var color = d3.scale.cubehelix()
      .domain([0, paths.length - 1])
      .range([d3.hsl(-120, .6, 0), d3.hsl(60, .6, 0.7)])

    clearMap();

    $.each(paths, function(index, path) {
      var polyline_options = {
        color: color(index),
        weight: 2.5,
        lineJoin: 'round',
        lineCap: 'round'
      };

      dataLayer = L.polyline(path, polyline_options);
      displayMultiData(dataLayer);
    });

    var duration = convertMillisToReadable(data.timeSpentMillis);
    var start = new Date(data.dateRange.start),
          end = new Date(data.dateRange.end);

    $('#legend-text-start').html(toDateString(start));
    $('#legend-text-duration').html('Duration: ' + duration);
    $('#legend-text-end').html(toDateString(end));

    var timeEnd = ($.now() - timeStart)/1000;
    $('#timestamp').html('Displaying receiver ' + receiverId + ' with ' + distinctPaths + ' paths. Query returned in ' + timeEnd + ' seconds.');
    hideSpinner();
  }
}

function displayPathsLegend() {
  var ramps = [
    {
      name: "Legendario",
      color: d3.scale.cubehelix().range([d3.hsl(60, .6, 0.7), d3.hsl(-120, .6, 0)])
    },
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

function convertMillisToReadable(millis) {
  console.log(millis);
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