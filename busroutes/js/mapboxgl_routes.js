// --------------------------------------------------
// RENDER AND ANIMATE PATH ALONG A BUS ROUTE
function initRoutesData(csv){

  routes = csv.map((d,i) => {
    return {
    BusStopCode: +d.BusStopCode,
    StopSequence: +d.StopSequence,
    ServiceNo: +d.ServiceNo,
    Direction: d.Direction,
    Description: d.Description
    }
  })

  routesNew = routes.map((d,i) => {
    return Object.assign({}, d, busstops.find(b=>b.BusStopCode===d.BusStopCode)||{});
  })
  //console.log(routesNew)

  createDropdown()

}

function renderOneRoute(params) {

  var selected = params.serviceNum.toString() + "-" + params.direction.toString()
  arr.push(selected)
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
    var curDistance = counter / numSteps * iPathLength;
    var iPoint = turf.along(iPath, curDistance, {units: 'kilometers'});

    map.getSource('peep' + selected).setData(iPoint);

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

  var menu = d3.select("#dropdown")
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
  //console.log(arr)
  d3.selectAll('*').transition()
  arr.map(function(d){
    map.removeLayer("peep"+d).removeSource("peep"+d)
    map.removeLayer("path"+d).removeSource("path"+d)
  })
  arr = []
}