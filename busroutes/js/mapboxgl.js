var geoJSON = []
// Create empty array if haven't already done so
if(!geoJSON.features) {
  geoJSON.features = []
}

var arr = []
var defaultOptionName = 851 
const lowerLat = 1.1, upperLat = 1.58, lowerLong = 103.49, upperLong = 104.15; //boundaries of Singapore

mapboxgl.accessToken = 'pk.eyJ1IjoiZGlhbmFtZW93IiwiYSI6ImNqcmh4aWJnOTIxemI0NXA0MHYydGwzdm0ifQ.9HakB25m0HLT-uDY2yat7A';
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v9',
  bounds: [lowerLong, lowerLat, upperLong, upperLat],
  minZoom: 11 
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
          Direction: +d.Direction,
          title: d.ServiceNo.toString()
        }
    });
  });

  geoJSON.type = "FeatureCollection"
} 

function leafletChart(selected) {

  var one_route = geoJSON.features.filter(d=>d.properties.ServiceNo==selected && d.properties.Direction==1)
  //console.log(one_route[0])

  var coordinates = []
  one_route.map(d=>{
    coordinates.push([d.geometry.coordinates[0], d.geometry.coordinates[1]])
  })

  var iPath = turf.linestring(coordinates);

  // Calculate the distance in kilometers between route start/end point.
  var iPathLength = turf.lineDistance(iPath, 'kilometers');
  var iPoint = turf.along(iPath, 0, 'kilometers');

  map.addSource("path" + selected.toString(), {
    "type": "geojson",
    "data": iPath,
    "maxzoom": 20
  });

  map.addLayer({
    "id": "path" + selected.toString(),
    "type": "line",
    "source": "path" + selected.toString(),
    "layout": {
      "line-join": "round",
      "line-cap": "round"
    },
    "paint": {
      "line-color": "#888",
      "line-width": 2
    }
  });

  map.addSource("peep" + selected.toString(), {
    "type": "geojson",
    "data": iPoint,
    "maxzoom": 20
  });

  map.addLayer({
    "id": "peep" + selected.toString(),
    "type": "circle",
    "source": "peep" + selected.toString(),
    "layout": {},
    "paint": {
      "circle-radius": 4
    }
  }); 

  var counter = 0
  function animate() {
    var numSteps = 500; //Change this to set animation resolution
    var timePerStep = 20; //Change this to alter animation speed
    var pSource = map.getSource('peep' + selected.toString());
    var curDistance = counter / numSteps * iPathLength;
    var iPoint = turf.along(iPath, curDistance, 'kilometers');
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

  var selected = defaultOptionName
  arr.push(selected)
  // Run update function when dropdown selection changes
  menu.on('change', function(){

    // Find which bus service was selected from the dropdown
    var selected = d3.select(this)
            .select("select")
            .property("value")
    arr.push(selected)
    leafletChart(selected)
  });
  
  leafletChart(selected)
}

// Function for button to clear chart of all paths and markers
function reset() {
  arr.map(function(d){
    map.removeLayer("peep"+d).removeSource("peep"+d)
    map.removeLayer("path"+d).removeSource("path"+d)
  })
  arr = []
}