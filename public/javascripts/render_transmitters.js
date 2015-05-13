$(function() {
  L.mapbox.accessToken = 'pk.eyJ1IjoidjZjaGFuIiwiYSI6IkZQUHlVWEEifQ.SDoalOmR7C0nC3zzZa6g9w';

  var southWest = L.latLng(30.25417, -97.76845),
      northEast = L.latLng(30.27449, -97.72004),
      bounds = L.latLngBounds(southWest, northEast);
      
  var map = L.mapbox.map('map', 'v6chan.5d830d51', { maxBounds: bounds, minZoom: 15 });
  map.fitBounds(bounds);

  var transmittersJSON = 'http://localhost:3000/transmitters';
  queue().defer(d3.json, transmittersJSON).await(ready);

  function ready(error, data) {
    var geojsonMarkerOptions = {
      radius: 6,
      fillColor: 'blue',
      color: '#fff',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.5
    };

    var dataLayer = L.geoJson(data, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, geojsonMarkerOptions);
      },
      onEachFeature: listenForEvents
    });

    dataLayer.addTo(map);

    function listenForEvents(feature, layer) {
      layer.on('click', function (e) {
        map.removeLayer(dataLayer);
        displayVisitsForTransmitter(feature.properties.transmitter_id);
      });
    }
  }

  function displayVisitsForTransmitter(transmitter_id) {
    $('#debug').append('<p id="transmitter">Displaying visits (with coordinates) for Transmitter: ' + transmitter_id + '</p>');
    $('#reset').removeClass('hidden');
    
    var visitsJSON = 'http://localhost:3000/visits/' + transmitter_id;

    var timeStart = $.now();
    queue().defer(d3.json, visitsJSON).await(ready);

    function ready(error, data) {
      var timeEnd = ($.now() - timeStart)/1000;
      $('#debug').append('<small id="timestamp">Query returned in ' + timeEnd + ' seconds.</small>');

      var geojsonMarkerOptions = {
        radius: 4,
        fillColor: 'brown',
        color: '#fff',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.5
      };

      var dataLayer = L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
          return L.circleMarker(latlng, geojsonMarkerOptions);
        }
      });

      dataLayer.addTo(map);
    }
  }

  listenForReset();
});

function listenForReset() {
  $('#reset').click(function() {
    console.log('clicked!');
    location.reload();
  });
}