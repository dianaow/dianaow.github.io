///////////////////////////////////////////////////////////////////////////
///////////////////////////////// Globals /////////////////////////////////
/////////////////////////////////////////////////////////////////////////// 
var connData, densityData, arcs, all_arcs, bubbles, newCountry, lineGenerator, bounds

var ipadPRO_landscape = Math.min(window.innerWidth, screen.width)>1024 & Math.min(window.innerWidth, screen.width)<=1366 & (Math.abs(screen.orientation.angle == 90))
var ipad_landscape = Math.min(window.innerWidth, screen.width)<=1024 & (Math.abs(screen.orientation.angle == 90))
var ipad_portrait = Math.min(window.innerWidth, screen.width)<=1024 & (Math.abs(screen.orientation.angle == 0))
var laptop = Math.min(window.innerWidth, screen.width) > 1024
var desktop = Math.min(window.innerWidth, screen.width) > 1680
if(ipadPRO_landscape) { console.log('ipadPRO_landscape')}
if(ipad_landscape) { console.log('ipad_landscape')}
if(ipad_portrait) { console.log('ipad_portrait')}
if(laptop) { console.log('laptop')}
if(desktop) { console.log('desktop')}

var canvasDim = { width: window.innerWidth*0.98, height: ipad_portrait ? 400 : window.innerHeight*0.98}
var margin = {top: 0, right: 0, bottom: 0, left: 0}
var width = canvasDim.width - margin.left - margin.right 
var height = canvasDim.height - margin.top - margin.bottom 
var chart = d3.select("#chart")

var centroids = []
var attributeArray = []
var attribute
var NUM_VAR = 2
var newCategory = 'net'
var newYear = 'All'
var DEFAULT_MAP_COLOR = 'black'
var DEFAULT_MAP_STROKE = 'black'
var DEFAULT_PATH_WIDTH = 1
var M = d3.formatPrefix(",.0", 1e6)

var rScale = d3.scaleSqrt()
  .range([0, 50])
  .domain([0, 133980469969])

var lineScale = d3.scaleSqrt()
  .range([0.25, 5])
  .domain([0, 50000000000])

var lineDashedScale = d3.scaleSqrt()
  .range([0.15, 3])
  .domain([0, 50000000000])

var opacityScale = d3.scaleSqrt()
  .range([0.25, 1])
  .domain([0, 50000000000])

var opacityDashedScale = d3.scaleSqrt()
  .range([0.125, 0.5])
  .domain([0, 50000000000])

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// Initialize //////////////////////////////
/////////////////////////////////////////////////////////////////////////// 
var sf = ipad_landscape ? 1.6 : 1

var svg = chart.select("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)

var g = svg.append("g")
  .attr('id', 'zoom-group')
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")scale(" + sf + ")")

map = g.append("g").attr("id", "map")
bubbles = g.append("g").attr("class","bubbles")
arcs = g.append("g").attr("class","arcs")
all_arcs = g.append("g").attr("class","all_arcs")

var stats_perc = d3.select('.stats-perc').append('svg')
  .attr("width", '330px')
  .attr("height", '50px')
      
loadData()

///////////////////////////////////////////////////////////////////////////
////////////////////////////// Generate data //////////////////////////////
///////////////////////////////////////////////////////////////////////////
function loadData() {

  d3.queue()   // queue function loads all external data files asynchronously 
    .defer(d3.json, './data/custom1.geo.json')
    .defer(d3.csv, './data/wn_country_PT.csv')  
    .defer(d3.csv, './data/all_country_PT.csv')  
    .defer(d3.csv, './data/all_country_pctPT.csv')
    .defer(d3.csv, './data/all_country.csv')  
    .defer(d3.csv, './data/countries_ranking.csv')
    .defer(d3.csv, './data/donor_ratio_m.csv')  
    .await(processData);   

}

function processData(error, geoJSON, csv, csv2, csv3, csv4, csv5, csv6) {
  
  if (error) throw error;

  $('#dimmer').dimmer('hide');

  connData = csv 
  densityData = csv2 
  densityPctData = csv3 
  timelineData = csv4
  countriesData = csv5
  heatmapData = csv6

  world = geoJSON.features;  // store the path in variable for ease
  for (var i in connData) {    // for each geometry object
    for (var j in world) {  // for each row in the CSV
      if (world[j].properties.name == connData[i]['country']) {   // if they match
        for (var k in connData[i]) {   // for each column in the a row within the CSV
          world[j].properties[k] = (connData[i][k] != null ? Number(connData[i][k]) : 0)  // add each CSV column key/value to geometry object
        }
        break;  // stop looking through the CSV since we made our match
      } 
    }
  }

  //menu()
  //createLineChart()
  //updateGlobalPanel()
  drawMap(world)
  drawCirclesHeatMap(heatmapData)
  //drawCirclesMap('show_all')
  //drawAllLinksMap(world)

  //var countries = densityData.map(d=>d.country).filter(onlyUnique)
  //var selectedPaths = countriesPaths.filter(d=>countries.indexOf(d.properties.name)!=-1)
  //interactive(selectedPaths)
  //interactive(d3.selectAll(".bubble")) 

  var steps = {
    "step-1": function(){ 
      heatmapData.forEach(d=>{
        d.x = d.country
        d.y = d.group
        d.value = +d.value
        d.r = +d.total
      })

      updateHeatMap(heatmapData, [-1, 0, 1])
      svg.select('defs').remove()
      d3.select('.legendWrapper').remove()
      createGradient([-1,1], '')
    },
    "step-2": function(){ 
      heatmapData.forEach(d=>{
        d.x = d.country
        d.y = d.group
        d.value = +d['donor_growth']
        d.r = +d.total
      })
      drawHeatMap(heatmapData)
      updateHeatMap(heatmapData, [-5, 0, 25])
      svg.select('defs').remove()
      d3.select('.legendWrapper').remove()
      createGradient([-5,25], 'Donor Growth Percentage (%)')
    },
    "step-3": function(){ 
      heatmapData.forEach(d=>{
        d.x = d.country
        d.y = d.group
        d.value = +d['recipient_growth']
        d.r = +d.total
      })
      updateHeatMap(heatmapData, [-5, 0, 25])
      svg.select('defs').remove()
      d3.select('.legendWrapper').remove()
      createGradient([-5,25], 'Recipient Growth Percentage (%)')
    },
  }

  d3.selectAll("a.step-link").on("click", function(d){
    var clickedStep = d3.select(this).attr("id");
    switchTarget(clickedStep);
    switchStep(nextStep());
    
    return false;
  });

  function switchStep(newStep){
    d3.selectAll(".step-link").classed("active", false);
    d3.select("#" + newStep).classed("active", true);
    var action = steps[newStep]
    action();
  }

  function nextStep(){
    var attrID = d3.select(".active").attr("id").split("-")[0]
        activeIndex = +d3.select(".active").attr("id").split("-")[1],
        targetIndex = +d3.select(".target").attr("id").split("-")[1],
        nextIndex = activeIndex + Math.sign(targetIndex - activeIndex);
    
    return (nextIndex == activeIndex) ? false : [attrID, nextIndex].join("-");
  }

  function switchTarget(newStep){
    d3.selectAll(".step-link").classed("target", false);
    d3.select("#" + newStep).classed("target", true);
  }

}

///////////////////////////////////////////////////////////////////////////
////////////////////////// Buttons & Dropdowns ////////////////////////////
///////////////////////////////////////////////////////////////////////////
// RESET
reset = function() {
  resetVar()
  resetActions()
}

function resetVar() {
  newCategory = 'net'
  newYear = 'All'    
  isClicked = false
  countrySearched = false
  $('.dropdown').dropdown('restore defaults')
}

function resetActions() {
  undoMapActions()
  undoPanelActions()
  svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity)
  d3.selectAll(".countryLabel").style('display', 'none') // hide 'tooltip'
  d3.select('.all_arcs').attr('display', 'block')
  d3.select('.arcs').attr('display', 'none')
  drawAllLinksMap(world, 'show_all')
  drawCirclesMap('show_all')
  updateGlobalPanel()
}

// ZOOM
zoomIn = function() {
  zoom.scaleBy(svg.transition().duration(750), 1.3)     
}

zoomOut = function() {
  zoom.scaleBy(svg.transition().duration(750), 0.7)     
}

// TOGGLE
d3.select(".btn-net")
  .on("click", function(d) {
    newCategory = 'net'
    undoMapActions()
    drawCirclesMap('show_country')
    d3.select('.all_arcs').attr('display', 'block')
    d3.select('.arcs').attr('display', 'none')
    setTimeout(function(){
      drawAllLinksMap(world)
      doActions(newCountry)
    }, 250)
  })

d3.select(".btn-source")
  .on("click", function(d) {
    newCategory = 'donor'
    undoMapActions()
    drawCirclesMap('show_country')
    d3.select('.all_arcs').attr('display', 'none')
    d3.select('.arcs').attr('display', 'block')
    setTimeout(function(){
      doActions(newCountry)
    }, 250)
  })

d3.select(".btn-destination")
  .on("click", function(d) {
    newCategory = 'recipient'
    undoMapActions()
    drawCirclesMap('show_country')
    d3.select('.all_arcs').attr('display', 'none')
    d3.select('.arcs').attr('display', 'block')
    setTimeout(function(){
      doActions(newCountry)
    }, 250)
  })

// DROPDOWN MENUS
var isClicked = false
var countrySearched = false
function menu() {

  // 1: Country
  var countries = densityData.map(d=>d.country).filter(onlyUnique)
  countries.unshift("All Countries")
  d3.select(".dropdown-country .menu").selectAll("div")
      .data(countries)
    .enter().append("div")
      .attr('class', 'item')
      .attr("data-value", function (d) { return d })
      .text(function (d) { return d })
    .on("click", function(d) {
      isClicked = true
      countrySearched = true
      d3.selectAll(".countryLabel").style('display', 'none') // hide 'tooltip'
      if(d=='All Countries'){
        drawAllLinksMap(world, 'show_all')
        drawCirclesMap('show_all')
      } else {
        newCountry = d
        doActions(newCountry)
      }
    })

  // 2: Years
  var years = d3.range(1973,2014)
  years.unshift("All Years")
  d3.select(".dropdown-year .menu").selectAll("div")
      .data(years)
    .enter().append("div")
      .attr('class', 'item')
      .attr("data-value", function (d) { return d })
      .text(function (d) { return d })
    .on("click", function(d) {
      if(d=='All Years'){
        newYear = "All"
      } else {
        newYear = d
      }
      d3.selectAll(".countryLabel").style('display', 'none') // hide 'tooltip'
      if(countrySearched==true){
        drawCirclesMap('show_country')
        drawAllLinksMap(world, 'show_country')
        setTimeout(function(){
          doActions(newCountry)
        }, 250)
      } else {
        drawCirclesMap('show_all')
        drawAllLinksMap(world, 'show_all')
      }
    })

}

////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// Interactive map ///////////////////////////////
//////////////////////////////////////////////////////////////////////////////////// 
function interactive(obj) {

  obj
    .on("mousemove", function(d) {
      if(isClicked==false){
        doActions(d.country ? d.country : d.properties.name) 
      } 
    })
    .on("click", function(d) {
      isClicked == false ? isClicked = true : isClicked = false  
      countrySearched == false ? countrySearched = true : countrySearched = false  
      if(isClicked==true){
        doActions(d.country ? d.country : d.properties.name) 
      } else {
        $('.ui.search.dropdown.dropdown-country').dropdown('restore defaults')
        undoMapActions()
        undoPanelActions(d.country ? d.country : d.properties.name)
      }
    })
    .on("mouseout",  function(d) { 
      if(isClicked==false){
        d3.selectAll(".countryLabel").style('visibility', 'hidden') // hide 'tooltip'
        undoMapActions()
        updateGlobalPanel()
      }
    })

}

////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Update panel and map ///////////////////////////////
//////////////////////////////////////////////////////////////////////////////////// 
function doActions(d) {

  newCountry = d // assign new country to global variable
  var attribute = newCategory + '_' + newCountry + '_' + newYear
  updateCountryPanel()

  ////////////////////////////////////// Menu //////////////////////////////////////
  if(countrySearched==true | isClicked==true){
    if(newCategory=='net'){
      d3.select('.ui.btn-net.basic.button').classed('active', true)
      d3.select('.ui.btn-source.basic.button').classed('active', false)
      d3.select('.ui.btn-destination.basic.button').classed('active', false)
    }
    if(newCategory=='donor'){
      d3.select('.ui.btn-net.basic.button').classed('active', false)
      d3.select('.ui.btn-source.basic.button').classed('active', true)
      d3.select('.ui.btn-destination.basic.button').classed('active', false)
    }
    if(newCategory=='recipient'){
      d3.select('.ui.btn-net.basic.button').classed('active', false)
      d3.select('.ui.btn-source.basic.button').classed('active', false)
      d3.select('.ui.btn-destination.basic.button').classed('active', true)
    }

    d3.select('.ui.btn-net.basic.button').style('opacity', 1)
    d3.select('.ui.btn-source.basic.button').style('opacity', 1)
    d3.select('.ui.btn-destination.basic.button').style('opacity', 1)
  }
  ////////////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////// Map ///////////////////////////////////////
  d3.select("#countryLabel" + newCountry).style('visibility', 'visible') // update 'tooltip'
  updateMap(attribute) // Modify color density (in %)
  
  // PATHS : Individual donor/recipient country connectors (Only draw if there is a connection)
  if(newCategory!='net'){
    drawLinksMap(world, attribute) // Modify connector paths opacity on hover
  }

  // PATHS: All total amount country connectors
  if(all_arcs){
    all_arcs.selectAll('path.connector')
      .filter(function(d){ return d.sourceName!=newCountry & d.targetName!=newCountry })
      .attr('opacity', 0)

    all_arcs.selectAll('path.connector')
      .filter(d=> d.sourceName==newCountry | d.targetName==newCountry)
      .attr('opacity', 1)
  }

  // BUBBLES
  bubbles.selectAll('circle')
    .attr('stroke-opacity', d=>d.country == newCountry ? 0.6 : 0) 
    .attr('fill-opacity', d=>d.country == newCountry ? (newCategory=='net' ? 0.1 : 0.6) : 0) // Only show circle of hovered country
  ////////////////////////////////////////////////////////////////////////////////////

}

///////////////////////////////////////////////////////////////////////////
///////////////////////////// Helper functions ////////////////////////////
///////////////////////////////////////////////////////////////////////////
function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}
