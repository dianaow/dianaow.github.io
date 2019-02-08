var data

var mapboxTiles = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
  maxZoom: 25,
  id: 'mapbox.streets',
  accessToken: 'pk.eyJ1IjoiZGlhbmFtZW93IiwiYSI6ImNqcmh4bjkxOTIyeXQzeW1yaXh5Z2F3Y3MifQ.3lc3RHtzIaj9tEm_MyzUeg'
})

var map = L.map('chart')
  .addLayer(mapboxTiles)
  .setView([1.351616, 103.808053], 11); //center the map at singapore

init()

function init() {

  d3.queue()   
    .defer(d3.csv, './data/busroutes.csv')  
    .defer(d3.csv, './data/busstops.csv') 
    .await(createChart);  
}

function createChart(error, csv1, csv2){

  initializeData(csv1, csv2)
  initRoutes()
  leafletChart()
}


// Data formatting
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

  var busstops = csv2.map((d,i) => {
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
