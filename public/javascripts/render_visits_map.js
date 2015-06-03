function displayVisitsOnMap(date) {
  var start = date,
        end = getNextDay(date);

  var visitsPerTransmitterJSON = 'http://localhost:3000/visits_per_transmitter?begin=' + start + '&end=' + end;

  var getRadius = d3.scale.sqrt().domain([0, 5000]).range([0, 30]);

  showSpinner();
  var timeStart = $.now();
  queue().defer(d3.json, visitsPerTransmitterJSON).await(visitsReady);

  function visitsReady(error, data) {
    var timeEnd = ($.now() - timeStart)/1000;
    $('#timestamp').html('Query returned in ' + timeEnd + ' seconds.');
    $('#reset').removeClass('hidden');

    var visitsStyle = {
      fillColor: 'brown',
      color: '#fff',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.5
    };

    var dataLayer = L.geoJson(data, {
      pointToLayer: function (feature, latlng) {
        var label = 'Visits: ' + feature.properties.count;

        visitsStyle.radius = getRadius(feature.properties.count);
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