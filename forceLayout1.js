// set the dimensions and margins of the graph
var margin = {top: 40, right: 40, bottom: 40, left:40},
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight  - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select(".wrapper")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

var color = d3.scaleOrdinal()
  .range(["#EFB605", "#E47D06", "#DB0131", "#AF0158", "#7F378D", "#3465A8", "#0AA174", "#7EB852"]);


var radius = d3.scaleSqrt()
    .range([0, 7]);

init()

function init() {

  d3.queue()  
    .defer(d3.json, 'results.json') 
    .defer(d3.json, 'races.json')
    .await(renderForceLayout);  
}

function renderForceLayout(error, graph, races) {
  if (error) throw error;

  var graph = {data:graph}
  var races = {data:races}

  graph.data = graph.data.filter(d => d.season == 2016)

  // Modify identification of each result
  graph.data.forEach((d,i) => {
    d.driverRef = formatDriverNames(d.driverRef)
    d.id = d.id + 10
    d.roundId = d.roundId + 200
    d.value = 150 / d.position
    d.label = d.driverRef
  })

  // Create nodes for each race and title
  mainTitle = {'roundId': 200, 'id': 200, 'raceName': 'FORMULA 1', 'value': '', 'label': 'FORMULA 1'}
  graph.data.push(mainTitle)

  races.data.forEach((d,i) => {
    d.position = 0.8
    d.roundId = 200
    d.id = d.id + 200
    d.value = 150 / d.position
    d.label = d.raceName
    graph.data.push(races.data[i])
  })

  // Create JSON structure of links
  graph.links = []
  graph.data.forEach((d,i) => {
    graph.links[i] = {'source': d.roundId, 'target': d.id}
  })

  graph.data = graph.data.slice(0, -3)
  graph.links = graph.links.slice(0, -3)

  color.domain(function(d){return d.raceName})

  // Create links
  var link = svg.append("g")
      .attr("class", "links")
    .selectAll("path")
    .data(graph.links)
    .enter().append("svg:path")
      .attr("id", function(d) { return d.id }) //Unique id of the path
      .attr("stroke-width", function(d) { return 1 });

  link.style('fill', 'none')
      .style('stroke', 'black')
      .style("stroke-width", '2px');

  // Create nodes
  var node = svg.append("g")
      .attr("class", "nodes")
    .selectAll("g")
    .data(graph.data)
    .enter()
      .append("g")
    .style('transform-origin', '50% 50%')
      .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));
  
  node.append('circle')
      .attr("r", function(d) { return radius(d.value); })
      .attr("fill", function(d) { return color(d.raceName); })

  var simulation = d3.forceSimulation()
      .force("link", 
             d3.forceLink().id(function(d) { return d.id; })
              .distance(function(d) { return radius(d.source.value) + radius(d.target.value); })
            .strength(function(d) {return 0.75; })
            )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("collide", d3.forceCollide().radius(function(d) { return radius(d.value*1.5); }))
      .force("center", d3.forceCenter(width / 2, height / 2));

  simulation
      .nodes(graph.data)
      .on("tick", ticked);

  simulation.force("link")
      .links(graph.links);

  var arcs =  node.append("path")
    .attr("id", function(d) { return "s"+d.id; }) //Unique id of the path
    .attr("d", function(d) { return describeArc(d.vx, d.vy, radius(d.value), -160, 160); }) //SVG path
    .style("fill", "none")

  var arcPaths = node.append("text")
    .append('textPath')
      .attr("fill", function(d) { return color(d.raceName); })
      .attr("xlink:href", function(d) { return "#s"+d.id; }) //place the ID of the path here
      .attr("text-anchor", "middle") //place the text halfway on the arc
      .attr("startOffset", "50%")
      .text(function(d) { return d.label; })

  function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
      var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
      return {
          x: centerX + (radius * Math.cos(angleInRadians)),
          y: centerY + (radius * Math.sin(angleInRadians)) -5
      };
  }

  function describeArc(x, y, radius, startAngle, endAngle) {
    var start = polarToCartesian(x, y, radius, startAngle);
    var end = polarToCartesian(x, y, radius, endAngle);
    var arcLength = endAngle - startAngle;
    if (arcLength < 0) arcLength += 360;
    var longArc = arcLength >= 180 ? 1 : 0;
    var d = [
      "M", start.x, start.y,
      "A", radius, radius, 0, longArc, 1, end.x, end.y
    ].join(" ");

    return d;
  }
  
  function ticked() {

    link.attr("d", function(d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y
            dr = Math.sqrt(dx * dx + dy * dy);
        return "M" + 
            d.source.x + "," + 
            d.source.y + "A" + 
            dr + "," + dr + " 0 0,1 " + 
            d.target.x + "," + 
            d.target.y;
    });

    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

  }

  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

}


function formatDriverNames(e) {
  if(e.includes("_")){
    return e.split("_")[1]
  } else {
    return e
  }
}
