function displayTransmitters(size) {
  var transmittersJSON = 'http://localhost:3000/transmitters';
  showSpinner();
  queue().defer(d3.json, transmittersJSON).await(transmittersReady);

  function transmittersReady(error, data) {
    var markerStyle = {
      radius: 5,
      fillColor: 'blue',
      color: '#fff',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.5
    };

    if(size == 'small') {
      markerStyle.radius = 3;
      markerStyle.fillColor = 'brown';
    }

    var dataLayer = L.geoJson(data, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, markerStyle);
      },
      onEachFeature: listenForEvents
    });

    displayData(dataLayer);

    function listenForEvents(feature, layer) {
      layer.on('click', function (e) {
        if(size != 'small') {
          displayVisitsForTransmitter(map, feature.properties.transmitter_id);
        }
      });
    }
  }
}

function displayVisitsForTransmitter(map, transmitter_id) {
  $('#reset').removeClass('hidden');
  
  var visitsJSON = 'http://localhost:3000/visits/' + transmitter_id;

  showSpinner();
  var timeStart = $.now();
  queue().defer(d3.json, visitsJSON).await(visitsReady);

  function visitsReady(error, data) {
    var timeEnd = ($.now() - timeStart)/1000;
    $('#timestamp').html('Query returned in ' + timeEnd + ' seconds.');
    $('#transmitter').html('Displaying visits (with coordinates) for Transmitter: ' + transmitter_id);

    var markerStyle = {
      radius: 3,
      fillColor: 'brown',
      color: '#fff',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.5
    };

    var dataLayer = L.geoJson(data, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, markerStyle);
      }
    });

    displayData(dataLayer);
  }
}
