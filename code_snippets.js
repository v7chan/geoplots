var maxVisits = d3.max(data.features, function(d) { return +d.properties.count; });
getRadius.domain([0, maxVisits]);

