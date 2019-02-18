// using d3 for convenience, and storing a selected elements
var container = d3.select('#scroll');
var graphic = container.select('.scroll__graphic');
var chart = graphic.select('.chart');
var text = container.select('.scroll__text');
var step = text.selectAll('.step');
var map;
var serviceL1 = []
var serviceL2 = []
var latLngs1 = [];
var latLngs2 = [];
var circleGroup
var linesGroup 
var data_vol
var data_vol1
var counter = 0
var geoJSON = []
if(!geoJSON.features) {
  geoJSON.features = []
}

var logScaleVol = d3.scaleLog()
  .domain([5000, 5000000])

var logScale = d3.scaleLog()
  .domain([5000, 50000])

var colorScaleLog = d3.scaleSequential(d => d3.interpolateViridis(logScale(d)))   
 
var vol = 
  [{group:"0-10", color:"#000000"},
   {group:"10-25", color:"#DB0131"}, 
   {group:"25-50", color:"#7F378D"},
   {group:"50-75", color:"#3465A8"}, 
   {group:"75-90", color:"#0AA174"},
   {group:"90-100", color:"#E47D06"}]

var colorScaleVol = d3.scaleOrdinal()
  .domain(vol.map(d=>d.group))
  .range(vol.map(d=>d.color))

// Here we're ycreating a FUNCTION to generate a line from input points. 
// Since input points will be in Lat/Long they need to be converted to map units
var toLine = d3.line()
    .x(function(d) {
      return map.latLngToLayerPoint(new L.LatLng(d.lat, d.lon)).x
    })
    .y(function(d) {
      return map.latLngToLayerPoint(new L.LatLng(d.lat, d.lon)).y
    })

// initialize the scrollama
let scroller = scrollama();

// resize function to set dimensions on load and on page resize
function handleResize() {
    // 1. update height of step elements for breathing room between steps
    let stepHeight = Math.floor(window.innerHeight);
    step.style('height', stepHeight + 'px');

    // 2. update height of graphic element
    let bodyWidth = d3.select('body').node().offsetWidth;

    graphic
        .style('height', window.innerHeight + 'px');

    // 3. update width of chart by subtracting from text width
    let chartMargin = 0;
    let textWidth = text.node().offsetWidth;
    let chartWidth = graphic.node().offsetWidth - textWidth - chartMargin;
    // make the height 1/2 of viewport
    let chartHeight = 100;

    chart
        .style('width', chartWidth + 'px')
        .style('height', chartHeight + '%');

    // 4. tell scrollama to update new element dimensions
    scroller.resize();
}

// scrollama event handlers
function handleStepEnter(response) {
    // response = { element, direction, index }

    // fade in current step
    step.classed('is-active', function (d, i) {
        return i === response.index;
    })

    // get attributes from element with "is-active" class
    let stepClass = document.getElementsByClassName('is-active')[0]

    //let lon = stepClass.getAttribute('data-lon')
    //let lat = stepClass.getAttribute('data-lat')
    //let zoom = stepClass.getAttribute('data-zoom')

    // change map position and zoom level depending on data-lon, data-lat and data-zoom attribute values
    //map.flyTo([lat, lon], zoom)
    // change with SQL the source of the layer
    if (response.index === 0) {
      console.log(0)  
      map.removeLayer(linesGroup)
      d3.selectAll('.form-control-lg').remove()
      d3.selectAll('.vol-path').remove()
      d3.selectAll('.vol-circle').remove()
      drawBusStops()

    } else if (response.index === 1) {
      console.log(1)
      map.removeLayer(circlesGroup)
      d3.selectAll('.form-control-lg').remove()
      d3.selectAll('.vol-path').remove()
      d3.selectAll('.vol-circle').remove()
      drawBusRoutes()

    }
    else if (response.index === 2) {
      console.log(2)
      map.removeLayer(linesGroup)
      map.removeLayer(circlesGroup)
      d3.selectAll('.form-control-lg').remove()
      d3.selectAll('.vol-path').remove()
      d3.selectAll('.vol-circle').remove()
      renderPassengerVol(2)
    }
    else if (response.index === 3) {
      console.log(3)
      d3.selectAll('.form-control-lg').remove()
      d3.selectAll('.vol-path').remove()
      d3.selectAll('.vol-circle').remove()
      renderPassengerVol(1)

    }
    else if (response.index === 4) {
      console.log(4)
      d3.selectAll('.vol-path').remove()
      d3.selectAll('.vol-circle').remove()
      createDropdown()
      //renderPassengerVol("animateOneRoute")
    }

}

function handleContainerEnter(response) {
    // response = { direction }

    // sticky the graphic
    graphic.classed('is-fixed', true);
    graphic.classed('is-bottom', false);
}

function handleContainerExit(response) {
    // response = { direction }

    // un-sticky the graphic, and pin to top/bottom of container
    graphic.classed('is-fixed', false);
    graphic.classed('is-bottom', response.direction === 'down');
}

// kick-off code to run once on load
function init() {

    // 1. call a resize on load to update width/height/position of elements
    handleResize();

    // 2. setup the scrollama instance
    // 3. bind scrollama event handlers (this can be chained like below)
    scroller
        .setup({
            container: '#scroll', // our outermost scrollytelling element
            graphic: '.scroll__graphic', // the graphic
            text: '.scroll__text', // the step container
            step: '.scroll__text .step', // the step elements
            offset: 0.25, // set the trigger to be 0.25 way down screen
            debug: false, // not display the trigger offset for testing
        })
        .onStepEnter(handleStepEnter)
        .onContainerEnter(handleContainerEnter)
        .onContainerExit(handleContainerExit);

    // setup resize event
    window.addEventListener('resize', handleResize);

    legendVol1()
    legendVol2()

    d3.queue()   
      .defer(d3.csv, './data/busroutes.csv')  
      .defer(d3.csv, './data/busstops.csv') 
      .await(initializeData);  

}

function initializeData(error, csv1, csv2){

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
    RoadName: d.RoadName,
    Description: d.Description,
    label: d.RoadName + " - " + d.Description
    }
  })
  //console.log(busstops)

  data = routes.map((d,i) => {
    return Object.assign({}, d, busstops.find(b=>b.BusStopCode===d.BusStopCode)||{});
  })

  data.forEach(function(d) {
    geoJSON.features.push({
      type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [d.lon, d.lat]
        },
        properties: {
          busStopCode: d.BusStopCode,
          label: d.RoadName + " - " + d.Description,
          StopSequence: +d.StopSequence,
          ServiceNo: +d.ServiceNo,
          Direction: +d.Direction
        }
    });
  });
  geoJSON.type = "FeatureCollection"

  data.forEach(function(d) {

    if(!serviceL1[d.ServiceNo]) {
      serviceL1[d.ServiceNo] = []
    }
    if(!serviceL2[d.ServiceNo]) {
      serviceL2[d.ServiceNo] = []
    }

    if(d.Direction==1 && d.lat && d.lon){
      serviceL1[d.ServiceNo].push([d.lat,d.lon])
    }

    if(d.Direction==2 && d.lat && d.lon){
      serviceL2[d.ServiceNo].push([d.lat,d.lon])
    }

  })

  // Create an array of routes where each route is an array of [lat,lon]
  serviceL1.forEach(function(route) {
    latLngs1.push(route);
  });
  
  serviceL2.forEach(function(route) {
    latLngs2.push(route);
  });

  leafletMap() //init leaflet map once on page load

} 

function leafletMap() {

  var mapboxTiles = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 25,
    id: 'mapbox.light',
    accessToken: 'pk.eyJ1IjoiZGlhbmFtZW93IiwiYSI6ImNqcmh4bjkxOTIyeXQzeW1yaXh5Z2F3Y3MifQ.3lc3RHtzIaj9tEm_MyzUeg'
  })

  map = L.map('map')
    .addLayer(mapboxTiles)
    .setView([1.351616, 103.808053], 12); //center the map at singapore

  map.scrollWheelZoom.disable()

  drawBusStops() //ensures leaflet map is created first before add layer

}

function drawBusStops() {

  circlesGroup = L.featureGroup()

  serviceL1.forEach(function(route) {
    route.forEach(function(point){
      L.circle(point, {color: '#000', weight: 0.5, opacity: 1, fill: false}).addTo(circlesGroup);
    })
  })
 
  serviceL2.forEach(function(route) {
    route.forEach(function(point){
      L.circle(point, {color: '#000', weight: 0.5, opacity: 1, fill: false}).addTo(circlesGroup);
    })
  })

  map.addLayer(circlesGroup)

  //map.on("zoomend", map.fitBounds(map.getBounds()))
}

function drawBusRoutes() {

  linesGroup = L.featureGroup()

  // draw polylines representing a route between 2 bus stops
  var polyline1 = L.polyline(latLngs1, {color: 'red', weight: 0.5, opacity: 0.5}).addTo(linesGroup);
  var polyline2 = L.polyline(latLngs2, {color: 'blue', weight: 0.5, opacity: 0.5}).addTo(linesGroup);

  map.addLayer(linesGroup)

  //map.on("zoomend", map.fitBounds(map.getBounds()))

}

function renderPassengerVol(id) {
  
  d3.csv('./data/origin_destination_bus_top1perc.csv', function(csv) {
    var trips = csv.map((d,i) => {
      return {
        BusStopCode: +d.BusStopCode,
        total: +d.TOTAL_TRIPS,
        path: d.PATH
      }
    })

    data_vol = trips.map((d,i) => {
      return Object.assign({}, d, data.find(b=>b.BusStopCode===d.BusStopCode)||{});
    })

    data_vol.sort(function(x, y){
      return d3.descending(x.total, y.total);
    })
    //console.log(data_vol)

    // Nest data with unique origin-destination path as key
    data_vol1 =  d3.nest()
      .key(d => d.path)
      .entries(data_vol)
    //console.log(data_vol1)

    data_vol2 =  d3.nest()
      .key(d => d.BusStopCode)
      .rollup(d => d3.sum(d, t=>t.total))
      .entries(data_vol)

    data_vol2 = data_vol2.map((d,i) => {
      return Object.assign({}, d, data.find(b=>b.BusStopCode===+d.key)||{});
    })

    var arr = data_vol2.map(d=>d.value)
    data_vol2.map((d,i) => {
      if(d.value<=math.quantileSeq(arr, 0.1)){
        d.category = "0-10"
      } else if(d.value>math.quantileSeq(arr, 0.1) & d.value<=math.quantileSeq(arr, 0.25)){
        d.category = "10-25"
      } else if(d.value>math.quantileSeq(arr, 0.25) & d.value<=math.quantileSeq(arr, 0.5)){
        d.category = "25-50"
      } else if(d.value>math.quantileSeq(arr, 0.5) & d.value<=math.quantileSeq(arr, 0.75)){
        d.category = "50-75"
      } else if(d.value>math.quantileSeq(arr, 0.75) & d.value<=math.quantileSeq(arr, 0.9)){
        d.category = "75-90"
      } else if(d.value>math.quantileSeq(arr, 0.9)){
        d.category = "90-100"
      }
    })
    //console.log(data_vol2)

    //var svgLayer = L.svg()
    //svgLayer.addTo(map)
    //var svgMap = d3.select("#map").select("svg")
    //var g = svgMap.select('g')
  
    var svg = d3.select(map.getPanes().overlayPane).append("svg");

    // if you don't include the leaflet-zoom-hide when a user zooms in or out you will still see the phantom original SVG 
    var g = svg.append("g").attr("class", "leaflet-zoom-hide");

    if(id==1){

      d3.selectAll('.vol-circle').remove()

      var vol_path = g.selectAll("path")
        .data(data_vol1)
        .enter()
        .append("path")
          .attr("class", "vol-path")
          .style("stroke", d=>colorScaleLog(d.values.find(x=>x.total).total))
          .style("stroke-width", 1)
          .style("fill", d=>colorScaleLog(d.values.find(x=>x.total).total))
          .style("opacity", 0.5)

      map.on("zoomend", reset) // when the user zooms in or out you need to reset the view
      reset()

    }
    if(id==2){

      d3.selectAll('.vol-path').remove()

      var vol_circle = g.selectAll("circle")
        .data(data_vol2)
        .enter()
        .append("circle")
        .attr("class", "vol-circle")
          .attr("r", d=>logScaleVol.range([2,20])(d.value))
          .style("fill", d=>colorScaleVol(d.category))
          .style("opacity", 0.5)

      map.on("zoomend", reset);
      reset()

    }
    if(id.label=="animateOneRoute"){

      // Filter the data to include only bus service of interest
      var one_route = data.filter(d=>d.ServiceNo==id.param1 && d.Direction==id.param2)
      //console.log(one_route)

      // these are the points that make up the path
      // they are unnecessary so I've make them transparent for now
      var ptFeatures = g.selectAll("circle")
          .data(one_route)
          .enter()
          .append("circle")
          .attr("class", "waypoints")
          .attr("r", 3)
          .style("fill", "black")
          .style("opacity", 0)

      // Here we will make the points into a single line/path. 
      // Note that we surround the featuresdata with [] to tell d3 to treat all the points as a single line.
      // For now these are basically points but below we set the "d" attribute using the line creator function from above.
      var linePath = g.selectAll(".lineConnect")
          .data(one_route)
          .enter()
          .append("path")
          .attr("class", "lineConnect")
          .style("fill", "transparent")
          .style("stroke", "black")
          .style("opacity", 1)

      // I'm taking the first and the last object (the origin and destination) and adding them separately to better style them. 
      var originANDdestination = [one_route[0], one_route.slice(-1)[0]]

      var ODwrapper = g.selectAll('ODwrapper').data(originANDdestination).enter().append('g').attr('class', 'ODwrapper')

      var begend = ODwrapper
          .append("circle")
          .attr("class", "begend")
          .attr("r", 3)
          .style("fill", "red")
          .style("opacity", 1)

      var text = ODwrapper
          .append("text")
          .attr("class", "locnames")
          .attr("y", -10)
          .style("fill", "black")
          .style("font-size", 9)
          .text(d=>d.label)

      var text1 = ODwrapper
          .append("text")
          .attr("class", "locnames1")
          .attr("y", -22)
          .style("fill", "black")
          .style("font-size", 11)
          .style("font-weight", "bold")
          .text(d=>d.ServiceNo)

      map.on("zoomend", reset);
      reset();
      
    }

    // Use Leaflet to implement a D3 geometric transformation.
    // the latLngToLayerPoint is a Leaflet conversion method:
    // Returns the map layer point that corresponds to the given geographical coordinates (useful for placing overlays on the map).
    function transform() { 
      return d3.geoTransform({
        point: function(x, y) {
          if(x && y) {
            var point = map.latLngToLayerPoint(new L.LatLng(y, x));
            this.stream.point(point.x, point.y);
          }
        }
      })
    }

    // the transition function could have been done above using
    // chaining but it's cleaner to have a separate function.
    // the transition. Dash array expects "500, 30" where 
    // 500 is the length of the "dash" 30 is the length of the
    // gap. So if you had a line that is 500 long and you used
    // "500, 0" you would have a solid line. If you had "500,500"
    // you would have a 500px line followed by a 500px gap. This
    // can be manipulated by starting with a complete gap "0,500"
    // then a small line "1,500" then bigger line "2,500" and so 
    // on. The values themselves ("0,500", "1,500" etc) are being
    // fed to the attrTween operator
    function transition() {

      linePath.transition()
          .duration(7500)
          .attrTween("stroke-dasharray", tweenDash)
          .on("end", function() {
              d3.select(this).call(transition);// infinite loop
          }); 
    } 

    // this function feeds the attrTween operator above with the stroke and dash lengths
    function tweenDash() {
        return function(t) {
            //total length of path (single value)
            var l = linePath.node().getTotalLength(); 

            // this is creating a function called interpolate which takes
            // as input a single value 0-1. The function will interpolate
            // between the numbers embedded in a string. An example might
            // be interpolatString("0,500", "500,500") in which case
            // the first number would interpolate through 0-500 and the
            // second number through 500-500 (always 500). So, then
            // if you used interpolate(0.5) you would get "250, 500"
            // when input into the attrTween above this means give me
            // a line of length 250 followed by a gap of 500. Since the
            // total line length, though is only 500 to begin with this
            // essentially says give me a line of 250px followed by a gap
            // of 250px.
            interpolate = d3.interpolateString("0," + l, l + "," + l);

            return interpolate(t);
        }
    } 

    function reset(id) {
      //console.log('fired')
      map.off("zoomend");

      var d3path = d3.geoPath().projection(transform())

      var bounds = d3path.bounds(geoJSON),
                topLeft = bounds[0],
                bottomRight = bounds[1];

      svg.attr("width", bottomRight[0] - topLeft[0])
          .attr("height", bottomRight[1] - topLeft[1])
          .style("left", topLeft[0] + "px")
          .style("top", topLeft[1] + "px");

      g.attr("transform", "translate(" + (-topLeft[0]) + "," + (-topLeft[1]) + ")");

      if(vol_path) {
        vol_path.attr("d", d=>toLine(d.values))
      }
      
      if(vol_circle) {
        // for the points we need to convert from latlong to map units
        vol_circle.attr("transform",
          function(d) {
            return "translate(" +
              map.latLngToLayerPoint(new L.LatLng(d.lat, d.lon)).x + "," +
              map.latLngToLayerPoint(new L.LatLng(d.lat, d.lon)).y + ")";
        });
      }

      if(linePath) {
        linePath.attr("d", toLine(one_route))
        ptFeatures.attr("transform",
          function(d) {
            return "translate(" +
              map.latLngToLayerPoint(new L.LatLng(d.lat, d.lon)).x + "," +
              map.latLngToLayerPoint(new L.LatLng(d.lat, d.lon)).y + ")";
        });
        ODwrapper.attr("transform",
          function(d) {
            return "translate(" +
              map.latLngToLayerPoint(new L.LatLng(d.lat, d.lon)).x + "," +
              map.latLngToLayerPoint(new L.LatLng(d.lat, d.lon)).y + ")";
        });
        transition()
      }

      map.on("zoomend", reset);
    }
 
  })

}


function legendVol2() {

  var svg = d3.select('.legend-vol2').append("svg")
  var legend = svg.append('g').attr("class", "g-legend-vol2")

  var radius = 6
  var yscale = d3.scaleLinear()
    .domain([0, vol.length - 1])
    .range([30, 100]);

  vol.forEach(function(d, i) {
    d.x = 10;
    d.y = yscale(i);
  });

  legend.selectAll(".legend-node")
    .data(vol)
    .enter()
    .append("circle")
    .attr("class", "legend-node")
    .attr("id", d=>d.name)
    .attr("cx", d=>d.x)
    .attr("cy", d=>d.y+20)
    .attr("r", radius)
    .style("fill", d=>d.color)

  legend.selectAll(".legend-text")
    .data(vol)
    .enter()
    .append("text")
    .attr("class", "legend-text")
    .attr("id", d=>d.name)
    .attr("x", d=>d.x + (2*radius))
    .attr("y", d=>d.y + 20 + radius/2)
    .style("fill", "white")
    .style("font-size", 9)
    .text(d=>d.group)

  legend
    .append("text")   
    .attr("x", vol[0].x/2)
    .attr("y", vol[0].y + 10)
    .style("fill", "white")
    .style("font-size", 11)
    .style('font-weight', 'bold')
    .text("Total number of trips (in percentile)")

}

function legendVol1() {

  var barHeight = 20;
  var barWidth = 20;
  var points = d3.range(5000, 50001, 5000)

  var svg = d3.select('.legend-vol1').append("svg")
  var legend = svg.append('g').attr("class", "g-legend-vol1")

  legend.selectAll('.legend-bars')
    .data(points)
    .enter()
    .append('rect')
      .attr("class", "legend-bars")
      .attr('y', 20)
      .attr('x', (d, i) => i * barWidth)
      .attr('width', barWidth)
      .attr('height', barHeight)
      .attr('fill', d=>colorScaleLog(d))
  
  legend.selectAll('.legend-text')
    .data(points)
    .enter()
    .append('text')
      .attr('y', 50)
      .attr('x', (d, i) => i * barWidth)
      .attr('fill', 'white') 
      .style("font-size", 9)
      .text((d, i) => i%3 === 0 ? d : "") 

  legend
    .append('text')
      .attr('y', 10)
      .attr('x', 0)
      .attr('fill', 'white') 
      .style("font-size", 11)
      .style('font-weight', 'bold')
      .text('Passenger Volume')

}

// --------------------------------------------------
// DROPDOWN MENU SELECTION OF BUS ROUTES TO VISUALIZE
function createDropdown() {

  var defaultServiceNum = 851
  var defaultDirection = 1
  var busServiceNoList = [...new Set(data.map(d=>d.ServiceNo))]
  busServiceNoList.unshift("Bus Service No.")

  var menu = d3.select("#Dropdown")
              .attr('class', 'form-group')
              //.attr('transform', 'translate(100, 200)')

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
    renderPassengerVol({label:"animateOneRoute", param1:serviceNum, param2:direction})

  });

  d3.select(".dropdown2").on('change', function(){
    direction = d3.select(this).property("value")
    renderPassengerVol({label:"animateOneRoute", param1:serviceNum, param2:direction})

  });
}

function clearChart() {
  d3.selectAll('*').transition() //stop the transition
  d3.selectAll('.lineConnect').remove()
  d3.selectAll('.waypoints').remove()
  d3.selectAll('.begend').remove()
  d3.selectAll('.locnames').remove()
  d3.selectAll('.locnames1').remove()
}

// start it up
init();