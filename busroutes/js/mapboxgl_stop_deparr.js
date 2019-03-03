var oneGeoJSON = {"type": "FeatureCollection", "features": []}
var stopsGeoJSON_ratio = {"type": "FeatureCollection", "features": []}
var service = []
var latLngs = []
var svc = []
var to_static = true
var Dir1_color = "red"
var Dir2_color = "green"

var percHeightScale = d3.scaleLinear()
  .domain([1, 20000])
  .range([0, 10000])

var radiusScale = d3.scaleLinear()
  .domain([1, 50000])
  .range([2, 20])

var perc = 
  [{group:"~=0-25", color:'#b8deaf'},
   {group:"25-50", color:"#80b99d"},  
   {group:"50-75", color:"#42938a"},
   {group:"75-100", color:"#206a81"}, 
   {group:"More than 100", color:"#263c81"},
   {group:"More than 1000", color:"#000080"},
   {group:"Only departures", color:"orange"}, 
   {group:"Only arrivals", color:"#ee0f7c"},
   {group:"Bus Interchange", color:"yellow"},
   {group:"No travel", color:"white"},
   ]

var percScale = d3.scaleOrdinal()
  .domain(perc.map(d=>d.group))
  .range(perc.map(d=>d.color))

var busIntList = [{"Boon Lay Int":22009}, {"Woodlands Int":46009}, 
  {"Tampines Int": 75009}, {"Bedok Int": 84009}, {"Toa Payoh Int": 52009}, {"Jurong East Int": 28009},
  {"Yishun Int": 59009}, {"Ang Mo Kio Int": 54009}, {"Choa Chu Kang Int": 44009}]

var busIntCoord = [{"Boon Lay Int":[103.705, 1.33932]}, {"Woodlands Int":[103.786, 1.43763]}, 
  {"Tampines Int": [103.943,  1.35408]}, {"Bedok Int": [103.929, 1.32454]}, {"Toa Payoh Int": [103.847, 1.33202]}, 
  {"Jurong East Int": [103.742, 1.33341]}, {"Yishun Int": [103.837, 1.42997]}, {"Ang Mo Kio Int": [103.849, 1.36969]}, {"Choa Chu Kang Int": [103.746, 1.38587]}]

function setOneStopData(id, coordinates){

  d3.csv("./data/bus_" + id.toString() + ".csv", function(csv) {
    var oneStop = csv.map((d,i) => {
      return {
        value: +d.TOTAL_TRIPS,
        BusStopCode: +d.BusStopCode,
        type: d.type,
        description: d.Description,
        lat: +d.Latitude,
        lon: +d.Longitude
      }
    })

    oneStop_nested = d3.nest()
      .key(d=>d.BusStopCode)
      .entries(oneStop)

    oneStop_nested.forEach((d,i)=>{
      d.total = d3.sum(d.values, x=>x.value)
      d.ratio = d.values[1] ? (d.values[1].value/d.values[0].value) * 100 : "NA"
      d.category = d.values[0].type == 'Bus Interchange' ?  "Bus Interchange" : ( d.values[1] ? "" : (d.values[0].type == 'origin' ? "Only departures" : "Only arrivals") )
    })

    // ensure smaller circles are overlaid over the bigger circles
    oneStop_nested.sort(function(x, y){
       return d3.ascending(x.ratio, y.ratio);
    })

    oneStop_nested.map((d,i) => {
      if(d.ratio<=25 & d.ratio>=0){
        d.category = "~=0-25"
      } else if(d.ratio<=50 & d.ratio>25){
        d.category = "25-50"
      } else if(d.ratio<=75 & d.ratio>50){
        d.category = "50-75"
      } else if(d.ratio<=100 & d.ratio>75){
        d.category = "75-100"
      } else if(d.ratio<=1000 & d.ratio>100 ){
        d.category = "More than 100"
      }  else if(d.ratio>1000){
        d.category = "More than 1000"
      }  
    })
    //console.log(oneStop_nested)

    oneGeoJSON.features = []
    // Created stacked extusions
    //oneStop.forEach(function(d) {
      //var origin = oneStop.filter(b=>(b.BusStopCode == d.BusStopCode) & (b.type == 'origin'))
      //var center = [d.lon, d.lat]
      //var radius = 0.05
      //var options = { properties: {
        //height: d.value,
        //base_height: d.type==='origin' ? 0 : (origin.length !=0 ? origin[0].value : 0),
        //color: d.type==='origin' ? 'red' : '#66FF00',
        //id: d.type==='origin' ?  d.BusStopCode + 100000 : d.BusStopCode + 200000,
        //steps: 10,
        //units: 'kilometers'
      //} } 
      //var circle = turf.circle(center, radius, options);
      //oneGeoJSON.features.push(circle)
    //})
    //console.log(oneStop_nested)

    oneStop_nested.forEach(function(d) {
      point = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [d.values[0].lon, d.values[0].lat]
        },
        properties: {
          color: percScale(d.category),
          radius: radiusScale(d.total),
          description: d.values[0].description,
          ratio: d.ratio
        },
        id : d.key
      }
      oneGeoJSON.features.push(point)
    })
    //console.log(oneGeoJSON)
    
    map.getSource('stacked-data').setData(oneGeoJSON);
    
    map.setPaintProperty('stacked', 'circle-radius', ['feature-state', "radius"]) 

    oneGeoJSON.features.forEach(datum => {
      var id = datum.id
      map.setFeatureState({id, source: 'stacked-data' }, { radius: datum.properties.radius, color: datum.properties.color });
      //map.setFeatureState({id, source: 'stacked-data' }, { height: vol_heightScale(datum.properties.height), base_height: vol_heightScale(datum.properties.base_height), color: datum.properties.color });
    })

    map.flyTo({pitch:0,zoom: 11})

    setTimeout(function() {
      map.flyTo({
        zoom: 13,
        center: coordinates,
        bearing: -2.35,
        pitch: 0}) 
    }, 2500)

  })

}

function overlayRoutes(stop) {

  d3.selectAll('*').transition()
  routesGeoJSON.features.map(function(d) {
    if(map.getLayer("route"+d.id)){
      map.removeLayer("route"+d.id).removeSource("route"+d.id)
    }
  })
  
  var svcs_from_int = []
  routesNew.forEach(function(d) {
    if(d.BusStopCode == stop) {
      svcs_from_int.push(d.ServiceNo)
    }
    if(stop=="all"){
      svcs_from_int.push(d.ServiceNo)
    }
  })

  var service = []
  routesNew.forEach(function(d) {
    if(svcs_from_int.indexOf(d.ServiceNo) >= 0) {
      if(!service[d.ServiceNo]) {
        service[d.ServiceNo] = []
        service[d.ServiceNo] = []
        service[d.ServiceNo][0] = []
        service[d.ServiceNo][1] = []
      }
      if(d.lat && d.lon && d.Direction=='1'){
        service[d.ServiceNo][0].push([d.lon,d.lat])
      } else if (d.lat && d.lon && d.Direction=='2'){
        service[d.ServiceNo][1].push([d.lon,d.lat])
      }
    }
  })

  // Create an array of routes where each route is an array of [lat,lon]
  var latLngs = []
  service.forEach(function(route) {
    latLngs.push(route);
  });
  
  var svcs = Object.keys(service)

  routesGeoJSON.features = []
  latLngs.forEach(function(d,i) {
    routesGeoJSON.features.push({
      type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: d[0]
        },
        properties: {direction: "1"},
        id : svcs[i] + "-1"
    });
    routesGeoJSON.features.push({
      type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: d[1]
        },
        properties: {direction: "2"},
        id : svcs[i] + "-2"
    });
  });
  //console.log(routesGeoJSON)

  if (to_static==false) {
    if(map.getLayer("routes")){
      map.removeLayer("routes").removeSource("routes")
    }
    staticRoute()
  } else if (to_static==true) {
    routesGeoJSON.features.map(function(d) {
      if(d.geometry.coordinates.length != 0){
        animateRoute(d)
      }
    })
  }

}

function animateRoute(route) {

  map.addSource("route" + route.id, {
    "type": "geojson",
    "data": route,
    "maxzoom": 20
  });

  map.addLayer({
    "id": "route" + route.id,
    "type": "line",
    "source": "route" + route.id,
    "layout": {
      "line-join": "round",
      "line-cap": "butt"
    },
    "paint": {
      "line-color": [
        "match",
        ['get', 'direction'],
        "1", Dir1_color,
        "2", Dir2_color,
        /* other */ '#ccc'
      ],
      "line-width": {'base': 0.6, 'stops': [[12, 1], [20, 2]]}
    }
  });

  var dashLength = 5;
  var gapLength = 40;

  // We divide the animation up into 40 steps to make careful use of the finite space in
  // LineAtlas
  var steps = 40;
  // A # of steps proportional to the dashLength are devoted to manipulating the dash
  var dashSteps = steps * dashLength / (gapLength + dashLength);
  // A # of steps proportional to the gapLength are devoted to manipulating the gap
  var gapSteps = steps - dashSteps;

  // The current step #
  var step = 0;
  
  setInterval(function() {
      step = step + 1;
      if (step >= steps) step = 0;
  
      var t, a, b, c, d;
      if (step < dashSteps) {
        t = step / dashSteps;
        a = (1 - t) * dashLength;
        b = gapLength;
        c = t * dashLength;
        d = 0;
      } else {
        t = (step - dashSteps) / (gapSteps);
        a = 0;
        b = (1 - t) * gapLength;
        c = dashLength;
        d = t * gapLength;          
      }
      if(map.getLayer("route"+route.id)){
        map.setPaintProperty("route" + route.id, "line-dasharray", [a, b, c, d]);
      }
  }, 50);

}

function staticRoute() {

  d3.selectAll('*').transition()
  routesGeoJSON.features.map(function(d) {
    if(map.getLayer("route"+d.id)){
      map.removeLayer("route"+d.id).removeSource("route"+d.id)
    }
  })

  map.addSource("routes", { type: "geojson", data: routesGeoJSON})
  map.addLayer({
    "id": "routes",
    "type": "line",
    "source": "routes",
    "layout": {
      "line-join": "round",
      "line-cap": "round"
    },
    "paint": {
      "line-opacity": 0.6,
      "line-color": [
        "match",
        ['get', 'direction'],
        "1", Dir1_color,
        "2", Dir2_color,
        /* other */ '#ccc'
      ],
      "line-width": {'base': 0.6, 'stops': [[13, 1], [20, 2]]}
      //"line-dasharray": [10,4]
    }
  })

} 

function toggle() {

  if(to_static==true) {
    staticRoute()
    to_static=false
  } else if (to_static==false) {
    map.removeLayer("routes").removeSource("routes")
    routesGeoJSON.features.map(function(d) {
      if(d.geometry.coordinates.length != 0){
        animateRoute(d)
      }
    })
    to_static=true
  }

}


// --------------------------------------------------
// SELECT AND RENDER PATHS TO-AND-FROM BUS INTERCHANGES
function InterchangeSelect() {

  var menu = d3.select("#interchange-dropdown")
              .attr('class', 'form-group')

  // allows user to select bus service number
  menu.append("select")
    .attr('class', 'interchange-dropdown form-control')
    .attr('onfocus', 'this.size=5')
    .attr('onblur','this.size=1')
    .attr('onchange', 'this.size=1; this.blur();')
    .selectAll("option")
        .data(busIntList.map(d=>Object.keys(d)[0]))
        .enter()
        .append("option")
        .attr("value", d=>d)
        .text(d=>d)
        .property("selected", function(d){ return d === "Woodlands Int" })
        //.each(function(d) {
          //if (d === "Bus Interchange") {
            //d3.select(this).property("disabled", true)
          //}
        //});

  setOneStopData(46009, [103.786, 1.43763])
  overlayRoutes(46009)

  d3.select(".interchange-dropdown").on('change', function(){
    name = d3.select(this).property("value")
    var filtered = busIntList.find(function(itm){
      return Object.keys(itm) == name
    })
    var coordinates = busIntCoord.find(function(itm){
      return Object.keys(itm) == name
    })
    setOneStopData(Object.values(filtered)[0], Object.values(coordinates)[0])
    overlayRoutes(Object.values(filtered)[0])
  });


}



function legend_DepArr() {

  var svg = d3.select('#legend').append("svg").attr("class", 'legend-deparr').attr('height', 160)
  var legend = svg.append('g').attr("class", "g-legend-deparr")

  var radius = 6
  var yscale = d3.scaleLinear()
    .domain([0, perc.length - 1])
    .range([10, 120]);

  perc.forEach(function(d, i) {
    d.x = 10;
    d.y = yscale(i);
  });

  legend.selectAll(".legend-node")
    .data(perc)
    .enter()
    .append("circle")
    .attr("class", "legend-node")
    .attr("cx", d=>d.x)
    .attr("cy", d=>d.y+20)
    .attr("r", radius)
    .style("fill", d=>d.color)

  legend.selectAll(".legend-text")
    .data(perc)
    .enter()
    .append("text")
    .attr("class", "legend-text")
    .attr("x", d=>d.x + (2*radius))
    .attr("y", d=>d.y + 20 + radius/2)
    .style("fill", "white")
    .style("font-size", 10)
    .text(d=>d.group)

  legend
    .append("text")   
    .attr("x", perc[0].x/2)
    .attr("y", perc[0].y + 10)
    .style("fill", "white")
    .style("font-size", 11)
    .style('font-weight', 'bold')
    .text("% of departures/arrivals")

  d3.select("#misc-description").append('p').text('Caution: Route animation results in heavy CPU usage. \
    You may toggle it on/off using the button above')

  d3.select("#misc-description").append('p').text('A Departures/Arrivals percentage of 0 indicates that there are only arrivals. \
    This means that passengers only alighted at this stop, no passengers boarded the bus from there.\
    A higher percentage indicates that more passengers departed than arrived at the stop. \
    The stop was more often a travel origin rather than a destination point.')

}
