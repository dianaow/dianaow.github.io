var data
var routes
var projection
var defaultOptionName = 851 

var geoJSON = []
// Create empty array if haven't already done so
if(!geoJSON.features) {
  geoJSON.features = []
}



var mapboxTiles = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
  maxZoom: 25,
  id: 'mapbox.streets',
  accessToken: 'pk.eyJ1IjoiZGlhbmFtZW93IiwiYSI6ImNqcmh4bjkxOTIyeXQzeW1yaXh5Z2F3Y3MifQ.3lc3RHtzIaj9tEm_MyzUeg'
})

var map = L.map('chart')
  .addLayer(mapboxTiles)
  .setView([1.351616, 103.808053], 12); //center the map at singapore

// Use Leaflet to implement a D3 geometric transformation.
// the latLngToLayerPoint is a Leaflet conversion method:
//Returns the map layer point that corresponds to the given geographical
// coordinates (useful for placing overlays on the map).
function projectPoint(x, y) {
    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
} //end projectPoint

function applyLatLngToLayer(d) {
  var y = d.geometry.coordinates[1]
  var x = d.geometry.coordinates[0]
  return map.latLngToLayerPoint(new L.LatLng(y, x))
}

// Here we're creating a FUNCTION to generate a line
// from input points. Since input points will be in 
// Lat/Long they need to be converted to map units
// with applyLatLngToLayer
var toLine = d3.line()
    .x(function(d) {
        return applyLatLngToLayer(d).x
    })
    .y(function(d) {
        return applyLatLngToLayer(d).y
    })

init()

function init() {

  d3.queue()   
    .defer(d3.csv, './data/busroutes.csv')  
    .defer(d3.csv, './data/busstops.csv') 
    .await(createChart);  
}

function createChart(error, csv1, csv2){

  initializeData(csv1, csv2)
  createDropdown()
  updateGraph(defaultOptionName)
}


// Data formatting
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
    RoadName: d.RoadName,
    Description: d.Description
    }
  })
  //console.log(busstops)

  data = routes.map((d,i) => {
    return Object.assign({}, d, busstops.find(b=>b.BusStopCode===d.BusStopCode)||{});
  })

  data = data.filter(d =>(isNaN(d.lat)==false && isNaN(d.lon)==false))

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
} 

var serviceL1 = []
var serviceL2 = []

function initRoutes() {

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
  //console.log(serviceL1, serviceL2)
}

function leafletChart() {

  // Create an array of routes where each route is an array of [lat,lon]
  var latLngs1 = [];
  serviceL1.forEach(function(route) {
    latLngs1.push(route);
  });
  var latLngs2 = [];
  serviceL2.forEach(function(route) {
    latLngs2.push(route);
  });

  serviceL1.forEach(function(route) {
    route.forEach(function(point){
      L.circle(point, {color: '#000', weight: 1, opacity: 1, fill: false}).addTo(map);
    })
  })
 
  serviceL2.forEach(function(route) {
    route.forEach(function(point){
      L.circle(point, {color: '#000', weight: 1, opacity: 1, fill: false}).addTo(map);
    })
  })

  // draw polylines representing a route between 2 bus stops
  var polyline1 = L.polyline(latLngs1, {color: 'red', weight: 1, opacity: 0.3}).addTo(map);
  var polyline2 = L.polyline(latLngs2, {color: 'blue', weight: 1, opacity: 0.3}).addTo(map);

  // zoom the map to the polyline
  map.on("zoomend", map.fitBounds(polyline1.getBounds()));
  map.on("zoomend", map.fitBounds(polyline2.getBounds()));

}


function updateGraph(num) {

  // Filter the data to include only bus service of interest
  var one_route = geoJSON.features.filter(d=>d.properties.ServiceNo==num && d.properties.Direction==1)
  //console.log(one_route)

  // we will be appending the SVG to the Leaflet map pane
  // g (group) element will be inside the svg 
  var svg = d3.select(map.getPanes().overlayPane).append("svg");

  // if you don't include the leaflet-zoom-hide when a 
  // user zooms in or out you will still see the phantom
  // original SVG 
  var g = svg.append("g").attr("class", "leaflet-zoom-hide");

  //stream transform. transforms geometry before passing it to
  // listener. Can be used in conjunction with d3.geo.path
  // to implement the transform. 

  function transform() { 
    return d3.geoTransform({
      point: function(x, y) {
        var point = map.latLngToLayerPoint(new L.LatLng(y, x));
        this.stream.point(point.x, point.y);
      }
    })
  }

  //d3.geo.path translates GeoJSON to SVG path codes.
  //essentially a path generator. In this case it's
  // a path generator referencing our custom "projection"
  // which is the Leaflet method latLngToLayerPoint inside
  // our function called projectPoint
  var d3path = d3.geoPath().projection(transform());

  // From now on we are essentially appending our features to the
  // group element. We're adding a class with the line name
  // and we're making them invisible

  // these are the points that make up the path
  // they are unnecessary so I've make them
  // transparent for now
  var ptFeatures = g.selectAll("circle")
      .data(one_route)
      .enter()
      .append("circle")
      .attr("class", "waypoints")
      .attr("r", 3)
      .style("fill", "black")
      .style("opacity", 0)

  // Here we will make the points into a single
  // line/path. Note that we surround the featuresdata
  // with [] to tell d3 to treat all the points as a
  // single line. For now these are basically points
  // but below we set the "d" attribute using the 
  // line creator function from above.
  var linePath = g.selectAll(".lineConnect")
      .data(one_route)
      .enter()
      .append("path")
      .attr("class", "lineConnect")
      .style("fill", "transparent")
      .style("stroke", "black")
      .style("opacity", 1)

  // This will be our traveling circle it will
  // travel along our path
  //var marker = g.append("circle")
      //.attr("id", "marker")
      //.attr("class", "travelMarker")
      //.attr("r", 5)
      //.style("fill", "yellow")
      //.style("opacity", 0.7)

  // For simplicity I hard-coded this! I'm taking
  // the first and the last object (the origin)
  // and destination and adding them separately to
  // better style them. There is probably a better
  // way to do this!
  var originANDdestination = [one_route[0], one_route.slice(-1)[0]]

  var begend = g.selectAll(".begend")
      .data(originANDdestination)
      .enter()
      .append("circle")
      .attr("class", "begend")
      .attr("r", 3)
      .style("fill", "red")
      .style("opacity", 1)

  var text = g.selectAll(".locnames")
      .data(originANDdestination)
      .enter()
      .append("text")
      .attr("class", "locnames")
      .attr("y", -10)
      .style("fill", "black")
      .style("font-size", 9)
      .text(function(d) {
          return d.properties.label
      })

  var text1 = g.selectAll(".locnames1")
      .data(originANDdestination)
      .enter()
      .append("text")
      .attr("class", "locnames1")
      .attr("y", -22)
      .style("fill", "black")
      .style("font-size", 11)
      .style("font-weight", "bold")
      .text(function(d) {
          return d.properties.ServiceNo
      })

  // when the user zooms in or out you need to reset
  // the view
  map.on("zoomend", reset);

  // this puts stuff on the map! 
  reset();
  transition();

  // Reposition the SVG to cover the features.
  function reset() {

    var bounds = d3path.bounds(geoJSON),
                    topLeft = bounds[0],
                    bottomRight = bounds[1];
    //console.log(bounds)            
    // here you're setting some styles, width, heigh etc
    // to the SVG. Note that we're adding a little height and
    // width because otherwise the bounding box would perfectly
    // cover our features BUT... since you might be using a big
    // circle to represent a 1 dimensional point, the circle
    // might get cut off.

    text.attr("transform",
        function(d) {
            return "translate(" +
                applyLatLngToLayer(d).x + "," +
                applyLatLngToLayer(d).y + ")";
        });

    text1.attr("transform",
        function(d) {
            return "translate(" +
                applyLatLngToLayer(d).x + "," +
                applyLatLngToLayer(d).y + ")";
        });


    // for the points we need to convert from latlong
    // to map units
    begend.attr("transform",
        function(d) {
            return "translate(" +
                applyLatLngToLayer(d).x + "," +
                applyLatLngToLayer(d).y + ")";
        });

    ptFeatures.attr("transform",
        function(d) {
            return "translate(" +
                applyLatLngToLayer(d).x + "," +
                applyLatLngToLayer(d).y + ")";
        });

    // again, not best practice, but I'm harding coding
    // the starting point

    //marker.attr("transform",
        //function(d,i) {
            //var y = one_route[i].geometry.coordinates[1]
            //var x = one_route[i].geometry.coordinates[0]
            //return "translate(" +
              //map.latLngToLayerPoint(new L.LatLng(y, x)).x + "," +
              //map.latLngToLayerPoint(new L.LatLng(y, x)).y + ")";
        //});

    // Setting the size and location of the overall SVG container
    svg.attr("width", bottomRight[0] - topLeft[0] + 120)
        .attr("height", bottomRight[1] - topLeft[1] + 120)
        .style("left", topLeft[0] - 50 + "px")
        .style("top", topLeft[1] - 50 + "px");

    // linePath.attr("d", d3path);
    linePath.attr("d", toLine(one_route))
    g.attr("transform", "translate(" + (-topLeft[0] + 50) + "," + (-topLeft[1] + 50) + ")");

  } // end reset

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
  } //end transition

  // this function feeds the attrTween operator above with the 
  // stroke and dash lengths
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
          //t is fraction of time 0-1 since transition began
          var marker = d3.select("#marker");
          
          // p is the point on the line (coordinates) at a given length
          // along the line. In this case if l=50 and we're midway through
          // the time then this would 25.
          var p = linePath.node().getPointAtLength(t * l);

          //Move the marker to that point
          marker.attr("transform", "translate(" + p.x + "," + p.y + ")"); //move marker

          return interpolate(t);
      }
  } //end tweenDash

}


// --------------------------------------------------
// DROPDOWN MENU SELECTION OF BUS ROUTES TO VISUALIZE
function createDropdown() {
  var busServiceNoList = [...new Set(data.map(d=>d.ServiceNo))]

  var menu = d3.select("#Dropdown")
               .attr('class', 'form-group')

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
        .property("selected", function(d){ return d === defaultOptionName; })

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

function clearChart() {
  d3.selectAll('*').transition() //stop the transition
  d3.selectAll('.lineConnect').remove()
  d3.selectAll('.waypoints').remove()
  d3.selectAll('.begend').remove()
  d3.selectAll('.locnames').remove()
  d3.selectAll('.locnames1').remove()
}