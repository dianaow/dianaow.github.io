
var data
var busstops
var oldWidth = 0

var lineGenerator = d3.line()
    .x(function(d) {
      return d.x;
    })
    .y(function(d) {
      return d.y;
    })

var logScale = d3.scaleLog()
  .domain([5000, 50000])

var colorScaleLog = d3.scaleSequential(d => d3.interpolateViridis(logScale(d)))   

var colorScaleLinear = d3.scaleSequential(d3.interpolateViridis)
  .domain([5000, 50000])

init()
d3.select(window).on('resize', init)

function init() {

  d3.queue()   
    .defer(d3.csv, './data/busroutes.csv')  
    .defer(d3.csv, './data/busstops.csv')
    .defer(d3.json, './data/singapore.json')  // our geometries
    .await(createChart);  

}

function createChart(error, csv1, csv2, geoJSON){

  initializeData(csv1, csv2)
  renderMapWithRoutes(geoJSON)

}

function initializeData(csv1, csv2){

  var routes = csv1.map((d,i) => {
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

function renderMapWithRoutes(geoJSON) {

  if (oldWidth == innerWidth) return 
  oldWidth = innerWidth
  
  var width = height = d3.select('#graph').node().offsetWidth

  //var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) * 0.7
  //var height = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) * 0.5

  var container = d3.select('#graph').html('')

  var svg = container.append("svg")
    .attr("width", width)
    .attr("height", height)

  if (innerWidth <= 925){
    width = innerWidth
    height = innerHeight*.7
    //svg.attr("transform", "translate(0,0)")
  } else {
    //svg.attr("transform", "translate(0,-120)")
  }

  var mapWrapper = svg.append("g")
    .attr("class", "mapWrapper")

  // add foreign object to svg
  // https://gist.github.com/mbostock/1424037
  var foreignObject = mapWrapper.append("foreignObject")
      .attr("width", width)
      .attr("height", height);

  // add embedded body to foreign object
  var foBody = foreignObject.append("xhtml:body")
      .style("margin", "0px")
      .style("padding", "0px")
      .style("background-color", "transparent")
      .style("width", width)
      .style("height", height)

  // add embedded canvas to embedded body
  var canvas = foBody.append("canvas")
      .attr('class', 'map')
      .attr("width", width)
      .attr("height", height)

  // getContext() method returns an object that provides methods and properties for drawing on the canvas
  ctx = d3.select('.map').node().getContext('2d')

  // ------------------------------------------
  // DATA PROCESSING BEFORE PLOTTING
  // append bus route points to geoJSON already containing multi-polygon describing singapore map
  // this is important so that projection will include these points and ensure alignment in render 
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

  var projection = d3.geoMercator().fitSize([width, height], geoJSON);

  var path = d3.geoPath().projection(projection);
  var polygons = geoJSON.features.filter(d=>d.type=='Feature')

  // project gps coordinates of each point in route to screen coordinates (there will be duplicate bus stops coords)
  data.forEach(function(d) {
    var pt = projection([d.lon, d.lat]);
    d.x = pt[0];
    d.y = pt[1];
  });

  // project gps coordinates of each bus stop to screen coordinates(unique bus stops coords only)
  busstops.forEach(function(d) {
    var pt = projection([d.lon, d.lat]);
    d.x = pt[0];
    d.y = pt[1];
  });

  var service1 = []
  var service2 = []

  data.forEach(function(d) {

    if(!service1[d.ServiceNo]) {
      service1[d.ServiceNo] = []
    }
    if(!service2[d.ServiceNo]) {
      service2[d.ServiceNo] = []
    }

    // Add the bus route point's screen coordinates to the array
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

  var gs = d3.graphScroll()
    .container(d3.select('.container-1'))
    .graph(d3.selectAll('container-1 #graph'))
    .eventId('uniqueId1')  // namespace for scroll and resize events
    .sections(d3.selectAll('.container-1 #sections > div'))
    //.offset(innerWidth < 900 ? innerHeight - 30 : 300)
    .on('active', function(i){
      console.log(i)
      // ------------------------------------------
      // DRAW MAP OF SINGAPORE    
      mapWrapper.selectAll(".country")
          .data(polygons)
          .enter()
          .append("path")
          .attr("class", "country")
          .attr("d", path)
          .style("stroke-width", "1")
          .style("stroke", "black")
          .style("fill", "transparent")

      // ------------------------------------------
      // DRAW BUS ROUTE PATHS AND BUS STOP MARKERS
      // each line represents route from one bus stop to the next in Direction 2
      ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)'
      ctx.lineWidth = 0.2
      lineGenerator.context(ctx)
      service2.forEach(function(d) {
        ctx.beginPath();
        lineGenerator(d);
        ctx.stroke();
      });

      // each line represents route from one bus stop to the next in Direction 1
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'
      ctx.lineWidth = 0.2
      service1.forEach(function(d) {
        ctx.beginPath();
        lineGenerator(d);
        ctx.stroke();
      });

      // each rectange represents a bus stop 
      //ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      //busstops.forEach(function(point){
        //if(point.x && point.y){
          //ctx.fillRect(point.x, point.y, 2, 2)
        //}
      //});

      if(i==1){
        d3.selectAll('.form-control-lg').remove()
        d3.selectAll('.vol-circle').remove()
        d3.selectAll('.vol-path').remove()
        ctx.clearRect(0, 0, width, height)
        createDropdown(width, height)
      }

    })

}


// --------------------------------------------------
// DROPDOWN MENU SELECTION OF BUS ROUTES TO VISUALIZE
function createDropdown(width, height) {

  var defaultServiceNum = 851
  var defaultDirection = 1
  var busServiceNoList = [...new Set(data.map(d=>d.ServiceNo))]
  busServiceNoList.unshift("Bus Service No.")

  var menu = d3.select("#Dropdown")
              .attr('class', 'form-group')

  // allows user to select bus service number
  menu.append("select")
    .attr('class', 'dropdown1 form-control-lg')
    .attr('onfocus', 'this.size=10')
    .attr('onblur','this.size=1')
    .attr('onchange', 'this.size=1; this.blur();')
    .selectAll("option")
        .data(busServiceNoList)
        .enter()
        .append("option")
        .attr("value", d=>d)
        .text(d=>d)
        .each(function(d) {
          if (d === "Service No.") {
            d3.select(this).property("disabled", true)
          }
        });
        //.property("selected", d=>d===defaultServiceNum)

  // allows user to select bus route direction (1 or 2)
  menu.append("select")
    .attr('class', 'dropdown2 form-control-lg')
    .selectAll("option")
        .data(['Direction', 1,2])
        .enter()
        .append("option")
        .attr("value", d=>d)
        .text(d=>d)
        .each(function(d) {
          if (d === "Direction") {
            d3.select(this).property("disabled", true)
          }
        });
        //.property("selected", d=>d===defaultDirection)

  var serviceNum = defaultServiceNum
  var direction = defaultDirection

  // Run update function when dropdown selection changes
  d3.select(".dropdown1").on('change', function(){
    serviceNum = d3.select(this).property("value") // Find which value was selected from the dropdown
    updateGraph(serviceNum, direction, width, height) 

  });

  d3.select(".dropdown2").on('change', function(){
    direction = d3.select(this).property("value")
    updateGraph(serviceNum, direction, width, height)

  });
}

function updateGraph(serviceNum, direction, width, height) {

  // Filter the data to include only route of interest
  var bus = data.filter(d=>d.ServiceNo==serviceNum && d.Direction==direction)

  // Since all the routes and bus stops are already rendered, we need to clear them first
  d3.selectAll('.label').remove();
  d3.selectAll('.marker').remove();
  ctx.clearRect(0, 0, width, height);

  // Draw route bus service takes 
  ctx.strokeStyle = 'rgba(128,0,128, 1)'
  ctx.lineWidth = 1
  ctx.beginPath();
  lineGenerator(bus);
  ctx.stroke();

  ctx.fillStyle = 'rgba(128,0,128, 1)';
  if(bus.length != 0) {
    bus.forEach(function(point,i) {
      ctx.fillRect(point.x, point.y, 2, 2) // Draw bus stops along route
    })
    ctx.fillText(serviceNum, bus[0].x, bus[0].y-6) // Label route with bus service number
  } else {
    ctx.fillText("Bus Service does not travel in this route", width/3, height/2) // Display error message if route not found
  }

}

