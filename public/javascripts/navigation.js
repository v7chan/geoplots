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

function listenForNavigationEvents() {
  $('#display-visits').click(function() {
    $('.active').removeClass('active');
    $(this).addClass('active');

    clearView();
    initializeVisitsView();
  });

  $('#display-paths').click(function() {
    $('.active').removeClass('active');
    $(this).addClass('active');

    clearView();
    initializePathsView();
  });

  $('#display-transmitters').click(function() {
    $('.active').removeClass('active');
    $(this).addClass('active');

    clearView();
    displayTransmitters();
  });
}

function initializeVisitsView() {
  displayTransmitters('small');
  displayVisitsChart();
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

    displayPathsLegend();
    $('#paths-control').removeClass('hide');
  });
}

function displayData(dataLayer) {
  clearMap();

  visualizationsLayer.addLayer(dataLayer);
  hideSpinner();
}

function displayMultiData(dataLayer) {
  visualizationsLayer.addLayer(dataLayer);
}

function listenForReset() {
  $('#reset').click(function() {
    location.reload();
  });
}

function clearView() {
  $('#timestamp').html('');
  $('#transmitter').html('');
  $('.chart').empty();
  $('.chart').attr('height', '0');
  $('#paths-control').addClass('hide');
  $('#legend-text-start').html('Start');
  $('#legend-text-duration').html('');
  $('#legend-text-end').html('End');
  clearMap();
}

function clearMap() {
  visualizationsLayer.clearLayers();
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