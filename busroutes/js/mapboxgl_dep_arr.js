var oneGeoJSON = {"type": "FeatureCollection", "features": []}
var stopsGeoJSON_ratio = {"type": "FeatureCollection", "features": []}

var percHeightScale = d3.scaleLinear()
  .domain([1, 20000])
  .range([0, 10000])

var radiusScale = d3.scaleLinear()
  .domain([1, 50000])
  .range([2, 20])

var perc = 
  [{group:"~=0-25", color:"#9ecae1"},
   {group:"25-50", color:"#4292c6"},  
   {group:"50-75", color:"#08519c"},
   {group:"75-100", color:"#08306b"}, 
   {group:"More than 100", color:"#d6604d"},
   {group:"More than 1000", color:"#b2182b"},
   {group:"Only departures", color:"#E47D06"}, 
   {group:"Only arrivals", color:"#35978f"},
   {group:"Bus Interchange", color:"yellow"}]

var percScale = d3.scaleOrdinal()
  .domain(perc.map(d=>d.group))
  .range(perc.map(d=>d.color))


function initDepArr() {

  d3.csv("./data/departures_vs_arrivals.csv", function(csv) {
    var trips = csv.map((d,i) => {
      return {
        total: +d.TOTAL,
        ratio: +d.RATIO,
        BusStopCode: +d.BusStopCode,
        description: d.Description,
        lat: +d.Latitude,
        lon: +d.Longitude
      }
    })

    trips.sort(function(x, y){
       return d3.descending(x.total, y.total);
    })

    trips.map((d,i) => {
      if(d.ratio<=25 & d.ratio>0){
        d.category = "0-25"
      } else if(d.ratio<=50 & d.ratio>25){
        d.category = "25-50"
      } else if(d.ratio<=75 & d.ratio>50){
        d.category = "50-75"
      } else if(d.ratio<=100 & d.ratio>75){
        d.category = "75-100"
      } else if(d.ratio<=1000 & d.ratio>100 ){
        d.category = "More than 100"
      } else if(d.ratio>1000){
        d.category = "More than 1000"
      } else if(d.ratio=="infinity"){
        d.category = "Only departures"
      } else if(d.ratio==0){
        d.category = "Only arrivals"
      } 
    })

    trips.map((d,i) => {
      if(d.ratio>20000) {
        d.ratio = 20000
      } //else if(d.ratio=="infinity"){
        //d.ratio = 1500
      //} else if(d.ratio==0){
        //d.ratio = 1500
      //} 
    })
    //console.log(trips)
    //percHeightScale.domain(d3.extent(trips.map(d=>d.ratio)))

    stopsGeoJSON_ratio.features = []
    trips.forEach(function(d) {
      var center = [d.lon, d.lat]
      var radius = 0.06
      var options = { properties: {
        height: percHeightScale(d.ratio),
        color: percScale(d.category),
        id: d.BusStopCode,
        steps: 10,
        units: 'kilometers'
      } } 
      var circle = turf.circle(center, radius, options);
      stopsGeoJSON_ratio.features.push(circle)
    })
    
    stopsGeoJSON_ratio.features.forEach((stop) => {
      stop.id = stop.properties.id;
    });

    map.getSource('viz-data').setData(stopsGeoJSON_ratio)
   
    stopsGeoJSON_ratio.features.forEach(datum => {
      var id = datum.id
      map.setFeatureState({id, source: 'viz-data' }, { value: datum.properties.height, color: datum.properties.color });
    }) 

  })

}

function setOneStopData(id){

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
    
    oneStop_nested.forEach(function(d) {
      point = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [d.values[0].lon, d.values[0].lat]
        },
        properties: {
          color: percScale(d.category),
          radius: radiusScale(d.total)
        },
        id : d.key
      }
      oneGeoJSON.features.push(point)
    })
    //console.log(oneGeoJSON)
    
    map.getSource('stacked-data').setData(oneGeoJSON);

    oneGeoJSON.features.forEach(datum => {
      var id = datum.id
      map.setFeatureState({id, source: 'stacked-data' }, { radius: datum.properties.radius, color: datum.properties.color });
      //map.setFeatureState({id, source: 'stacked-data' }, { height: vol_heightScale(datum.properties.height), base_height: vol_heightScale(datum.properties.base_height), color: datum.properties.color });
    })


  })

}

// --------------------------------------------------
// SELECT AND RENDER PATHS TO-AND-FROM BUS INTERCHANGES
function InterchangeSelect() {

  var busIntList = [{"Boon Lay Int":22009}, {"Woodlands Int":46009}, 
  {"Tampines Int": 75009}, {"Bedok Int": 84009}, {"Toa Payoh Int": 52009}, {"Jurong East Int": 28009},
  {"Yishun Int": 59009}, {"Ang Mo Kio Int": 54009}, {"Choa Chu Kang Int": 44009}]

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
        .property("selected", function(d){ return d === "Boon Lay Int" })
        //.each(function(d) {
          //if (d === "Bus Interchange") {
            //d3.select(this).property("disabled", true)
          //}
        //});

  setOneStopData(22009)

  d3.select(".interchange-dropdown").on('change', function(){
    name = d3.select(this).property("value")
    var filtered = busIntList.find(function(itm){
      return Object.keys(itm) == name
    })
    setOneStopData(Object.values(filtered)[0])
  });

}



function legend_DepArr() {

  var svg = d3.select('#legend').append("svg").attr("class", 'legend-deparr')
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


}