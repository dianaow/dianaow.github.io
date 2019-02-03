var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
var height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) * 11
var canvasDim = { width: width*0.9, height: height};

var arc_container = d3.select('.arc-chart')

// create svg and group
var arc_svg = arc_container.append("svg")
      .attr("width", canvasDim.width)
      .attr("height", canvasDim.height)
      .attr("transform", "translate(0,0)")

var arcWrapper = arc_svg.append("g")
  .attr("class", "arcWrapper")

var radius = 4; // fixed node radius
var margin = canvasDim.width-50; // amount of margin around plot area
var yfixed = margin + radius; // y position for all nodes
var xfixed = margin + radius; // x fixed position for all nodes
var graph = []
// Create empty array if haven't already done so
if(!graph.nodes) {
  graph.nodes = []
}
if(!graph.links) {
  graph.links = []
}

init()

function init() {

  d3.queue()   
    .defer(d3.csv, './data/od_bus.csv')  
    .await(createChart);  

}

function createChart(error, csv1){

  initializeData(csv1)
  renderArc()

}

function initializeData(csv1){

  graph.links = csv1.map((d,i) => {
    return {
      source: +d.ORIGIN_PT_CODE,
      target: +d.DESTINATION_PT_CODE,
      total: +d.TOTAL_TRIPS,
      path: d.PATH
    }
  })

  graph.nodes = []
  graph.links.filter(function(item){
    var i = graph.nodes.findIndex(x => x.name == item.source);
    if(i <= -1){
          graph.nodes.push({name: item.source, group: item.source.toString().charAt(0)});
    }
    return null;
  })

  graph.nodes.sort(function(a, b) {
    return d3.ascending(a.name, b.name);
  })
  //console.log(graph.nodes)

}

function renderArc(){

  // must be done AFTER links are fixed
  linearLayout(graph.nodes);

  // draw links first, so nodes appear on top
  drawLinks(graph.links);

  // draw nodes last
  drawNodes(graph.nodes);

}

// Layout nodes linearly, sorted by group
function linearLayout(nodes) {
  // sort nodes by group
  nodes.sort(function(a, b) {
    return a.group - b.group;
  })

  // used to scale node index to x position
  var xscale = d3.scaleLinear()
    .domain([0, nodes.length - 1])
    .range([radius, width - margin - radius]);

  var yscale = d3.scaleLinear()
    .domain([0, nodes.length - 1])
    .range([radius, height - radius]);

  // calculate pixel location for each node
  nodes.forEach(function(d, i) {
    // d.x = xscale(i);
    // d.y = yfixed;
    d.x = xfixed;
    d.y = yscale(i);
  });


  graph.links.forEach(function(d, i) {
    d.source = nodes.find(x => (x.name === d.source)).y;
    d.target = nodes.find(x => (x.name === d.target)) ? nodes.find(x => (x.name === d.target)).y : d.source;
  });
  console.log(graph.links)
}

// Draws nodes on plot
function drawNodes(nodes) {
  // used to assign nodes color by group
  var color = d3.scaleOrdinal(d3.schemeCategory10)

  arcWrapper.selectAll(".node")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("class", "node")
    .attr("id", function(d, i) {
      return d.name;
    })
    .attr("cx", function(d, i) {
      return d.x;
    })
    .attr("cy", function(d, i) {
      return d.y;
    })
    .attr("r", function(d, i) {
      return radius;
    })
    .style("fill", function(d, i) {
      return color(d.group);
    })
    .on("mouseover", function(d, i) {
      addTooltip(d3.select(this));
    })
    .on("mouseout", function(d, i) {
      d3.select("#tooltip").remove();
    });
}

// Draws nice arcs for each link on plot
function drawLinks(links) {
  // scale to generate radians (just for lower-half of circle)
  var radians = d3.scaleLinear()
    //.range([Math.PI / 2, 3 * Math.PI / 2]);
    .range([2 * Math.PI, Math.PI]);

  var logScale = d3.scaleLog()
    .domain([5000, 50000])

  // path generator for arcs (uses polar coordinates)
  var arc = d3.lineRadial()
    .angle(function(d) {
      return radians(d);
    })
    .radius(3)

  // add links
  arcWrapper.selectAll(".link")
    .data(links)
    .enter()
    .append("path")
    .attr("class", "link")
    .style('stroke', 'black')
    .style('stroke-width', d=>logScale(d.total))
    .style('fill', 'transparent')
    .attr("transform", function(d, i) {
      //debugger;
      // arc will always be drawn around (0, 0)
      // shift so (0, 0) will be between source and target
      // var xshift = d.source.x + (d.target.x - d.source.x) / 2;
      // var yshift = yfixed;
      // return "translate(" + xshift + ", " + yshift + ")";

      //guess

      var xshift = xfixed;
      var yshift = d.source + (d.target - d.source) / 2;

      return "translate(" + xshift + ", " + yshift + ")";
    })
    .attr("d", function(d, i) {

      //debugger;
      // get x distance between source and target
      //var xdist = Math.abs(d.source.x - d.target.x);
      var ydist = Math.abs(d.source - d.target);

      // set arc radius based on x distance
      // arc.radius(xdist / 2);
      arc.radius(ydist / 2);

      // want to generate 1/3 as many points per pixel in x direction
      // var points = d3.range(0, Math.ceil(xdist / 3));
      var points = d3.range(0, Math.ceil(ydist / 3));

      // set radian scale domain
      radians.domain([0, points.length - 1]);

      // return path for arc
      return arc(points);
    });

}

// Generates a tooltip for a SVG circle element based on its ID
function addTooltip(circle) {
  var x = parseFloat(circle.attr("cx"));
  var y = parseFloat(circle.attr("cy"));
  var r = parseFloat(circle.attr("r"));
  var text = circle.attr("id");

  var tooltip = arcWrapper
    .append("text")
    .text(text)
    .attr("x", x)
    .attr("y", y)
    .attr("dy", -r * 2)
    .attr("id", "tooltip");

  var offset = tooltip.node().getBBox().width / 2;

  if ((x - offset) < 0) {
    tooltip.attr("text-anchor", "start");
    tooltip.attr("dx", -r);
  } else if ((x + offset) > (width - margin)) {
    tooltip.attr("text-anchor", "end");
    tooltip.attr("dx", r);
  } else {
    tooltip.attr("text-anchor", "middle");
    tooltip.attr("dx", 0);
  }
}
