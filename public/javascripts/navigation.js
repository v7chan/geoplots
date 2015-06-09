var map;
var visualizationsLayer;
var dwellEventsLayer;

$(function() {
  map = buildMap();

  displayVisitsView();
  initializePathsView();
  listenForNavigationEvents(map);
  listenForReset();
});

function buildMap() {
  L.mapbox.accessToken = 'pk.eyJ1IjoidjZjaGFuIiwiYSI6IkZQUHlVWEEifQ.SDoalOmR7C0nC3zzZa6g9w';

  var southWest = L.latLng(30.25417, -97.76845),
      northEast = L.latLng(30.27449, -97.72004),
      bounds = L.latLngBounds(southWest, northEast);
      
  var map = L.mapbox.map('map', 'v6chan.5d830d51', { maxBounds: bounds, minZoom: 15 });
  map.fitBounds(bounds);

  visualizationsLayer = new L.layerGroup();
  dwellEventsLayer = new L.layerGroup();

  visualizationsLayer.addTo(map);
  dwellEventsLayer.addTo(map);

  map.on('zoomend', function() {
    dwellEventsLayer.eachLayer(function(layer) {
      layer.setRadius(getZoomRadiusForDwellEvents());
    });
  });

  return map;
}

function listenForNavigationEvents() {
  $('#display-visits').click(function() {
    $('.active').removeClass('active');
    $(this).addClass('active');

    clearView();
    displayVisitsView();
  });

  $('#display-paths').click(function() {
    $('.active').removeClass('active');
    $(this).addClass('active');

    clearView();
    displayPathsView();
  });

  $('#display-transmitters').click(function() {
    $('.active').removeClass('active');
    $(this).addClass('active');

    clearView();
    displayTransmitters();
  });
}

function initializePathsView() {
  var receiversArray = [];

  $('#receiver-input').keypress(function(event) {
    if(event.which == 13) {
      event.preventDefault();

      if($(this).val()) {
        displayPaths($(this).val());
      }
      else {
        displayPaths(27617314);
      }
    }
  });

  $('#receiver-input-submit').click(function() {
    if($('#receiver-input').val()) {
      displayPaths($('#receiver-input').val());
    }
    else {
      displayPaths(27617314);
    }
  });

  $('#random').click(function() {
    displayPaths(receiversArray[Math.floor(Math.random()*receiversArray.length)]);
  });

  $.getJSON('/data/visitors.json', function(data) {
    $.each(data, function(idx, val) {
      receiversArray.push(val);
    });
  });
}

function displayPathsView() {
  displayPathsLegend();
  displayDwellLegend();
  $('#paths-control').removeClass('hide');
}

function displayVisitsView() {
  $('#chart-group').removeClass('hide');
  displayChartDwellLegend();
  displayVisitsChart();
}

function displayData(dataLayer) {
  clearMap();

  visualizationsLayer.addLayer(dataLayer);
  hideSpinner();
}

function displayMultiData(dataLayer) {
  visualizationsLayer.addLayer(dataLayer);
}

function displayDwellEventsLayer(dataLayer) {
  dwellEventsLayer.addLayer(dataLayer);
}

function getZoomRadiusForDwellEvents() {
  var currentZoom = map.getZoom();
  return (currentZoom - 15)*2 + 5;
}

function listenForReset() {
  $('#reset').click(function() {
    if($('#display-visits').hasClass('active')) {
      clearView();
      displayVisitsView();
    }
    else if($('#display-paths').hasClass('active')) {
      clearView();
      displayPathsView();
    }
    else if ($('#display-transmitters').hasClass('active')) {
      clearView();
      displayTransmitters();
    }

    $(this).addClass('hidden');
  });
}

function clearView() {
  $('#timestamp').html('');
  $('#transmitter').html('');
  $('.chart').empty();
  $('.chart').attr('height', '0');

  $('#paths-control').addClass('hide');
  $('#chart-group').addClass('hide');

  $('#legend-text-start').html('Start');
  $('#legend-text-duration').html('Interaction Length');
  $('#legend-text-end').html('End');
  $('#legend-dwell-text-short').html('Short');
  $('#legend-dwell-text-long').html('Long');
  $('#reset').addClass('hidden');
  clearMap();
}

function clearMap() {
  visualizationsLayer.clearLayers();
  dwellEventsLayer.clearLayers();
}

function showSpinner() {
  $('#load').removeClass('hide');
  $('#timestamp').html('');
  $('#transmitter').html('');
}

function hideSpinner() {
  $('#load').addClass('hide');
}

function showChartSpinner() {
  $('#load-chart').removeClass('hide');
  $('#timestamp').html('');
  $('#transmitter').html('');
}

function hideChartSpinner() {
  $('#load-chart').addClass('hide');
}