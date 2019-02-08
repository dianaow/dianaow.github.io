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
var pad = 200
var margin = canvasDim.width-pad; // amount of margin around plot area
var yfixed = margin + radius; // y position for all nodes
var xfixed = margin + radius - pad; // x fixed position for all nodes

var graph = []
// Create empty array if haven't already done so
if(!graph.nodes) {
  graph.nodes = []
}
if(!graph.links) {
  graph.links = []
}

// used to assign nodes color by group
var color = d3.scaleOrdinal(d3.schemeCategory10)

// scale to generate radians (just for lower-half of circle)
var radians = d3.scaleLinear()
  //.range([Math.PI / 2, 3 * Math.PI / 2]);
  .range([2 * Math.PI, Math.PI]);

var logScale = d3.scaleLinear()
  .domain([0, 50001])

// path generator for arcs (uses polar coordinates)
var arc = d3.lineRadial()
  .angle(function(d) {
    return radians(d);
  })
  .radius(3)

init()

function init() {

  d3.queue()   
    .defer(d3.csv, './data/od_bus.csv') 
    .defer(d3.csv, './data/busstops.csv') 
    .await(createChart);  

}

function createChart(error, csv1, csv2){

  initializeData(csv1, csv2)
  renderArc()
  //test()

}

function initializeData(csv1, csv2){

  graph.links = csv1.map((d,i) => {
    return {
      source: +d.ORIGIN_PT_CODE,
      target: +d.DESTINATION_PT_CODE,
      total: +d.TOTAL_TRIPS,
      path: d.PATH
    }
  })

  busstops = csv2.map((d,i) => {
    return {
    BusStopCode: +d.BusStopCode,
    RoadName: d.RoadName,
    Description: d.Description
    }
  })

  var arr = []
  graph.nodes = []
  graph.links.filter(function(item){
    var i = graph.nodes.findIndex(x => x.name == item.source);
    if(i <= -1){
      graph.nodes.push({name: item.source, group: item.source.toString().charAt(0)});
      arr.push(item.source)
    }
    return null;
  })

  graph.links = graph.links.filter(d =>(arr.indexOf(d.target) != -1))

  graph.nodes.forEach((d,i) => {
    var tmp = busstops.find(b=>b.BusStopCode==d.name)
    d.label = (tmp ? tmp.RoadName : "") + " - " + (tmp ? tmp.Description : "")
  })

  graph.nodes.sort(function(a, b) {
    return d3.ascending(a.name, b.name);
  })
  //console.log(graph.nodes, graph.links)

}

function renderArc(){

  // must be done AFTER links are fixed
  linearLayout(graph.nodes);

  gradientAlongPath(graph.nodes, graph.links)

  // draw links first, so nodes appear on top
  drawLinks(graph.nodes, graph.links, xfixed);

  // draw nodes last
  drawNodes(graph.nodes);

  // append node labels
  appendLabels(graph.nodes);

  appendAnnotations(graph.nodes);

  appendLegend()
  //test();

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
    d.origin = d.source
    d.destination = d.target
    d.source = nodes.find(x => (x.name === d.source)).y;
    d.target = nodes.find(x => (x.name === d.target)) ? nodes.find(x => (x.name === d.target)).y : d.source;
  });
  //console.log(graph.links)
}

// ------------------ NODES --------------------
// Draws nodes on plot
function drawNodes(nodes) {

  var arcNodes = arcWrapper.append("g")
    .attr("class", "arcNodes")

  arcNodes.selectAll(".node")
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
      addTooltipNode(d3.select(this));
    })
    .on("mouseout", function(d, i) {
      d3.select("#tooltip").remove();
    });

}

function appendLabels(nodes) {

  var arcLabels = arcWrapper.append("g")
    .attr("class", "arcLabels")

  arcLabels.selectAll(".label")
    .data(nodes)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("id", function(d, i) {
      return d.name;
    })
    .attr("x", function(d, i) {
      return d.x + radius;
    })
    .attr("y", function(d, i) {
      return d.y + radius;
    })
    .style("font-size", 8)
    .style("color", "black")
    .text(function(d){
      return d.label;
    })

}

// Generates a tooltip for a SVG circle element based on its ID
function addTooltipNode(circle) {

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

// ------------------ LINKS --------------------
// Draws arcs for each link on plot
function drawLinks(nodes, links, xfixed) {

  var arcLinks = arcWrapper.append("g")
    .attr("class", "arcLinks")

var tooltip = d3.select("section")
    .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

  // add links
  arcLinks.selectAll(".link")
    .data(links)
    .enter()
    .append("path")
    .attr("class", "link")
    .attr("id", d=>d.path)
    .style('stroke-width', d=>logScale(d.total))
    .style("stroke", function(d){
      return "url(#arcGradient-" + d.path + ")"; 
    })
    .style("fill", "transparent")
    .attr("transform", function(d, i) {
      //debugger;
      // arc will always be drawn around (0, 0)
      // shift so (0, 0) will be between source and target
      // var xshift = d.source.x + (d.target.x - d.source.x) / 2;
      // var yshift = yfixed;
      // return "translate(" + xshift + ", " + yshift + ")";

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
    })
    //.on("mouseover", mouseover)
    //.on("mousemove", mousemove)
    //.on("mouseout", mouseout);

  function mouseover(){
    tooltip.transition()
    .duration(200)
    .style("opacity", .9);
  }

  function mousemove(d){
    if (d3.select(this).style("fill") != 'transparent') {
      tooltip .html("Origin: " + nodes.find(t=>t.name==d.origin.toString()).label  + "<br />" + "Destination: " + nodes.find(t=>t.name==d.destination.toString()).label + "")
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 50) + "px");
    }
  }

  function mouseout(){
    tooltip.transition()
      .duration(500)
      .style("opacity", 0);
  }

}

function test() {
  graph.nodes = [{group: "1", label:'-', name: 46101, x: 845.4, y:4}, {group: "3", label:'-', name: 46211, x: 845.4, y:200}]
  links = [{destination: 46211, origin: 46101, path: "46101/46211", source: 4, target:200, total:400000}]
  gradientAlongPath(graph.nodes, links) 
  drawLinks(links) 
}

function gradientAlongPath(nodes, links) {

  var xshift = xfixed;

  var arcLinksG = arcWrapper.append("g")
    .attr("class", "arcLinksG")

  //Create a gradient definition for each path
  var grads = arcLinksG.append("defs").selectAll("linearGradient")
    .data(links)
    .enter().append("linearGradient")
    //Create a unique gradient id per chord: e.g. "chordGradient-0-4"
    .attr("id", function(d) {
        return "arcGradient-" + d.path; 
    })
    //.attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%")

  //Set the starting color (at 0%)
  grads.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", function(d){ 
        return (d.path.split("/")[0] == d.origin.toString()) ? "yellow" : "black"
      });

  grads.append("stop")
      .attr("offset", "5%")
      .attr("stop-color", function(d){ return color(nodes.find(t=>t.name==d.origin.toString()).group) });

  grads.append("stop")
      .attr("offset", "95%")
      .attr("stop-color", function(d){ return color(nodes.find(t=>t.name==d.destination.toString()).group) });

  //Set the ending color (at 100%)
  grads.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", function(d){ 
        return (d.path.split("/")[0] == d.destination.toString()) ? "yellow" : "black"
      });

}

function appendAnnotations(nodes) {

  var name1= "Woodlands Crossing - W'Lands Checkpt"
  var name2 = "Woodlands Rd - Kranji Stn"
  var name3 = "Woodlands Ctr Rd - W'Lands Train Checkpt"
  //Add annotations
  const labels = [
    {
      note: {label: "In Dec 2018, 483302 bus trips were made from Woodlands to Johor Bahru Checkpoint and 300406 trips back", 
             title: "Heaviest travel volume",
             wrap: 150},
      y: nodes.find(d=>d.label==name1).y,
      x: nodes.find(d=>d.label==name1).x +160,
      dy: 100,
      dx: 20,
      type: d3.annotationCalloutElbow,
      connector: {end: "dot", type: "line"}
    },
    {
      note: {label: "Arrivals in Woodlands Checkpoint trickled to Kranji Station. There is also similar amount of traffic back to Woolands Checkpoint.", 
             title: "Trickle-down effect",
             wrap: 150},
      y: nodes.find(d=>d.label==name2).y,
      x: nodes.find(d=>d.label==name2).x +120,
      dy: 0,
      dx: 160,
      type: d3.annotationLabel,
      connector: {end: "dot", type: "line"}
    },
    {
      note: {label: "There is also substantial amount of traffic back-and-forth from Woodlands Train Checkpoint to Woodlands Interchange", 
             title: "Trickle-down effect",
             wrap: 160},
      y: nodes.find(d=>d.label==name3).y,
      x: nodes.find(d=>d.label==name3).x +180,
      dy: 0,
      dx: 20,
      type: d3.annotationCalloutElbow,
      connector: {end: "dot", type: "line"}
    }  
  ]

  var makeAnnotations = d3.annotation().annotations(labels)

  arcWrapper.append("g")
    .attr("class", "annotation-group")
    .style('font-size', 12)
    .call(makeAnnotations);

}

function appendLegend() {

  var legend = arcWrapper.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(0,350)")

  dummy_nodes = [{name:1, group:"1", label:"South-West"}, {name:2, group:"2", label:"West"}, {name:3, group:"3", label:"North-West"},
                 {name:4, group:"4", label:"North"}, {name:5, group:"5", label:"Central"}, {name:6, group:"6", label:"North-East"},
                 {name:7, group:"7", label:"East (Pasir Ris)"}, {name:8, group:"8", label:"East (Bedok)"}, {name:9, group:"9", label:"East (Simei, Changi)"}]

  var yscale = d3.scaleLinear()
    .domain([0, dummy_nodes.length - 1])
    .range([0, 100]);

  dummy_nodes.forEach(function(d, i) {
    // d.x = xscale(i);
    // d.y = yfixed;
    d.x = 10;
    d.y = yscale(i);
  });

  dummy_links = [{target:5, source: 1, path: "1/5", total:10000},
                 {target:6, source: 1, path: "1/6", total:20000},
                 {target:7, source: 1, path: "1/7", total:30000},
                 {target:8, source: 1, path: "1/8", total:40000},
                 {target:9, source: 1, path: "1/9", total:50000}]

  dummy_links.forEach(function(d, i) {
    d.origin = d.source
    d.destination = d.target
    d.source = dummy_nodes.find(x => (x.name === d.source)).y
    d.target = dummy_nodes.find(x => (x.name === d.target)) ? dummy_nodes.find(x => (x.name === d.target)).y : d.source
  });

  legend.selectAll(".legend-node")
    .data(dummy_nodes)
    .enter()
    .append("circle")
    .attr("class", "legend-node")
    .attr("id", d=>d.name)
    .attr("cx", d=>d.x)
    .attr("cy", d=>d.y)
    .attr("r", radius)
    .style("fill", d=>color(d.group))

  legend.selectAll(".legend-text")
    .data(dummy_nodes)
    .enter()
    .append("text")
    .attr("class", "legend-text")
    .attr("id", d=>d.name)
    .attr("x", d=>d.x + (2*radius))
    .attr("y", d=>d.y + radius)
    .style("fill", "black")
    .style("font-size", 9)
    .text(d=>d.group)

  legend.selectAll(".legend-label")
    .data(dummy_nodes)
    .enter()
    .append("text")
    .attr("class", "legend-label")
    .attr("id", d=>d.name)
    .attr("x", d=>d.x + (4*radius))
    .attr("y", d=>d.y + radius)
    .style("fill", "black")
    .style("font-size", 9)
    .text(d=>d.label)

  legend
    .append("text")   
    .attr("x", dummy_nodes[0].x/2)
    .attr("y", dummy_nodes[0].y - 30)
    .style("font-size", 11)
    .style('font-weight', 'bold')
    .text("Bus Stop Codes starting with:")

  legend
    .append("text")
    .attr("x", dummy_nodes[0].x/2)
    .attr("y", dummy_nodes[0].y - 20)
    .style("font-size", 10)
    .text("(Hover over nodes to show code)")

  //drawLinks(dummy_links, 200)
  //gradientAlongPath(dummy_nodes, dummy_links)

  legend.selectAll(".legend-path")
    .data(dummy_links)
    .enter()
    .append("rect")
    .attr("class", "legend-path")
    .attr("x",150)
    .attr("y", d=>d.target)
    .attr("width", 100)
    .attr("height", d=>logScale(d.total))
    .style("fill", 'black')

  legend.selectAll(".legend-path-text")
    .data(dummy_links)
    .enter()
    .append("text")
    .attr("class", "legend-path-text")
    .attr("x", 160)
    .attr("y", d=>d.target)
    .style("fill", "black")
    .style("font-size", 9)
    .text(d=>d.total)

  legend
    .append("text")
    .attr("x", 150)
    .attr("y", dummy_links[0].target-20)
    .style("font-size", 11)
    .style('font-weight', 'bold')
    .text("Number of trips")

  legend
    .append("rect")
    .attr("class", "legend-origin")
    .attr("x", 150)
    .attr("y", dummy_links[0].target-55)
    .attr("width", 20)
    .attr("height", 10)
    .style("fill", "yellow")

  legend
    .append("rect")
    .attr("class", "legend-dest")
    .attr("x", 220)
    .attr("y", dummy_links[0].target-55)
    .attr("width", 20)
    .attr("height", 10)
    .style("fill", "black")

  legend
    .append("text")
    .attr("class", "legend-origin")
    .attr("x", 180)
    .attr("y", dummy_links[0].target-45)
    .style("font-size", 11)
    .text("origin")

  legend
    .append("text")
    .attr("class", "legend-dest")
    .attr("x", 250)
    .attr("y", dummy_links[0].target-45)
    .style("font-size", 11)
    .text("destination")
}
