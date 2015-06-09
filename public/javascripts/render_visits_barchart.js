function displayVisitsChart() {
  $('.chart').empty();
  var margin = {top: 20, right: 0, bottom: 20, left: 55},
     width = 1140 - margin.left - margin.right,
     height = 140 - margin.top - margin.bottom;

  var x = d3.scale.ordinal().rangeRoundBands([0, width], .1);
  var y = d3.scale.linear().range([height, 0]);

  var xAxis = d3.svg.axis()
    .scale(x)
    .orient('bottom');

  var yAxis = d3.svg.axis()
    .scale(y)
    .orient('left');

  var svg = d3.select('.chart')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  d3.json('http://localhost:3000/data/visits_per_day.json', function(error, data) {
    x.domain(data.map(function(d) { return d.date; }));
    y.domain([0, d3.max(data, function(d) { return d.visits; })]);

    svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis);

    svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis)
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text('Daily Visits');

    svg.selectAll('.bar').data(data).enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', function(d) { return x(d.date); })
      .attr('width', x.rangeBand())
      .attr('y', function(d) { return y(d.visits); })
      .attr('height', function(d) { return height - y(d.visits); })
      .on("click", function(d) { 
        d3.select(".selected").classed("selected", false);
        d3.select(this).classed("selected", true);
        displayVisitsOnMap(d.date);
      });
  });
}

function chartDailyVisitsForTransmitter(transmitter_id) {
  $('.chart').empty();
  showChartSpinner();

  var margin = {top: 20, right: 0, bottom: 20, left: 40},
     width = 1140 - margin.left - margin.right,
     height = 140 - margin.top - margin.bottom;

  var x = d3.scale.ordinal().rangeRoundBands([0, width], .1);
  var y = d3.scale.linear().range([height, 0]);

  var xAxis = d3.svg.axis()
    .scale(x)
    .orient('bottom');

  var yAxis = d3.svg.axis()
    .scale(y)
    .orient('left');

  var svg = d3.select('.chart')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var visitsJSON = 'http://localhost:3000/daily_visits?transmitter=' + transmitter_id;
  var timeStart = $.now();

  d3.json(visitsJSON, function(error, data) {
    var timeEnd = ($.now() - timeStart)/1000;
    hideChartSpinner();
    $('#timestamp').html('Transmitter: ' + transmitter_id + '. Query returned in ' + timeEnd + ' seconds.');

    x.domain(data.map(function(d) { return d.date; }));
    y.domain([0, d3.max(data, function(d) { return +d.visits; })]);

    svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis);

    svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis)
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text('Daily Visits');

    svg.selectAll('.bar').data(data).enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', function(d) { return x(d.date); })
      .attr('width', x.rangeBand())
      .attr('y', function(d) { return y(d.visits); })
      .attr('height', function(d) { return height - y(d.visits); })
      .on("click", function(d) { 
        chartHourlyVisits(transmitter_id, d.date);
      });
  });
}

function chartHourlyVisits(transmitter_id, date) {
  $('.chart').empty();
  showChartSpinner();

  var margin = {top: 20, right: 0, bottom: 20, left: 40},
     width = 1140 - margin.left - margin.right,
     height = 140 - margin.top - margin.bottom;

  var x = d3.scale.ordinal().rangeRoundBands([0, width], .1);
  var y = d3.scale.linear().range([height, 0]);

  var xAxis = d3.svg.axis()
    .scale(x)
    .orient('bottom');

  var yAxis = d3.svg.axis()
    .scale(y)
    .orient('left');

  var svg = d3.select('.chart')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var visitsJSON = 'http://localhost:3000/hourly_visits?transmitter=' + transmitter_id + '&date=' + date;
  var timeStart = $.now();

  d3.json(visitsJSON, function(error, data) {
    var timeEnd = ($.now() - timeStart)/1000;
    hideChartSpinner();
    $('#timestamp').html('Transmitter: ' + transmitter_id + '. Query returned in ' + timeEnd + ' seconds.');

    x.domain(data.map(function(d) { return d.hour; }));
    y.domain([0, d3.max(data, function(d) { return +d.visits; })]);

    svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis);

    svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis)
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text('Hourly Visits');

    svg.selectAll('.bar').data(data).enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', function(d) { return x(d.hour); })
      .attr('width', x.rangeBand())
      .attr('y', function(d) { return y(d.visits); })
      .attr('height', function(d) { return height - y(d.visits); });
  });
}