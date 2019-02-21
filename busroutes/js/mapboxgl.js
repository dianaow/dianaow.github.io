var data
var busstops
var map
var stopsGeoJSON = {}
if(!stopsGeoJSON.features) {
  stopsGeoJSON.features = []
}

var heightScale = d3.scaleLinear()
  .domain([1, 250000])
  .range([0, 10000])

var vol = 
  [{group:"0-2000", color:"#fee0d2"}, 
   {group:"2000-4000", color:"#fcbba1"},
   {group:"4000-8000", color:"#fc9272"}, 
   {group:"8000-16000", color:"#fb6a4a"},
   {group:"16000-32000", color:"#ef3b2c"},
   {group:"32000-64000", color:"#cb181d"},
   {group:"64000-128000", color:"#a50f15"},
   {group:"more than 128000", color:"#67000d"},
   ]

var colorScale = d3.scaleOrdinal()
  .domain(vol.map(d=>d.group))
  .range(vol.map(d=>d.color))

init()

function init() {

  initMap()

  d3.queue()   
    .defer(d3.csv, './data/busstops.csv')
    .defer(d3.csv, './data/busroutes.csv') 
    .await(createChart);  
}

function createChart(error, csv, csv2){

  initLatLngData(csv)
  initRoutesData(csv2)
  
  const timeSelector = document.getElementById("timeSelector")
  const timeValue = document.getElementById("timeValue")
  timeSelector.addEventListener("input", (e) => {
    timeValue.innerHTML = `${e.target.value}:00`
    setData()
    setTimeout(extrude, 100)
  });

  map.on('load', function(csv) {

    map.addSource('viz-data', { type: 'geojson', data: stopsGeoJSON });
    map.addLayer({
      'id': 'viz',
      'type': 'fill-extrusion',
      'source': 'viz-data',
      "paint": {"fill-extrusion-opacity": 0.8,
                'fill-extrusion-color': ['feature-state', 'color'],
                "fill-extrusion-height": ["feature-state", "value"],
                "fill-extrusion-height-transition": {duration: 500, delay: 0}
      }
    })
    setData()
    setTimeout(extrude, 100)

  })

}

function initAnimation() {

  var arr = d3.range(6,8,1)
  var counter = 0;
  setInterval(function(){
    if(counter < arr.length){
      timeSelector.value = arr[counter]
      setData()
      //flatten()
      setTimeout(extrude, 100)
      counter++;
    }else
      return;
  }, 1000);

}

function initMap() {

  const lowerLat = 1.14, upperLat = 1.58, lowerLong = 103.45, upperLong = 104.15; //boundaries of Singapore
  mapboxgl.accessToken = 'pk.eyJ1IjoiZGlhbmFtZW93IiwiYSI6ImNqcmh4aWJnOTIxemI0NXA0MHYydGwzdm0ifQ.9HakB25m0HLT-uDY2yat7A';
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v9',
    bounds: [lowerLong, lowerLat, upperLong, upperLat],
    minZoom: 11,
    bearing:  -2.35,
    pitch: 50
  })
}

function initLatLngData(csv){

  busstops = csv.map((d,i) => {
    return {
    BusStopCode: +d.BusStopCode,
    lat: +d.Latitude,
    lon: +d.Longitude,
    RoadName: d.RoadName,
    Description: d.Description
    }
  })

  busstops.forEach(function(d) {
    var center = [d.lon, d.lat]
    var radius = 0.1
    var options = { properties: {
      busStopCode: d.BusStopCode,
      value: 1,
      color: "#000000"
    } }
    var circle = turf.circle(center, radius, options);
    stopsGeoJSON.features.push(circle)
  })
  stopsGeoJSON.type = "FeatureCollection"

  stopsGeoJSON.features.forEach((stop) => {
    stop.id = stop.properties.busStopCode;
  });
  //console.log(stopsGeoJSON)
  
}

function initRoutesData(csv){

  routes = csv.map((d,i) => {
    return {
    BusStopCode: +d.BusStopCode,
    StopSequence: +d.StopSequence,
    ServiceNo: +d.ServiceNo,
    Direction: +d.Direction
    }
  })

  routesNew = routes.map((d,i) => {
    return Object.assign({}, d, busstops.find(b=>b.BusStopCode===d.BusStopCode)||{});
  })
  //console.log(routesNew)

  createDropdown()

}

function setData(){

  const hour = timeSelector.value;
  console.log(hour)
  d3.csv("./data/origin_destination_" + hour.toString() + ".csv", function(csv) {
    var trips = csv.map((d,i) => {
      return {
        BusStopCode: +d.BusStopCode,
        value: +d.TOTAL_TRIPS,
        hour: +d.TIME_PER_HOUR
      }
    })

    data = trips.map((d,i) => {
      return Object.assign({}, d, busstops.find(b=>b.BusStopCode===d.BusStopCode)||{});
    })

    data.map((d,i) => {
      if(d.value<=2000){
        d.category = "0-2000"
      } else if(d.value>2000 & d.value<=4000){
        d.category = "2000-4000"
      } else if(d.value>4000 & d.value<=8000){
        d.category = "4000-8000"
      } else if(d.value>8000 & d.value<=16000){
        d.category = "8000-16000"
      } else if(d.value>16000 & d.value<=32000){
        d.category = "16000-32000"
      } else if(d.value>32000 & d.value<=64000){
        d.category = "32000-64000"
      } else if(d.value>64000 & d.value<=128000){
        d.category = "64000-128000"
      } else if(d.value>128000){
        d.category = "more than 128000"
      }
    })
    //console.log(data)

  }) 

}

function flatten() {

  if(data){
    stopsGeoJSON.features.forEach(({ id }) => {
      const datum = data.find(d=>d.BusStopCode==id);
      if (!datum) {
        map.setFeatureState({ id, source: 'viz-data' }, { value: 1, color: "#000000" });
      } else {
        map.setFeatureState({ id, source: 'viz-data' }, { value: 1, color: colorScale(datum.category) });
      }
    })
  }

}

function extrude() {

  if(data){
    stopsGeoJSON.features.forEach(({ id }) => {
      const datum = data.find(d=>d.BusStopCode==id);
      if (!datum) {
        map.setFeatureState({ id, source: 'viz-data' }, { value: 1, color: "#000000" });
      } else {
        map.setFeatureState({ id, source: 'viz-data' }, { value: heightScale(datum.value), color: colorScale(datum.category) });
      }
    })
  }

}

// --------------------------------------------------
// RENDERS AND ANIMATE PATH ALONG A BUS ROUTE
function renderOneRoute(params) {

  var selected = params.serviceNum.toString() + "-" + params.direction.toString()
  var one_route = routesNew.filter(d=>d.ServiceNo==params.serviceNum && d.Direction==params.direction)
  //console.log(one_route[0])

  var coordinates = []
  one_route.map(d=>{
    coordinates.push([d.lon, d.lat])
  })

  iPath = {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: coordinates
    }
  }
  //var iPath = turf.lineString(coordinates)
  var iPathLength = turf.length(iPath, {units: 'kilometers'}) // Calculate the distance in kilometers between route start/end point
  var iPoint = turf.along(iPath, 0, {units: 'kilometers'})
 
  map.addSource("path" + selected, {
    "type": "geojson",
    "data": iPath,
    "maxzoom": 20
  });

  map.addLayer({
    "id": "path" + selected,
    "type": "line",
    "source": "path" + selected,
    "layout": {
      "line-join": "round",
      "line-cap": "round"
    },
    "paint": {
      "line-color": "#888",
      "line-width": 2
    }
  });

  map.addSource("peep" + selected, {
    "type": "geojson",
    "data": iPoint,
    "maxzoom": 20
  });

  map.addLayer({
    "id": "peep" + selected,
    "type": "circle",
    "source": "peep" + selected,
    "layout": {},
    "paint": {
      "circle-radius": 4
    }
  }); 

  var counter = 0
  function animate() {
    var numSteps = 500; //Change this to set animation resolution
    var timePerStep = 20; //Change this to alter animation speed
    var pSource = map.getSource('peep' + selected);
    var curDistance = counter / numSteps * iPathLength;
    var iPoint = turf.along(iPath, curDistance, {units: 'kilometers'});
  
    pSource.setData(iPoint);

    if (counter < numSteps) {
      requestAnimationFrame(animate)
    }
    counter = counter + 1;

  }

  document.getElementById('replay').addEventListener('click', function() {
    counter = 0; // Reset the counter
    animate()
  })

  animate()

}

// --------------------------------------------------
// DROPDOWN MENU SELECTION OF BUS ROUTES TO VISUALIZE
function createDropdown() {

  var defaultServiceNum = 851
  var defaultDirection = 1
  var busServiceNoList = [...new Set(routes.map(d=>d.ServiceNo))]
  busServiceNoList.unshift("Bus Service No.")

  var menu = d3.select("#Dropdown")
              .attr('class', 'form-group')
              //.attr('transform', 'translate(100, 200)')

  // allows user to select bus service number
  menu.append("select")
    .attr('class', 'dropdown1 form-control')
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
    .attr('class', 'dropdown2 form-control')
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
    renderOneRoute({serviceNum:serviceNum, direction:direction})

  });

  d3.select(".dropdown2").on('change', function(){
    direction = d3.select(this).property("value")
    renderOneRoute({serviceNum:serviceNum, direction:direction})

  });
}

// Function for button to clear chart of all paths and markers
function reset() {
  arr.map(function(d){
    map.removeLayer("peep"+d).removeSource("peep"+d)
    map.removeLayer("path"+d).removeSource("path"+d)
  })
  arr = []
}