var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
var height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) * 4.5
var canvasDim = { width: width, height: height};
var xfixed
var yfixed
var geoJSON_sg 
var arc_container = d3.select('.arc-chart')

var arc_svg = arc_container.append("svg")
      .attr("width", canvasDim.width)
      .attr("height", canvasDim.height)
      .attr("transform", "translate(0,0)")

var arcWrapper = arc_svg.append("g")
  .attr("class", "arcWrapper")

var radius = 1; // fixed node radius
var pad = 20 // amount of margin around plot area
var small_width = canvasDim.width/18
var small_height = canvasDim.height/8

var graph = []
if(!graph.links) {
  graph.links = []
}

// used to assign nodes color by group
var list = ["8", "7", "6", "5", "3", "2", "1"]
var list1 = ["1", "2", "3", "5", "6", "7", "8"]
var color = d3.scaleOrdinal()
  .domain(list)
  .range(["#EFB605", "#FF5733", "#C70039", "#AF0158", "#7F378D", "#3465A8", "#0AA174", "#7EB852"]);

var dummy_nodes = [{name:1, group:"1", label:"South-West"}, {name:2, group:"2", label:"West"}, 
                   {name:3, group:"3", label:"North"}, {name:4, group:"5", label:"Central"}, {name:5, group:"6", label:"North-East"},
                   {name:6, group:"7", label:"East (Pasir Ris)"}, {name:7, group:"8", label:"East (Bedok, Changi)"}]

// scale to generate radians (just for left-half of circle)
var radians_Left = d3.scaleLinear()
  .range([2 * Math.PI, Math.PI]);

var radians_Right = d3.scaleLinear()
  .range([-2 * Math.PI, -Math.PI]);

var logScale = d3.scaleLinear()
  .range([0.08, 1.8])
  .domain([0, 50001])

// path generator for arcs (uses polar coordinates)
var arc_Left = d3.lineRadial()
  .angle(function(d) {
    return radians_Left(d);
  })

var arc_Right = d3.lineRadial()
  .angle(function(d) {
    return radians_Right(d);
  })

var lineGenerator = d3.line()
    .x(function(d) {
      return d.x;
    })
    .y(function(d) {
      return d.y;
    })

init()

function init() {

  d3.queue()   
    .defer(d3.csv, './data/od_1.csv') 
    .defer(d3.csv, './data/busstops.csv')
    .defer(d3.json, './data/singapore.json') 
    .await(createChart);  

}

function createChart(error, csv, csv2, geoJSON){

  initializeData(csv, csv2)

  var container = d3.select('#graph').html('')
  renderMap(geoJSON, container, 400, 300, graph.links, "showStops", [0,0], 1, 1.25)
  
  makeSmallMultiples(geoJSON)

  appendLegend()

}

function initializeData(csv, csv2){

  graph.links = csv.map((d,i) => {
    return {
      source: +d.ORIGIN_PT_CODE,
      target: +d.DESTINATION_PT_CODE,
      total: +d.TOTAL_TRIPS,
      path: d.PATH,
      origin: +d.ORIGIN_PT_CODE,
      destination: +d.DESTINATION_PT_CODE,
      sourceGroup: d.ORIGIN_PT_CODE[0]== "4" ? "3" : ( d.ORIGIN_PT_CODE[0]== "9" ? "8" : d.ORIGIN_PT_CODE[0] ),
      targetGroup: d.DESTINATION_PT_CODE[0]== "4" ? "3" : ( d.DESTINATION_PT_CODE[0]== "9" ? "8" : d.DESTINATION_PT_CODE[0] )
    }
  })

  busstops = csv2.map((d,i) => {
    return {
    BusStopCode: +d.BusStopCode,
    lat: +d.Latitude,
    lon: +d.Longitude,
    }
  })

}

function makeSmallMultiples(geoJSON){

  Array.prototype.pairs = function (func) {
    for (var i = 0; i < this.length; i++) {
      for (var j = this.length-1; j >=0; j--) {
          func([this[i], this[j]]);
      }
    }
  }

  list.pairs(function(pair,i){
    //console.log(pair)
    var nodes = []
    if(pair[0] < pair[1]) {

      var links1 = graph.links.filter(d=> ([pair[0]].indexOf(d.sourceGroup)>=0) & ([pair[1]].indexOf(d.targetGroup)>=0) )
      var links2 = graph.links.filter(d=> ([pair[1]].indexOf(d.sourceGroup)>=0) & ([pair[0]].indexOf(d.targetGroup)>=0) )
      var linksSame = graph.links.filter(d=> (([pair[0]].indexOf(d.sourceGroup)>=0) & ([pair[0]].indexOf(d.targetGroup)>=0)) | (([pair[1]].indexOf(d.sourceGroup)>=0) & ([pair[1]].indexOf(d.targetGroup)>=0)) )
      var links = links1.concat(links2)

      linksSame.concat(links).forEach(item => {
        nodes.push({name: item.source, group: item.sourceGroup})
        nodes.push({name: item.target, group: item.targetGroup})
      }) 
    } else if (pair[0]===pair[1]) {

      var links = graph.links.filter(d=> ([pair[0]].indexOf(d.sourceGroup)>=0) & ([pair[1]].indexOf(d.targetGroup)>=0) )

      links.forEach(item => {
        nodes.push({name: item.source, group: item.sourceGroup})
        nodes.push({name: item.target, group: item.targetGroup})
      }) 
    } 

    if(nodes.length!=0){
      var nodesNew = nodes.filter((thing, index, self) =>
        index === self.findIndex((t) => (
          t.name === thing.name
        ))
      )

      nodesNew.sort(function(a, b) {
        return d3.ascending(a.name, b.name);
      })

      var id = [list1.indexOf(pair[0])+1, list.indexOf(pair[1])+1] // substitued codes
      renderArc(nodesNew, links, pair, id)

      var arcMap = arcWrapper.append("g")
        .attr("transform", "translate(" + ((small_width*id[1]) + small_width*id[1]-small_width/2-32).toString() + "," + (small_height*id[0]-100).toString() + ")")

      var geoJSON_sg = Object.assign({}, geoJSON)
      //var map_thumbnail = d3.select("map" + pair[0] + "-" + pair[1]).html('')
      renderMap(geoJSON_sg, arcMap, 120, 80, links, "showStops", pair, 0.2, 2.5)

    }

  })
}

function renderArc(nodes, links, pair, id){

  // must be done AFTER links are fixed
  linearLayout(nodes, links, pair, id);

  // draw links first, so nodes appear on top
  drawLinks(links, pair, id);
  gradientAlongPath(nodes, links)

  // draw nodes last
  drawNodes(nodes, pair, id);

  //appendAnnotations(graph.nodes);

}

// Layout nodes linearly, sorted by group
function linearLayout(nodes, links, pair, id) {
  // sort nodes by group  
  nodes.sort( ( a, b ) => {
      var arr = [pair[0], pair[1]]

      const aColorIndex = arr.indexOf( a.group );
      const bColorIndex = arr.indexOf( b.group );

      return aColorIndex - bColorIndex;
  } );

  xfixed = small_width*id[1] + radius - pad; // x fixed position for all nodes
  //console.log(nodes.length)
  // used to scale node index to y position
  var yscale = d3.scaleLinear()
    .domain([0, pair[0]===pair[1] ? nodes.length : 1200])
    .range([radius, pair[0]===pair[1] ? nodes.length*1.5 : small_height-radius]);

  // calculate pixel location for each node
  nodes.forEach(function(d, i) {
    d.x = xfixed;
    d.y = yscale(i);
  });
  //console.log(nodes.length)
  links.forEach(function(d, i) {
    d.source = nodes.find(x => (x.name === d.origin)).y 
    d.target = nodes.find(x => (x.name === d.destination)).y
  });

}

// ------------------ NODES --------------------
// Draws nodes on plot
function drawNodes(nodes, pair, id) {

  var arcNodes = arcWrapper.append("g")
    .attr("class", "arcNodes" + pair[0] + "-" + pair[1])
    .attr("transform", "translate(" + (small_width*id[1]).toString() + "," + (small_height*id[0]).toString() + ")")

  var arcText = arcWrapper.append("g")
     .attr("transform", "translate(" + (small_width*id[1]-32).toString() + "," + (small_height*id[0]-32).toString() + ")")
    
  arcText.append("text")
    .text(dummy_nodes.find(d=>d.group==pair[0]).label)
    .attr("x", small_width*id[1]+32)
    .attr("y", 0)
    .style("fill", "white")
    .style("font-size", 10)

  arcText.append("text")   
    .text("-----")
    .attr("x", small_width*id[1]+32)
    .attr("y", 8)  
    .style("fill", "white")
    .style("font-size", 10)

  arcText.append("text")    
    .text(dummy_nodes.find(d=>d.group==pair[1]).label)
    .attr("x", small_width*id[1]+32)
    .attr("y", 16)    
    .style("fill", "white")
    .style("font-size", 10)

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
      return color(d.group.toString());
    })

}

// ------------------ LINKS --------------------
// Draws arcs for each link on plot
function drawLinks(links, pair, id) {

  var arcLinks = arcWrapper.append("g")
    .attr("class", "arcLinks" + pair[0] + "-" + pair[1])
    .attr("transform", "translate(" + (small_width*id[1]).toString() + "," + (small_height*id[0]).toString() + ")")

  arcLinks.selectAll(".link")
    .data(links)
    .enter()
    .append("path")
    .attr("class", "link")
    .style('stroke-width', d=>logScale(d.total))
    .style("stroke", function(d,i){
      return "url(#arcGradient-" + d.path + i.toString() + ")"; 
      //return "url(#arcGradient-" + d.origin.toString() +  "/" + d.destination.toString() + ")"; 
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
      var ydist = Math.abs(d.source - d.target);

      // set arc radius based on x distance
      var bool = d.path.split("/")[0] == d.origin.toString()

      bool ? arc_Left.radius(ydist / 2) : arc_Right.radius(ydist / 2)
      
      // want to generate 1/3 as many points per pixel in x direction
      var points = d3.range(0, Math.ceil(ydist / 3));

      // set radian scale domain
      bool ? radians_Left.domain([0, points.length - 1]) : radians_Right.domain([0, points.length - 1])
      
      // return path for arc
      return bool ? arc_Left(points) : arc_Right(points) 
    })

}

function gradientAlongPath(nodes, links) {

  var xshift = xfixed;

  var arcLinksG = arcWrapper.append("g")
    .attr("class", "arcLinksG")

  //Create a gradient definition for each path
  var grads = arcLinksG.append("defs").selectAll("linearGradient")
    .data(links)
    .enter().append("linearGradient")
    .attr("id", function(d,i) {
      return "arcGradient-" + d.path + i.toString(); // must be unique
      //return "arcGradient-" + d.origin.toString() +  "/" + d.destination.toString() + ")"; // must be unique
    })
    //.attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%")

  grads.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", function(d){ 
        var bool = d.path.split("/")[0] == d.origin.toString()
        return bool ? color(d.sourceGroup.toString()) : color(d.targetGroup.toString())
      });

  grads.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", function(d){ 
        var bool = d.path.split("/")[0] == d.origin.toString()
        return bool ? color(d.targetGroup.toString()) : color(d.sourceGroup.toString())
      });

}

function appendLegend() {

  var legend = arcWrapper.append("g")
    .attr("class", "legend")
    //.attr("transform", "translate(900,50)")
    .attr("transform", "translate(" + (canvasDim.width*(2/3)).toString() + ",50)")

  var R = radius*6

  var yscale = d3.scaleLinear()
    .domain([0, dummy_nodes.length - 1])
    .range([0, 120]);

  dummy_nodes.forEach(function(d, i) {
    d.x = 10;
    d.y = yscale(i);
  });

  dummy_links = [{target:3, source: 1, path: "1/3", total:10000},
                 {target:4, source: 1, path: "1/4", total:20000},
                 {target:5, source: 1, path: "1/5", total:30000},
                 {target:6, source: 1, path: "1/6", total:40000},
                 {target:7, source: 1, path: "1/7", total:50000}]

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
    .attr("r", R)
    .style("fill", d=>color(d.group))

  legend.selectAll(".legend-text")
    .data(dummy_nodes)
    .enter()
    .append("text")
    .attr("class", "legend-text")
    .attr("id", d=>d.name)
    .attr("x", d=>d.x + (2*R))
    .attr("y", d=>d.y + R/2)
    .style("fill", "white")
    .style("font-size", 9)
    .text(d=>d.group)

  legend.selectAll(".legend-label")
    .data(dummy_nodes)
    .enter()
    .append("text")
    .attr("class", "legend-label")
    .attr("id", d=>d.name)
    .attr("x", d=>d.x + (4*R))
    .attr("y", d=>d.y + R/2)
    .style("fill", "white")
    .style("font-size", 10)
    .text(d=>d.label)

  legend
    .append("text")   
    .attr("x", dummy_nodes[0].x/2)
    .attr("y", dummy_nodes[0].y - 20)
    .style("font-size", 12)
    .style('font-weight', 'bold')
    .text("Bus Stop Codes starting with:")


  legend.selectAll(".legend-path")
    .data(dummy_links)
    .enter()
    .append("rect")
    .attr("class", "legend-path")
    .attr("x",150)
    .attr("y", d=>d.target)
    .attr("width", 100)
    .attr("height", d=>logScale(d.total))
    .style("fill", 'white')

  legend.selectAll(".legend-path-text")
    .data(dummy_links)
    .enter()
    .append("text")
    .attr("class", "legend-path-text")
    .attr("x", 160)
    .attr("y", d=>d.target)
    .style("fill", "white")
    .style("font-size", 10)
    .text(d=>d.total)

  legend
    .append("text")
    .attr("x", 150)
    .attr("y", dummy_links[0].target-20)
    .style("font-size", 11)
    .style('font-weight', 'bold')
    .text("Number of trips")

}

function renderMap(geoJSON, container, mapWidth, mapHeight, DATA, type, pair, strokeWidth, markerSize) {

  var svg = container.append("svg")
    .attr("width", mapWidth)
    .attr("height", mapHeight)

  var mapWrapper = svg.append("g")
    .attr("class", "mapWrapper")

  // add foreign object to svg
  // https://gist.github.com/mbostock/1424037
  var foreignObject = mapWrapper.append("foreignObject")
      .attr("width", mapWidth)
      .attr("height", mapHeight);

  // add embedded body to foreign object
  var foBody = foreignObject.append("xhtml:body")
      .style("margin", "0px")
      .style("padding", "0px")
      .style("background-color", "transparent")
      .style("width", mapWidth)
      .style("height", mapHeight)

  // add embedded canvas to embedded body
  var canvas = foBody.append("canvas")
      .attr('class', 'map'+ pair[0] + "-" + pair[1])
      .attr("width", mapWidth)
      .attr("height", mapHeight)

  // getContext() method returns an object that provides methods and properties for drawing on the canvas
  ctx = d3.select('.map'+ pair[0] + "-" + pair[1]).node().getContext('2d')

  // DATA PROCESSING BEFORE PLOTTING
  // append bus route points to geoJSON already containing multi-polygon describing singapore map
  // this is important so that projection will include these points and ensure alignment in render 

  var nodesSource = DATA.map(d=>d.origin)
  var nodesTarget = DATA.map(d=>d.destination)
  var nodesAll = [...new Set(nodesSource.concat(nodesTarget))]

  var data = nodesAll.map((d,i) => {
    return Object.assign({}, d, busstops.find(b=>b.BusStopCode===d)||{});
  })

  data.forEach(function(d) {
    geoJSON.features.push({
      type: "Point",
      properties: {
        geometry: {
          type: "Point",
          coordinates: [d.lon, d.lat]
        }
      }
    });
  });

  var projection = d3.geoMercator().fitSize([mapWidth, mapHeight], geoJSON);

  var path = d3.geoPath().projection(projection);
  var polygons = geoJSON.features.filter(d=>d.type=='Feature')

  // project gps coordinates of each point in route to screen coordinates (there will be duplicate bus stops coords)
  data.forEach(function(d) {
    var pt = projection([d.lon, d.lat]);
    d.x = pt[0];
    d.y = pt[1];
  });

  // DRAW MAP OF SINGAPORE    
  mapWrapper.selectAll(".country")
      .data(polygons)
      .enter()
      .append("path")
      .attr("class", "country")
      .attr("d", path)
      .style("stroke-width", strokeWidth)
      .style("stroke", "white")
      .style("fill", "transparent")

  if (type=='showStops'){
    // DRAW BUS STOP MARKERS
    // each rectange represents a bus stop  
    data.forEach(function(d){
      if(d.x && d.y){
        var grp = d.BusStopCode.toString()[0]== "4" ? "3" : ( d.BusStopCode.toString()[0]== "9" ? "8" : d.BusStopCode.toString()[0] )
        ctx.fillStyle = color(grp)
        ctx.fillRect(d.x, d.y, markerSize, markerSize)
      }
    });
  }

}