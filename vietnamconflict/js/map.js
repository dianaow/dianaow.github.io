var attributeArray = ['1968 May'], currentAttribute = 0, playing = false;
var INTERVAL = 1500

var provinceFontSize = screen.width < 420 ? 14 : (screen.width <= 1024 ? 14 : 12)  

var mapWidth =  screen.width < 420 ? w*0.8 : (screen.width <= 1440 ? w*0.75 : w*0.8),
    mapHeight = screen.width < 420 ? h*0.8 : (screen.width <= 1440 ? h*0.8 : h*0.82)  
    legendFullWidth = 200,
    legendFullHeight = 400;
    descFullWidth = w*0.4,
    descFullHeight = h*0.4;

var margin = {top: 20, right: 20, bottom: 20, left:20},
    width = w*0.9 - margin.left - margin.right,
    height = h*0.9 - margin.top - margin.bottom;

var svg = d3.select("#main-svg")
  .append("svg")
    .attr("width", mapWidth + margin.left + margin.right)
    .attr("height", mapHeight + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

var legendMargin = { top: 10, bottom: 20, left: 130, right: 50 }; // leave room for legend axis
var legendWidth = legendFullWidth - legendMargin.left - legendMargin.right;
var legendHeight = legendFullHeight - legendMargin.top - legendMargin.bottom;

var descMargin = { top: 20, bottom: 20, left: 20, right: 20 }; // leave room for legend axis
var descWidth = descFullWidth - descMargin.left - descMargin.right;
var descHeight = descFullHeight - descMargin.top - descMargin.bottom;

var legendSvg = d3.select('#legend-svg')
                  .append('svg')
                  .attr('width', legendFullWidth)
                  .attr('height', legendFullHeight)

var descSvg = d3.select("#map-misc")
                    .append('svg')
                    .attr('width', descFullWidth)
                    .attr('height', descFullHeight)

var mapWrapper = svg.append("g")
  .attr("class", "mapWrapper")

var descWrapper = descSvg.append("g")
  .attr("class", "descWrapper")

// Define color scale
var colorList = ['#ffffff', '#ff0000']
var maxDeath = 610
var color = d3.scaleLinear()
              .domain([0, maxDeath])
              .range(colorList);

renderMap()

function renderMap() {
  loadData()
  animateMap()
}

function loadData() {

  d3.queue()   // queue function loads all external data files asynchronously 
    .defer(d3.json, './data/vietnam1.json')  // our geometries
    //.defer(d3.csv, './data/deathPercentages_byProvince.csv')  // fatality density by province
    .defer(d3.csv, './data/deathPercentages_byProvince_byTime_PT.csv')  // fatality density by province over time
    .defer(d3.csv, './data/map_description.csv')  // fatality density by province over time
    .await(processData);   // once all files are loaded, call the processData function passing
                           // the loaded objects as arguments
}

function processData(error, vietnam1, data, desc) {
 
  var vietnam = vietnam1.features;  // store the path in variable for ease
  for (var i in vietnam) {    // for each geometry object
    for (var j in data) {  // for each row in the CSV
      if (vietnam[i].properties.VARNAME_1 == data[j]['DEPLOYMENT_PROVINCE']) {   // if they match
        for (var k in data[i]) {   // for each column in the a row within the CSV
          if (k != 'DEPLOYMENT_PROVINCE') {  // let's not add the name or id as props since we already have them
            if(attributeArray.indexOf(k) == -1) { 
               attributeArray.push(k);  // add new column headings to our array for later
            }
            vietnam[i].properties[k] = (data[j][k] != null ? Number(data[j][k]) : 0)  // add each CSV column key/value to geometry object
          } 
        }
        break;  // stop looking through the CSV since we made our match
      } 
    }
  }
  //console.log(vietnam)

  var desc_reformatted = []
  desc.map(d => {
    desc_reformatted.push({[d['Time']]:d['Description']})
  })
  //console.log(desc_reformatted)

  d3.select('#clock').html("1968 May"); // populate the clock initially with the start of the bloodiest year of the war
  drawMap(vietnam, vietnam1, desc_reformatted)

}

function drawMap(vietnam, vietnam1, desc) {

  var projection = d3.geoMercator().fitSize([mapWidth, mapHeight], vietnam1);
  
  var path = d3.geoPath().projection(projection);

  mapWrapper.selectAll(".country")
      .data(vietnam)
      .enter()
      .append("path")
      .attr("class", "country")
      .attr("d", path)
      .style("stroke-width", "1")
      .style("stroke", "black")

  fillColor(vietnam)
  labelProvincesAndDeathCount(vietnam, path)
  showDescription(desc)
  showLegend()

}

function fillColor(data) {

  mapWrapper.selectAll(".country")
     .attr('fill', function(d) {
      if ((d.properties[attributeArray[currentAttribute]]) === undefined) {
        return "#ffffff"
      } else {
        return color(d.properties[attributeArray[currentAttribute]]) 
      }});
}

function labelProvincesAndDeathCount(data, path) {

  mapWrapper.selectAll(".label")
      .data(data)
      .enter()
      .append("text")
        .attr("class", "label")
        .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
        .style("font-size", provinceFontSize)
        .text(function(d) {
          if ((d.properties[attributeArray[currentAttribute]]) === 0) {
            return ""
          } else {
            province = d.properties.VARNAME_1
            deathCount = d.properties[attributeArray[currentAttribute]] 
            return province.concat(" (", deathCount, ")")
          }
        });
}

function showDescription(data) {

  descWrapper.selectAll(".description")
      .data(data)
      .enter()
      .append("text")
        .attr("class", "description")
        .style("text-align", "center")
        .attr("x", 20)
        .attr("y", 20)
        .attr("transform", function(d) { return "translate(" + descMargin.left + "," + descMargin.top + ")" })
        .text(function(d) {
          if ((d[attributeArray[currentAttribute]]) !== undefined) {
            return d[attributeArray[currentAttribute]]
          } 
        })
}

function animateMap() {

  var timer;  // create timer object

  d3.select('#play')  
    .on('click', function() {  // when user clicks the play button
      if(playing == false) {  // if the map is currently playing
        timer = setInterval(function(){   // set a JS interval
          if(currentAttribute < attributeArray.length-1) {  
              currentAttribute +=1;  // increment the current attribute counter
          } else {
              currentAttribute = 0;  // or reset it to zero
          }
          sequenceMap();  // update the representation of the map 
          //sequenceDesc(); // update the description accompanying the map 
          d3.select('#clock').html(attributeArray[currentAttribute]);  // update the clock
        }, INTERVAL);
      
        d3.select(this).html('stop');  // change the button label to stop
        playing = true;   // change the status of the animation
      } else {    // else if is currently playing
        clearInterval(timer);   // stop the animation by clearing the interval
        d3.select(this).html('play');   // change the button label to play
        playing = false;   // change the status again
      }
  });
}


function sequenceMap() {

  mapWrapper .selectAll('.country')
    .transition()  //select all the provinces and prepare for a transition to new values
    .duration(INTERVAL/2)  // give it a smooth time period for the transition
    .attr('fill', function(d) {
      if ((d.properties[attributeArray[currentAttribute]]) === undefined) {
        return "#ffffff"
      } else {
        return color(d.properties[attributeArray[currentAttribute]]) 
      }})

  mapWrapper .selectAll(".label")
    .transition()  
    .duration(INTERVAL/2) 
    .text(function(d) {
      if ((d.properties[attributeArray[currentAttribute]]) === 0) {
        return ""
      } else {
        province = d.properties.VARNAME_1
        deathCount = d.properties[attributeArray[currentAttribute]] 
        return province.concat(" (", deathCount, ")")
      }
    });

  descWrapper.selectAll('.description')
    .transition()  //select all the provinces and prepare for a transition to new values
    .duration(INTERVAL)  // give it a smooth time period for the transition
    .text(function(d) {
      if ((d[attributeArray[currentAttribute]]) !== undefined) {
        return d[attributeArray[currentAttribute]] 
      }
    })
}

function showLegend() {

  // append gradient bar
  var gradient = legendSvg.append('defs')
        .append('linearGradient')
        .attr('id', 'gradient')
        .attr('x1', '0%') // bottom
        .attr('y1', '100%')
        .attr('x2', '0%') // to top
        .attr('y2', '0%')
        .attr('spreadMethod', 'pad');

  // programatically generate the gradient for the legend
  // this creates an array of [pct, colour] pairs as stop
  // values for legend
  var pct = linspace(0, 100, colorList.length).map(function(d) {
      return Math.round(d) + '%';
  });

  var colourPct = d3.zip(pct, colorList);

  colourPct.forEach(function(d) {
      gradient.append('stop')
          .attr('offset', d[0])
          .attr('stop-color', d[1])
          .attr('stop-opacity', 1);
  });

  legendSvg.append('rect')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#gradient)');

  // create a scale and axis for the legend
  var legendScale = d3.scaleLinear()
      .domain([0, maxDeath])
      .range([legendHeight, 0]);

  var legendAxis = d3.axisRight()
      .scale(legendScale)
      .tickValues(d3.range(0, maxDeath, 100))
      .tickFormat(d3.format("d"));

  legendSvg.append("g")
      .attr("class", "legend axis")
      .attr("transform", "translate(" + legendWidth + ", 0)")
      .call(legendAxis);
}

function linspace(start, end, n) {
  var out = [];
  var delta = (end - start) / (n - 1);

  var i = 0;
  while(i < (n - 1)) {
      out.push(start + (i * delta));
      i++;
  }

  out.push(end);
  return out;
}