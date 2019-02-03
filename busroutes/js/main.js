var data
var routes
var projection
var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
var height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
var canvasDim = { width: width*0.9, height: height*0.9 };
var frameNum = 0

var logScale = d3.scaleLog()
  .domain([5000, 50000])

var colorScaleLog = d3.scaleSequential(d => d3.interpolateViridis(logScale(d)))   

var colorScaleLinear = d3.scaleSequential(d3.interpolateViridis)
  .domain([5000, 50000])

var container = d3.select('.map-geojson')

// create svg and group
var svg = container.append("svg")
      .attr("width", canvasDim.width)
      .attr("height", canvasDim.height)
      .attr("transform", "translate(0,0)")

var mapWrapper = svg.append("g")
  .attr("class", "mapWrapper")

// add foreign object to svg
// https://gist.github.com/mbostock/1424037
var foreignObject = mapWrapper.append("foreignObject")
    .attr("width", canvasDim.width)
    .attr("height", canvasDim.height);

// add embedded body to foreign object
var foBody = foreignObject.append("xhtml:body")
    .style("margin", "0px")
    .style("padding", "0px")
    .style("background-color", "transparent")
    .style("width", canvasDim.width)
    .style("height", canvasDim.height)

// add embedded canvas to embedded body
var canvas = foBody.append("canvas")
    .attr('class', 'map')
    .attr("width", canvasDim.width)
    .attr("height", canvasDim.height)

var ctx = d3.select('.map').node().getContext('2d');

var lineGenerator = d3.line()
  .x(function(d) {
    return d.x;
  })
  .y(function(d) {
    return d.y;
  })
  .context(ctx);

var lineFunction = d3.line()
    .x(function(d) {
      return d.x;
    })
    .y(function(d) {
      return d.y;
    })
    .curve(d3.curveCatmullRom)

init()

function init() {

  d3.queue()   
    .defer(d3.csv, './data/busroutes.csv')  
    .defer(d3.csv, './data/busstops.csv')
    .defer(d3.json, './data/singapore.json')  // our geometries
    .await(createChart);  

}

function createChart(error, csv1, csv2, geoJSON){

  initializeData(csv1, csv2)
  createDropdown()
  initProjection(geoJSON)
  projectPoints()
  getRoutes()
  updateChart()

}

function initializeData(csv1, csv2){

  routes = csv1.map((d,i) => {
    return {
    BusStopCode: +d.BusStopCode,
    StopSequence: +d.StopSequence,
    ServiceNo: +d.ServiceNo,
    Direction: +d.Direction
    }
  })
  //console.log(routes)

  busstops = csv2.map((d,i) => {
    return {
    BusStopCode: +d.BusStopCode,
    lat: +d.Latitude,
    lon: +d.Longitude,
    }
  })
  //console.log(busstops)

  data = routes.map((d,i) => {
    return Object.assign({}, d, busstops.find(b=>b.BusStopCode===d.BusStopCode)||{});
  })
  //console.log(data)
}

function initProjection(geoJSON) {
 
  //var geoJSON = {
    //type: "FeatureCollection",
    //features: []
  //}
 
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
 
  projection = d3.geoMercator().fitSize([canvasDim.width, canvasDim.height], geoJSON);
  var path = d3.geoPath().projection(projection);

  var polygons = geoJSON.features.filter(d=>d.type=='Feature')

  mapWrapper.selectAll(".country")
      .data(polygons)
      .enter()
      .append("path")
      .attr("class", "country")
      .attr("d", path)
      .style("stroke-width", "1")
      .style("stroke", "black")
      .style("fill", "transparent")
}
 
function projectPoints() {

  data.forEach(function(d) {
    var pt = projection([d.lon, d.lat]);
    d.x = pt[0];
    d.y = pt[1];
  });

}


var service1 = [];
var service2 = [];

function getRoutes() {

  data.forEach(function(d) {
 
    // Create empty array if haven't already done so
    if(!service1[d.ServiceNo]) {
      service1[d.ServiceNo] = []
    }
    if(!service2[d.ServiceNo]) {
      service2[d.ServiceNo] = []
    }

    // Add the point's screen coordinates to the array
    if(d.Direction==1 && isNaN(d.ServiceNo)==false){
      service1[d.ServiceNo].push({
        x: d.x,
        y: d.y
      })
    }

    if(d.Direction==2 && isNaN(d.ServiceNo)==false){
      service2[d.ServiceNo].push({
        x: d.x,
        y: d.y
      })
    }

  })

}

// ------------------------------------------
// DRAW BUS ROUTE PATHS AND BUST STOP MARKERS
var service11 = [];
var nodes = []

function updateChart() {

  d3.selectAll('.label').remove();
  d3.selectAll('.vol-circle').remove()
  d3.selectAll('.vol-path').remove()
  ctx.clearRect(0, 0, canvasDim.width, canvasDim.height);

  ctx.strokeStyle = 'rgba(0, 0, 255, 0.2)'
  ctx.lineWidth = 0.2
  service2.forEach(function(d) {
    ctx.beginPath();
    lineGenerator(d);
    ctx.stroke();
  });

  ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)'
  ctx.lineWidth = 0.2
  service1.forEach(function(d) {
    ctx.beginPath();
    lineGenerator(d);
    ctx.stroke();
  });

  ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
  service2.forEach(function(route,i) {
    route.forEach(function(point){
      if(point.x && point.y){
        ctx.fillRect(point.x, point.y, 1.5, 1.5)
      }
    })
  });

  service11 = []
  nodes = []
  ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
  service1.forEach(function(route,i) {
    var tmp = []
    route.forEach(function(point){
      if(point.x && point.y){
        ctx.fillRect(point.x, point.y, 1.5, 1.5)
        tmp.push([point.x, point.y, i])
      }
    })
    service11.push(tmp)
  });

  service11.forEach(function(route,i){
    if(route.length != 0) {
      nodes.push({
        x:route[0][0],
        y:route[0][1],
        i:route[0][2],
      })
    }
  })
  //console.log(nodes)

  mapWrapper.selectAll(".marker")
    .enter()
    .attr("class", "marker")

}

// ----------------------------------
// ANIMATE THE MOVEMENT OF BUS ROUTES
function updateChartAnimate() {

  // Draw a point for each route for the current frameNum
  service2.forEach(function(d,i) {
    if(frameNum >= d.length) return;
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(d[frameNum].x, d[frameNum].y, 2, 2);
    ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.fillRect(d[frameNum-1].x, d[frameNum-1].y, 2, 2);
  });

  service1.forEach(function(d,i) {
    if(frameNum >= d.length) return;
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(d[frameNum].x, d[frameNum].y, 2, 2);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillRect(d[frameNum-1].x, d[frameNum-1].y, 2, 2);
  });

}

function initAnimation() {

  if(d3.selectAll('.marker').empty()==true) {
    updateChart()
  }

  let maxRouteLength1 = d3.max(service1, function(d) {
    return d ? d.length : 0;
  });
  let maxRouteLength2 = d3.max(service2, function(d) {
    return d ? d.length : 0;
  });
  maxRouteLength = Math.max(maxRouteLength1, maxRouteLength2)

  var t = window.setInterval(function() {
    frameNum++
 
    // reset the frame counter
    if(frameNum === maxRouteLength) {
      window.clearInterval(t)
      frameNum = 0
    }
    //console.log(frameNum)
    updateChartAnimate();
  }, 300);

}

// --------------------------------------------------
// DROPDOWN MENU SELECTION OF BUS ROUTES TO VISUALIZE
function createDropdown() {
  var busServiceNoList = [...new Set(data.map(d=>d.ServiceNo))]

  var menu = d3.select("#Dropdown")

  menu.append("select")
    .attr('class', 'form-control-lg')
    .attr('onfocus', 'this.size=10')
    .attr('onblur','this.size=1')
    .attr('onchange', 'this.size=1; this.blur();')
    .selectAll("option")
        .data(busServiceNoList)
        .enter()
        .append("option")
        .attr("value", function(d){
            return d;
        })
        .text(function(d){
            return d;
        })

  // Run update function when dropdown selection changes
  menu.on('change', function(){

    // Find which bus service was selected from the dropdown
    var selected = d3.select(this)
            .select("select")
            .property("value")

    // Run update function with the selected fruit
    updateGraph(selected)

  });

}

function updateGraph(num) {
  // Filter the data to include only bus service of interest
  var bus = data.filter(d=>d.ServiceNo==num && d.Direction==1)

  d3.selectAll('.label').remove();
  d3.selectAll('.marker').remove();

  ctx.clearRect(0, 0, canvasDim.width, canvasDim.height);

  // Highlight route of bus service (overlaying a black opaque path line)
  ctx.strokeStyle = 'rgba(128,0,128, 1)'
  ctx.lineWidth = 1
  ctx.beginPath();
  lineGenerator(bus);
  ctx.stroke();

  ctx.fillStyle = 'rgba(128,0,128, 1)';
  bus.forEach(function(point,i) {
    //ctx.fillText(i, route.slice(-1)[0].x+1, route.slice(-1)[0].y);
    if(point.x && point.y){
      ctx.fillRect(point.x, point.y, 3, 3);
    }
  });

  var firstbus = nodes.filter(d=>d.i==num)[0]
  ctx.fillText(firstbus.i, firstbus.x, firstbus.y);

}

// ----------------------------
// CREATE LABELS FOR BUS ROUTES
function createForceLayout() {

  var simulation = d3.forceSimulation()  
    .force('charge', d3.forceManyBody().strength(-20))
    .force("collide", d3.forceCollide(7))
    //.alphaDecay(0.1)
    //.velocityDecay(0.4)
    .stop()

  simulation
    .nodes(nodes)
    .force('x', d3.forceX().strength(0.8).x(d => d.x))
    .force('y', d3.forceY().strength(0.8).y(d => d.y))
  
  for (var i = 0; i < 100; ++i) simulation.tick()

  mapWrapper.selectAll(".label")
      .data(nodes)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", d=>d.x)
      .attr("y", d=>d.y)
      .style('font-size', 8)
      .style('text-anchor', 'middle')
      .text(d=>d.i)

}

// -----------------------
// VISUALIZE TRAVEL VOLUME
function initVolumeData(id) {

  d3.csv('./data/origin_destination_bus_top1perc.csv', function(csv) {
    var trips = csv.map((d,i) => {
      return {
        BusStopCode: +d.BusStopCode,
        total: +d.TOTAL_TRIPS,
        path: d.PATH,
        origin: +d.origin
      }
    })

    var data_vol = trips.map((d,i) => {
      return Object.assign({}, d, data.find(b=>b.BusStopCode===d.BusStopCode)||{});
    })
    //console.log(data_vol)

    var data_vol1 = data_vol.filter(d =>(isNaN(d.x)==false && isNaN(d.y)==false))

    data_vol1.sort(function(x, y){
       return d3.descending(x.total, y.total);
    })
    //console.log(data_vol1)

    if(id==1){

      // Nest data with unique origin-destination path as key
      var data_vol2 =  d3.nest()
                      .key(d => d.path)
                      .entries(data_vol1)
      //console.log(data_vol2)

      ctx.clearRect(0, 0, canvasDim.width, canvasDim.height);
      d3.selectAll('.vol-circle').remove()

      var vol = mapWrapper.selectAll(".vol-path")
        .data(data_vol2)
        .enter()
        .append("g")
        .attr("class", "vol-path")

      vol.append("path")
        .attr("class", "line")
        .style("stroke", d=>colorScaleLog(d.values.find(x=>x.total).total))
        .style("stroke-width", 1)
        .style("fill", d=>colorScaleLog(d.values.find(x=>x.total).total))
        .style("opacity", 0.5)
        .attr("d", d=>lineFunction(d.values))

      d3.selectAll(".line")
          .transition()
          .duration(750)
          .style("stroke", d=>colorScaleLog(d.values.find(x=>x.total).total))
          .style("stroke-width", 1)
          .style("fill", d=>colorScaleLog(d.values.find(x=>x.total).total))
          .style("opacity", 0.5)

      vol.exit().remove()

    } else if(id==2) {

      ctx.clearRect(0, 0, canvasDim.width, canvasDim.height)
      d3.selectAll('.vol-path').remove()

      var vol_circle = mapWrapper.selectAll(".vol-circle")
        .data(data_vol1)
        .enter()
        .append("g")
        .attr("class", "vol-circle")

      vol_circle.append("circle")
          .attr("class", "stops")
          .attr("cx", d=>d.x)
          .attr("cy", d=>d.y)
          .attr("r", d=>logScale(d.total)*10)
          .style("fill", d=>colorScaleLog(d.total))
          .style("opacity", 0.5)

      vol_circle.exit().remove()

    } 

  })
}

