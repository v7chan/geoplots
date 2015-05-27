var map;
var visualizationsLayer;

$(function() {
  map = buildMap();

  initializeVisitsView();
  listenForNavigationEvents(map);
});

function buildMap() {
  L.mapbox.accessToken = 'pk.eyJ1IjoidjZjaGFuIiwiYSI6IkZQUHlVWEEifQ.SDoalOmR7C0nC3zzZa6g9w';

  var southWest = L.latLng(30.25417, -97.76845),
      northEast = L.latLng(30.27449, -97.72004),
      bounds = L.latLngBounds(southWest, northEast);
      
  var map = L.mapbox.map('map', 'v6chan.5d830d51', { maxBounds: bounds, minZoom: 15 });
  map.fitBounds(bounds);

  visualizationsLayer = new L.layerGroup();
  visualizationsLayer.addTo(map);

  return map;
}

function initializeVisitsView() {
  displayVisitsChart();
}

function listenForNavigationEvents() {
  $('#display-visits').click(function() {
    $('.active').removeClass('active');
    $(this).addClass('active');

    clearView();
    initializeVisitsView();
  });

  $('#display-transmitters').click(function() {
    $('.active').removeClass('active');
    $(this).addClass('active');

    clearView();
    displayTransmitters();
  });
}

function listenForReset() {
  $('#reset').click(function() {
    location.reload();
  });
}

function displayData(dataLayer) {
  clearMap();

  visualizationsLayer.addLayer(dataLayer);
  hideSpinner();
}

function clearMap() {
  visualizationsLayer.clearLayers();
}

function clearView() {
  $('#timestamp').html('');
  $('#transmitter').html('');
  $('.chart').empty();
  $('.chart').attr('height', '0');
  clearMap();
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