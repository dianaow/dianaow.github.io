///////////////////////////////////////////////////////////////////////////
///////////////////////////////// Globals /////////////////////////////////
/////////////////////////////////////////////////////////////////////////// 
var connData, densityData, arcs, all_arcs, bubbles, newCountry, lineGenerator, bounds, lineScale

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

var timers = []
var centroids = []
var attributeArray = []
var attribute
var NUM_VAR = 3
var newCategory = 'net'
var newYear = 'All'
var newCountry = 'All'
var DEFAULT_MAP_COLOR = 'black' 
var DEFAULT_MAP_STROKE = 'black'
var DEFAULT_PATH_WIDTH = 1
var M = d3.formatPrefix(",.0", 1e6)
var counter = 0

var rScale = d3.scaleSqrt()
  .range([0, 50])
  .domain([0, 133980469969])

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
bubbles_explore = g.append("g").attr("class","bubbles_explore")
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
    .defer(d3.json, './data/custom.geo.json')
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

  drawMap(world)

  introText()
  menu()
  createLineChart()
  updateGlobalPanel()

  ////////////////////////////////////////////////////////////  
  /////////////////// Initiate Buttons ///////////////////////
  ////////////////////////////////////////////////////////////
  //Order of steps / views
  function order() {
    console.log(counter)
    //Hack to remove all setTimeouts still in play
    var highestTimeoutId = setTimeout(";");
    for (var i = 0 ; i < highestTimeoutId ; i++) {
      clearTimeout(i); 
    }//for
    //Back to beginning
    if(counter == 0) { introText() }
    //Map exploration tool
    if(counter == 1) { exploreBubbleMap() }  
    //Start bubble map
    if(counter == 2) { bubbleMap() } 
    //Transition to heatmap 1
    if(counter == 3) { heatmap1() }
    //Transition to heatmap 2
    if(counter == 4) { heatmap2() }
    //Transition to heatmap 3
    if(counter == 5) { heatmap3() } 
    //Transition to end
    if(counter == 6) { endText() } 
  }

  //De-activate the back button
  d3.select("#clickerBack").classed("inactiveButton",true); 
  d3.select("#clickerBack").classed("activeButton",false);

  //Order of steps when clicking the front button
  d3.select("#clickerFront")      
    .on("click", function(e){
      counter = counter + 1;
      order();    
    });
  //Order of steps when clicking the back button
  d3.select("#clickerBack")      
    .on("click", function(e){
      counter = counter - 1;
      if (counter < 0) counter = 0;
      order();
    });  
  //Go straight to map view
  d3.select("#circle_1")      
    .on("click", function(e){
      counter = 1;
      order();    
    });
  d3.select("#circle_2")    
    .on("click", function(e){
      counter = 2;
      order();    
    });
  d3.select("#circle_3")      
    .on("click", function(e){
      counter = 3;
      order();    
    });
  d3.select("#circle_4")     
    .on("click", function(e){
      counter = 4;
      order();    
    });
  d3.select("#circle_5")     
    .on("click", function(e){
      counter = 5;
      order();    
    });

  function introText() {

    d3.select('.x_axis_heatmap').attr('display', 'none')
    d3.select('.y_axis_heatmap').attr('display', 'none')
    d3.select('.menu').style('display', 'none')
    d3.select('#panel').style('display', 'none')
    d3.select('.all_arcs').attr('display', 'none')
    bubbles_explore.attr('display', 'none')

    d3.select('.subtitle-1').style('display', 'none')
    d3.select('.subtitle-2').style('display', 'none')
    d3.select('.subtitle-3').style('display', 'none')
    
    d3.selectAll('.end').style("visibility","hidden")
    d3.selectAll('.intro').style("visibility","visible")
    
    d3.select("#clickerFront").html("Start");
    d3.select("#clickerFront").classed("activeButton",true);  
    d3.select("#clickerFront").classed("inactiveButton",false);  
    d3.select("#clickerBack").classed("activeButton",false);
    d3.select("#clickerBack").classed("inactiveButton",true);
  }

  function endText() {
    heatmap_to_map_clearance()
    d3.selectAll('.intro').style("visibility","hidden")
    d3.selectAll('.end').style("visibility","visible")

    d3.select("#clickerFront").classed("activeButton",false);  
    d3.select("#clickerFront").classed("inactiveButton",true);
    d3.select("#clickerBack").classed("activeButton",true);  
    d3.select("#clickerBack").classed("inactiveButton",false);
  }

  function bubbleMap(){ 
    heatmap_to_map_clearance()
    drawCirclesHeatMap(heatmapData)
    countries = heatmapData.map(d=>d.country).filter(onlyUnique)
    gridSize = Math.floor(width / countries.length)
    var legendWidth = Math.min(width*0.8, 200);
    var legendsvg = d3.select('.subtitle-legend').append("g")
      .attr("class", "legendWrapper")
      .attr("transform", "translate(" + (legendWidth/2+150).toString() + "," + 35 + ")");
    createGradient(legendsvg, legendWidth, [-1,1], '')
    d3.select('.menu').style('display', 'none')
    d3.select('#panel').style('display', 'none')
    d3.select('.all_arcs').attr('display', 'none')
    interactive(bubbles_explore.selectAll(".bubble"), 'static') 
    bubbles_explore.attr('display', 'none')
    bubbles.attr('display', 'block')
    d3.select('.title').style('display', 'block')

    d3.select("#clickerFront").html("Continue");
    d3.select("#clickerFront").classed("activeButton",true);  
    d3.select("#clickerFront").classed("inactiveButton",false);
    d3.select("#clickerBack").classed("activeButton",true);  
    d3.select("#clickerBack").classed("inactiveButton",false);
  }

  function heatmap1(){ 
    map_to_heatmap_clearance()
    drawHeatMap(heatmapData, [-1, 0, 1], 'value')
    var legendWidth = Math.min(width*0.8, 400);
    var legendsvg = gHeatMap.append("g")
      .attr("class", "legendWrapper")
      .attr("transform", "translate(" + (gridSize * countries.length)/2 + "," + (-80) + ")");
    createGradient(legendsvg, legendWidth, [-1,1], '')
    d3.select('.subtitle-5').style('display', 'none')
    d3.select('.subtitle-6').style('display', 'none')
    d3.select('.subtitle-4')
      .style('display', 'block')
      .style('opacity', 0)
      .transition().duration(500).delay(500)
      .style('opacity', 1)

    d3.select("#clickerFront").html("Continue");
    d3.select("#clickerFront").classed("activeButton",true);  
    d3.select("#clickerFront").classed("inactiveButton",false);
    d3.select("#clickerBack").classed("activeButton",true);  
    d3.select("#clickerBack").classed("inactiveButton",false);
  }
    
  function heatmap2(){ 
    map_to_heatmap_clearance()
    drawHeatMap(heatmapData, [-2, 0, 2], 'donor_growth')
    var legendWidth = Math.min(width*0.8, 400);
    var legendsvg = gHeatMap.append("g")
      .attr("class", "legendWrapper")
      .attr("transform", "translate(" + (gridSize * countries.length)/2 + "," + (-80) + ")");
    createGradient(legendsvg, legendWidth, [-2,2], 'Donor Growth Percentage (%)')
    d3.select('.subtitle-4').style('display', 'none')
    d3.select('.subtitle-6').style('display', 'none')
    d3.select('.subtitle-5')
      .style('display', 'block')
      .style('opacity', 0)
      .transition().duration(500)
      .style('opacity', 1)

    d3.select("#clickerFront").html("Continue");
    d3.select("#clickerFront").classed("activeButton",true);  
    d3.select("#clickerFront").classed("inactiveButton",false);
    d3.select("#clickerBack").classed("activeButton",true);  
    d3.select("#clickerBack").classed("inactiveButton",false);
  }

  function heatmap3(){
    map_to_heatmap_clearance()
    drawHeatMap(heatmapData, [-2, 0, 2], 'recipient_growth')
    var legendWidth = Math.min(width*0.8, 400);
    var legendsvg = gHeatMap.append("g")
      .attr("class", "legendWrapper")
      .attr("transform", "translate(" + (gridSize * countries.length)/2 + "," + (-80) + ")");
    createGradient(legendsvg, legendWidth, [-2,2], 'Recipient Growth Percentage (%)')
    d3.select('.subtitle-4').style('display', 'none')
    d3.select('.subtitle-5').style('display', 'none')
    d3.select('.subtitle-6')
      .style('display', 'block')
      .style('opacity', 0)
      .transition().duration(500)
      .style('opacity', 1)

    d3.select("#clickerFront").html("Finish");
    d3.select("#clickerFront").classed("activeButton",true);  
    d3.select("#clickerFront").classed("inactiveButton",false);
    d3.select("#clickerBack").classed("activeButton",true);  
    d3.select("#clickerBack").classed("inactiveButton",false);
  }

  function exploreBubbleMap(){ 
    heatmap_to_map_clearance()
    d3.select('.title').style('display', 'none')
    d3.select('.subtitle-1').style('display', 'none')
    d3.select('.subtitle-2').style('display', 'none')
    d3.select('.subtitle-3').style('display', 'none')

    drawCirclesMap(densityData, 'show_all')
    bubbles_explore.attr('display', 'block')
    d3.select('.subtitle-1')
      .style('display', 'block')
      .style('opacity', 0)
      .transition().duration(500)
      .style('opacity', 1)
    setTimeout(function() {
      drawAllLinksMap(world, 'show_all')
      var countries = densityData.map(d=>d.country).filter(onlyUnique)
      var selectedPaths = countriesPaths.filter(d=>countries.indexOf(d.properties.name)!=-1)
      interactive(selectedPaths, 'explore')
      interactive(bubbles_explore.selectAll(".bubble"), 'explore') 
      d3.select('.menu').style('display', 'block')
      d3.select('#panel').style('display', 'block')
      d3.select('.all_arcs').attr('display', 'block')
      d3.select('.subtitle-2')
        .style('display', 'block')
        .style('opacity', 0)
        .transition().duration(500)
        .style('opacity', 1)
    }, 2000)  

    d3.select("#clickerFront").html("Continue");
    d3.select("#clickerFront").classed("activeButton",true);  
    d3.select("#clickerFront").classed("inactiveButton",false);
    d3.select("#clickerBack").classed("activeButton",true);  
    d3.select("#clickerBack").classed("inactiveButton",false);
  }
 
  function heatmap_to_map_clearance() {
    d3.select('.subtitle-4').style('display', 'none')
    d3.select('.subtitle-5').style('display', 'none')
    d3.select('.subtitle-6').style('display', 'none')
    d3.selectAll('.intro').style("visibility","hidden")
    d3.selectAll('.end').style("visibility","hidden")
    d3.select('#heatmap').style('display', 'none')
    map.attr('display', 'block')
    svg.select('defs').remove()
    d3.select('.legendWrapper').remove()
    d3.select('.x_axis_heatmap').attr('display', 'none')
    d3.select('.y_axis_heatmap').attr('display', 'none')
    bubbles.attr('display', 'none')
  }

  function map_to_heatmap_clearance() {
    d3.select('.title').style('display', 'none')
    d3.select('.subtitle-1').style('display', 'none')
    d3.select('.subtitle-2').style('display', 'none')
    d3.select('.subtitle-3').style('display', 'none')
    d3.selectAll('.intro').style("visibility","hidden")
    d3.selectAll('.end').style("visibility","hidden")
    d3.select('#heatmap').style('display', 'block')
    map.attr('display', 'none')
    bubbles.selectAll('.bubble').interrupt()
    timers.forEach(timer=>{
      clearTimeout(timer)
      timer = 0
    })
    svg.select('defs').remove()
    d3.select('.legendWrapper').remove()
    bubbles.attr('display', 'block')
    d3.select('.x_axis_heatmap').attr('display', 'block')
    d3.select('.y_axis_heatmap').attr('display', 'block')
    d3.select('.menu').style('display', 'none')
    d3.select('#panel').style('display', 'none')
    d3.select('.all_arcs').attr('display', 'none')
    bubbles_explore.attr('display', 'none')
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
  newCountry = 'All'
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
  drawCirclesMap(densityData, 'show_all')
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
    drawCirclesMap(densityData, 'show_country')
    d3.select('.all_arcs').attr('display', 'block')
    d3.select('.arcs').attr('display', 'block')
    setTimeout(function(){
      drawAllLinksMap(world, 'show_country')
      doActions(newCountry)
    }, 250)
  })

d3.select(".btn-source")
  .on("click", function(d) {
    newCategory = 'donor'
    undoMapActions()
    drawCirclesMap(densityData, 'show_country')
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
    drawCirclesMap(densityData, 'show_country')
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
        drawCirclesMap(densityData, 'show_all')
      } else {
        newCountry = d
        drawCirclesMap(densityData, 'show_country')
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
        drawCirclesMap(densityData, 'show_country')
        drawAllLinksMap(world, 'show_country')
        setTimeout(function(){
          doActions(newCountry)
        }, 250)
      } else {
        drawCirclesMap(densityData, 'show_all')
        drawAllLinksMap(world, 'show_all')
      }
    })

}

////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// Interactive map ///////////////////////////////
//////////////////////////////////////////////////////////////////////////////////// 
function interactive(obj, step) {

  if(step=='explore'){
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
          drawCirclesMap(densityData, 'show_all')
        }
      })
  }

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
  d3.select("#countryLabel" + newCountry.replace(/[^A-Z0-9]+/ig, "")).style('visibility', 'visible') // update 'tooltip'
  updateMap(attribute) // Modify color density (in %)
  
  // PATHS : Individual donor/recipient country connectors (Only draw if there is a connection)
  if(newCategory!='net'){
    drawLinksMap(world, attribute) // Modify connector paths opacity on hover
  }

  // PATHS: All total amount country connectors
  if(all_arcs){
    all_arcs.selectAll('path.connector')
      .filter(function(d){ 
        return d.sourceName!=newCountry & d.targetName!=newCountry })
      .attr('opacity', 0)

    all_arcs.selectAll('path.connector')
      .filter(d=> d.sourceName==newCountry | d.targetName==newCountry)
      .attr('opacity', 1)
  }

  // BUBBLES
  bubbles_explore.selectAll('circle')
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
