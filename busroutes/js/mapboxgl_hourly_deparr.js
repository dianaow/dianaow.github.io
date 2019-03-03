var busstopsOrig

var radiusScale1 = d3.scaleSqrt()
  .range([0, 10])
  .domain([0, 50000])

function renderDepArr() {

  d3.queue()   
    .defer(d3.csv, './data/busstops.csv')
    .await(initDepArr)

}

function initDepArr(error, csv) {

  busstopsOrig = csv.map((d,i) => {
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

  const timeSelector = document.getElementById("timeSelector")
  const timeValue = document.getElementById("timeValue")
  timeSelector.addEventListener("input", (e) => {
    timeValue.innerHTML = `${e.target.value}:00`
    setDepArrData()
  });

  setDepArrData()
}

function setDepArrData() {

  const hour = timeSelector.value;
  //console.log(hour)
  d3.csv("./data/origin_destination_" + hour.toString() + ".csv", function(csv) {
    var trips = csv.map((d,i) => {
      return {
        BusStopCode: +d.BusStopCode,
        ratio: +d.RATIO,
        total: +d.TOTAL
      }
    })

    trips = trips.map((d,i) => {
      return Object.assign({}, d, busstopsOrig.find(b=>b.BusStopCode===d.BusStopCode)||{});
    })

    trips.sort(function(x, y){
       return d3.descending(x.total, y.total);
    })

    trips.map((d,i) => {
      if(d.interchange==true){
        d.category = "Bus Interchange"
      } else if(d.ratio<=25 & d.ratio>0){
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
      } else if(d.ratio==0 && d.total!=0){
        d.category = "Only arrivals"
      } else if(d.ratio=="inf"){
        d.category = "Only departures"
      } else if(d.total===0){
        d.category = "No travel"
      }

    })
    //console.log(trips)
    //trips = trips.filter(d=>busIntList.map(d=>Object.values(d)[0]).indexOf(d.BusStopCode)<0)
    console.log(d3.max(trips.map(d=>d.total)))

    trips.forEach(function(d) {
      point = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [d.lon, d.lat]
        },
        properties: {
          color: percScale(d.category),
          radius: d.interchange==true ? 5 : radiusScale1(d.total),
          description: d.Description,
          ratio: d.ratio
        },
        id : d.BusStopCode
      }
      stopsGeoJSON_ratio.features.push(point)
    })
    //console.log(stopsGeoJSON_ratio)


    d3.selectAll('*').transition()
    routesGeoJSON.features.map(function(d) {
      if(map.getLayer("route"+d.id)){
        map.removeLayer("route"+d.id).removeSource("route"+d.id)
      }
    })
    if(map.getLayer("routes")){
      map.removeLayer("routes").removeSource("routes")
    }

    map.getSource('stacked-data').setData(stopsGeoJSON_ratio)

    // make circles larger as the user zooms from z12 to z22
    //map.setPaintProperty('stacked', 'circle-radius', {'base': 1.8, 'stops': [[12, 2], [18, 120]]})

    stopsGeoJSON_ratio.features.forEach(datum => {
      var id = datum.id
      map.setFeatureState({id, source: 'stacked-data' }, { radius: datum.properties.radius, color: datum.properties.color });
    }) 

    //overlayRoutes("all")

  })

}