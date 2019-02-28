var data
var busstops
var map
var arr = []
var stopsGeoJSON = {"type": "FeatureCollection", "features": []}
var routesGeoJSON = {"type": "FeatureCollection", "features": []}

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

var lowerLat = 1.14, upperLat = 1.58, lowerLong = 103.48, upperLong = 104.15; //boundaries of Singapore
var zoom = 11

init()

function showHourlyStats() {
  d3.select("#storymode").style("opacity", 0)
  d3.select("#highlight-interchanges").style("opacity", 1)
  d3.select("#controls").style("opacity", 1)
  d3.select("#select-interchange").style("opacity", 0)
  d3.select(".interchange-dropdown").remove()

  map.setLayoutProperty('stacked', 'visibility', 'none')
  map.setLayoutProperty('viz', 'visibility', 'visible')
  map.flyTo({pitch:50, zoom: 11})

  d3.select("#misc-description").style("opacity", 0)
  d3.select(".legend-deparr").remove()
  if(d3.select('.legend-HourlyStats').empty()) {
    legend_HourlyStats() 
  }
}

function showDeparturesArrivals() {
  d3.select("#storymode").style("opacity", 0)
  d3.select("#highlight-interchanges").style("opacity", 0)
  d3.select("#controls").style("opacity", 0)
  d3.select("#select-interchange").style("opacity", 1)
  
  map.setLayoutProperty('stacked', 'visibility', 'visible')
  map.setLayoutProperty('viz', 'visibility', 'none')
  map.flyTo({pitch:0})
  //initDepArr()
  
  if(d3.select(".interchange-dropdown").empty()) {
    InterchangeSelect()
  }

  d3.select("#misc-description").style("opacity", 1)
  d3.select(".legend-HourlyStats").remove()
  if(d3.select('.legend-deparr').empty()) {
    legend_DepArr() 
  }
}

function init() {

  initMap()
  d3.select("#select-interchange").style("opacity", 0)
  d3.select("#misc-description").style("opacity", 0)

  d3.queue()   
    .defer(d3.csv, './data/busstops.csv')
    .defer(d3.csv, './data/busroutes.csv') 
    .await(createChart);  

}

function createChart(error, csv, csv2){

  initLatLngData(csv)
  initRoutesData(csv2)
  legend_HourlyStats() 

  const timeSelector = document.getElementById("timeSelector")
  const timeValue = document.getElementById("timeValue")
  timeSelector.addEventListener("input", (e) => {
    timeValue.innerHTML = `${e.target.value}:00`
    setData()
    setTimeout(extrude, 100)
  });

  map.on('load', function(csv) {

    // data source cannot be empty array (if required to be empty, put in proper GeoJSON format)
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

    map.addSource('stacked-data', { type: 'geojson', data: oneGeoJSON });
    map.addLayer({
      'id': 'stacked',
      'type': 'circle',
      'source': 'stacked-data',
      "paint": {"circle-opacity": 0.8,
                'circle-color': ['feature-state', 'color'],
                "circle-radius": ["feature-state", "radius"]
      }
    })

    setData()
    setTimeout(extrude, 100)

    // Create a popup, but don't add it to the map yet.
    var popup = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true
    }).setLngLat([(lowerLong+upperLong)/2, upperLat])

    map.on('click', 'viz', function(e) {

      var coordinates = e.features[0].geometry.coordinates.slice();
      var description = e.features[0].properties.description;
      
      // Populate the popup based on the feature found.
      popup.setLngLat(e.lngLat)
      .setHTML(description)
      .addTo(map);
    });
    
    // Change the cursor to a pointer when the mouse is over the states layer.
    map.on('mouseenter', 'viz', function (e) {
      map.getCanvas().style.cursor = 'pointer';
    });
   
    // Change it back to a pointer when it leaves.
    map.on('mouseleave', 'viz', function() {
      map.getCanvas().style.cursor = '';
    })

    // Change the cursor to a pointer when the mouse is over the states layer.
    map.on('mouseenter', 'stacked', function (e) {
      console.log(e.features[0].properties)
      map.getCanvas().style.cursor = 'pointer';
      var coordinates = e.features[0].geometry.coordinates.slice();
      var description = "<span>Ratio: " +  Math.round(e.features[0].properties.ratio,2) + " %</span><br><span>" + e.features[0].properties.description + "</span>"
      
      // Populate the popup based on the feature found.
      popup.setLngLat(e.lngLat)
      .setHTML(description)
      .addTo(map);
    });

    map.on('mouseleave', 'stacked', function() {
      map.getCanvas().style.cursor = '';
    })

  })


}

function initAnimation() {

  var arr = d3.range(5,24,1)
  var counter = 0;
  setInterval(function(){
    if(counter < arr.length){
      timeSelector.value = arr[counter]
      setData()
      //flatten()
      setTimeout(extrude, 50)
      timeValue.innerHTML = `${timeSelector.value}:00`
      counter++;
    }else
      return;
  }, 500);

}

function initMap() {

  mapboxgl.accessToken = 'pk.eyJ1IjoiZGlhbmFtZW93IiwiYSI6ImNqcmh4aWJnOTIxemI0NXA0MHYydGwzdm0ifQ.9HakB25m0HLT-uDY2yat7A';
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v9',
    sprite: "mapbox://sprites/mapbox/bright-v8",
    bounds: [lowerLong, lowerLat, upperLong, upperLat],
    minZoom: zoom,
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
    Description: d.Description,
    //find bus interchanges to place specific styles to them (regex ensures only stops with exact match to "Int" are found)
    interchange: d.Description.match(new RegExp("\\b" + "Int" + "\\b", "g")) ? true : false,
    station: d.Description.match(new RegExp("\\b" + "Stn" + "\\b", "g")) ? true : false 
    }
  })

  busstops.forEach(function(d) {
    var center = [d.lon, d.lat]
    var radius = 0.1
    var options = { properties: {
      busStopCode: d.BusStopCode,
      value: 1,
      color: "#000000",
      description: d.Description
    } }
    var circle = turf.circle(center, radius, options);
    stopsGeoJSON.features.push(circle)
  })

  stopsGeoJSON.features.forEach((stop) => {
    stop.id = stop.properties.busStopCode;
  });
  //console.log(stopsGeoJSON)

}

function setData(){

  const hour = timeSelector.value;
  //console.log(hour)
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
        map.setFeatureState({ id, source: 'viz-data' }, { value: 1, color: "white" });
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
        map.setFeatureState({ id, source: 'viz-data' }, { value: 1, color: "white" });
      } else {
        map.setFeatureState({ id, source: 'viz-data' }, { value: heightScale(datum.value), color: colorScale(datum.category) });
      }
    })
  }

}

var shown = false
function highlight() {

  if(data) {
    if(shown==false) {
      stopsGeoJSON.features.forEach(({ id }) => {
        const datum = data.find(d=>d.BusStopCode==id);
        if (!datum) {
          map.setFeatureState({ id, source: 'viz-data' }, { value: 1, color: "white" });
        } else {
          //console.log(datum.interchange===true ? datum.Description : "")
          //console.log(datum.station===true ? datum.Description : "")
          var condition = datum.interchange===true ? '#3465A8' : (datum.station===true ? '#35978f' : colorScale(datum.category))
          map.setFeatureState({ id, source: 'viz-data' }, { value: heightScale(datum.value), color: condition });
          shown = true
        }
      }) 
    } else if (shown==true) {
      stopsGeoJSON.features.forEach(({ id }) => {
        const datum = data.find(d=>d.BusStopCode==id);
        if (!datum) {
          map.setFeatureState({ id, source: 'viz-data' }, { value: 1, color: "white" });
        } else {
          map.setFeatureState({ id, source: 'viz-data' }, { value: heightScale(datum.value), color: colorScale(datum.category) });
          shown = false 
        }
      })  
    }
  } 
 
}

function legend_HourlyStats() {

  var svg = d3.select('#legend').append("svg").attr("class", 'legend-HourlyStats')
  var legend = svg.append('g').attr("class", "g-legend-HourlyStats")

  var barHeight = 15;
  var barWidth = 20;
  var yscale = d3.scaleLinear()
    .domain([0, vol.length - 1])
    .range([10, 120]);

  vol.forEach(function(d, i) {
    d.x = 10;
    d.y = yscale(i);
  });

  legend.selectAll(".legend-node")
    .data(vol)
    .enter()
    .append("rect")
    .attr("class", "legend-node")
    .attr("x", d=>d.x)
    .attr("y", d=>d.y+barHeight)
    .attr("width", barWidth)
    .attr("height", barHeight)
    .style("fill", d=>d.color)

  legend.selectAll(".legend-text")
    .data(vol)
    .enter()
    .append("text")
    .attr("class", "legend-text")
    .attr("x", d=>d.x + barWidth*1.5)
    .attr("y", d=>d.y + barHeight*1.5)
    .style("fill", "white")
    .style("font-size", 10)
    .text(d=>d.group)

  legend
    .append("text")   
    .attr("x", vol[0].x/2)
    .attr("y", vol[0].y + 10)
    .style("fill", "white")
    .style("font-size", 12)
    .style('font-weight', 'bold')
    .text("Total travel volume")
}

