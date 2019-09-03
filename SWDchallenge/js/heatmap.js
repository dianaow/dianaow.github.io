///////////////////////////////////////////////////////////////////////////
/////////////////////////////////// HEAT MAP //////////////////////////////
///////////////////////////////////////////////////////////////////////////
var colorScale, countScale, xScaleHeatMap, yScaleHeatMap, yearGroups, countries, g_circles
var gridSize
var render = 0
var xScaleHeatMap = d3.scaleBand()
var yScaleHeatMap = d3.scaleBand()
var margin = {
  top: 200,
  right: 0,
  bottom: 0,
  left: 350
};

var width = window.innerWidth*0.98 - margin.left - margin.right - 20
var gHeatMap = d3.select('#heatmap')
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", window.innerHeight*0.58 + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Draw density circles on map ////////////////////////
//////////////////////////////////////////////////////////////////////////////////// 
function drawCirclesHeatMap(data) {

  yearGroups = data.map(d=>d.group).filter(onlyUnique)

  colorScale = d3.scaleLinear()
    .domain([-1, 0, 1])
    .range(['#70CACB', '#E3E5E5', '#FDB715']);

  var rScale1 = d3.scaleSqrt()
    .range([0, 50])
    .domain([0, 5100000000])

  var bubbleData = []
  data.map((d,i)=>{
    var c = centroids.find(c => c.name == d.country)
    if(c) {
      bubbleOne = {
        index: d.index,
        group: d.group,
        color: colorScale(+d.value),
        value: +d.total,
        country: d.country,
        x: c.x,   
        y: c.y,
        r: rScale1(+d.total),
        strokeColor: 'white'
      }
      bubbleData.push(bubbleOne)
    }
  })
  bubbleData = bubbleData.sort(function(a, b){ return d3.ascending(+a['group'], +b['group']) })

  var nested_data = d3.nest()
    .key(d=>d.country)
    .sortValues(function(a,b) { return b.r - a.r; })
    .entries(bubbleData)

  var maxBubbles = []
  nested_data.map(d=>{
    maxBubbles.push({country: d.values[0].country, r: d.values[0].r, x: d.values[0].x, y: d.values[0].y})
  })
  var newCentroids = runSimulation(maxBubbles)

  bubbleData.map((d,i) => {
    d.x = newCentroids.find(c=>c.country == d.country).x
    d.y = newCentroids.find(c=>c.country == d.country).y
  })

  yearGroups = [
  ['1973-1976'], 
  ['1973-1976', '1977-1980'], 
  ['1973-1976', '1977-1980', '1981-1984'],
  ['1973-1976', '1977-1980', '1981-1984', '1985-1988'],
  ['1973-1976', '1977-1980', '1981-1984', '1985-1988', '1989-1992'],
  ['1973-1976', '1977-1980', '1981-1984', '1985-1988', '1989-1992','1993-1996'],
  ['1973-1976', '1977-1980', '1981-1984', '1985-1988', '1989-1992','1993-1996', '1997-2000'],
  ['1973-1976', '1977-1980', '1981-1984', '1985-1988', '1989-1992','1993-1996', '1997-2000', '2001-2004'],
  ['1973-1976', '1977-1980', '1981-1984', '1985-1988', '1989-1992','1993-1996', '1997-2000', '2001-2004', '2005-2008'],
  ['1973-1976', '1977-1980', '1981-1984', '1985-1988', '1989-1992','1993-1996', '1997-2000', '2001-2004', '2005-2008', '2009-2013']
  ]

  yearGroups.map((arr,i)=>{
    layer(arr, i)
  })

  d3.select('.subtitle-1').style('display', 'none')
  d3.select('.subtitle-2').style('display', 'none')
  d3.select('.subtitle-3')
    .style('display', 'block')
    .style('opacity', 0)
    .transition().duration(500).delay(500)
    .style('opacity', 1)

  function layer(arr,i) {
    var timer = setTimeout(function() {
      bubbleData_filt = bubbleData.filter(d=>arr.indexOf(d.group) != -1)
      d3.select('.title h2').html('Average commitment amount donated/received')  
      d3.select('.title p').html('(in constant USD') 
      d3.select('.title h1').html(arr[arr.length-1])
      updateCircles(bubbleData_filt, 'initial_map') 
    }, 800*(i+1))
    timers.push(timer)
  }

}

function updateCircles(data, transitionType) {

  circles = bubbles.selectAll("g.nodegroup").data(data, d=>d.index)

  var entered_circles = circles.enter().append("g")
    .attr('class', 'nodegroup')

  entered_circles.append("circle").attr('class', 'bubble')
    .attr('transform', d=>'translate(' + d.x + "," + d.y + ")")

  if(transitionType=='initial_map'){
    circles.merge(entered_circles).select('.bubble')   
      .transition().duration(750)
      .attr('id', d=>'bubble' + d.index)
      .attr('transform', d=>'translate(' + d.x + "," + d.y + ")")
      .attr('r', d=>d.r)
      .attr('stroke', d=>d.strokeColor)
      .attr('stroke-opacity', 1)
      .attr('fill', function(d) { return d.color })
      .attr('fill-opacity', 1)     
  }
  if(transitionType=='map_to_heatmap'){
    circles.merge(entered_circles).select('.bubble')   
      .transition().duration(2000) 
      .attr('id', d=>'bubble' + d.country)
      .attr('transform', d=>'translate(' + d.x + "," + ((yearGroups.length * gridSize)-gridSize)*2 + ")")
      .attr('stroke', d=>d.strokeColor)
      .attr('stroke-opacity', 1)
      .attr('fill', function(d) { return d.color })
      .attr('fill-opacity', 1)
      //.transition().duration(500)
      //.attr('fill-opacity', 0)
      .transition().duration(2000)
      .attr('r', d=>d.r)
      .attr('transform', d=>'translate(' + d.x + "," + d.y + ")") 
      .attr('fill-opacity', 1)     
  }
  if(transitionType=='heatmap_to_heatmap'){
    circles.merge(entered_circles).select('.bubble')   
      .transition().duration(2000) 
      .attr('id', d=>'bubble' + d.country)
      .attr('transform', d=>'translate(' + d.x + "," + d.y + ")")
      .attr('r', d=>d.r)
      .attr('stroke', d=>d.strokeColor)
      .attr('stroke', 'none')
      .attr('stroke-opacity', 1)
      .attr('fill', function(d) { return d.color })
      .attr('fill-opacity', 1)
      .transition().duration(1000) 
      .attr('transform', d=>'translate(' + d.x + "," + d.y + ")")      
  }

  circles.exit().remove()

}

function updateLabels(data) {

  // append country labels below their respective bubble
  var countryLabels = map.selectAll(".countryLabel").data(data, d=>d.country)

  var entered_labels = countryLabels.enter().append("g")

  entered_labels.merge(countryLabels)
     .attr("class", "countryLabel")
     .attr("id", function(d) { return "countryLabel" + d.country })
     .attr("transform", function(d) {
        return (
           "translate(" + d.x + "," + (d.y+rScale(d.value)+10).toString() + ")" // centroid of countries
        );
     })

  entered_labels.append("text")
    .merge(countryLabels.select("text"))
     .attr("class", "countryName")
     .style("text-anchor", "middle")
     .attr("dx", 0)
     .attr("dy", 0)
     .attr('font-size', '12px')
     .attr('font-weight', 'bold')
     .attr('fill', 'white')
     .text(function(d) { return d.country.toUpperCase() })
     .call(getTextBox)
  
  // add a background rectangle the same size as the text
  countryLabels
     .insert("rect", "text")
     .attr("class", "countryBg")
     .attr('z-index', 999)
     .attr("transform", function(d) {
        return "translate(" + (d.bbox.x - 2) + "," + d.bbox.y + ")";
     })
     .attr("width", function(d) {
        return d.bbox.width + 4;
     })
     .attr("height", function(d) {
        return d.bbox.height;
     })

}

function drawHeatMap(data, RANGE, COLUMN) {

  yearGroups = data.map(d=>d.group).filter(onlyUnique)
  countries = data.map(d=>d.country).filter(onlyUnique)

  gridSize = Math.floor(width / countries.length)

  xScaleHeatMap = xScaleHeatMap
    .domain(countries)
    .range([0, (countries.length * gridSize)])

  yScaleHeatMap = yScaleHeatMap
    .domain(yearGroups)
    .range([0, (yearGroups.length * gridSize)])

  var xAxis = d3.axisBottom(xScaleHeatMap)
    .tickSize(0)
    .tickValues(xScaleHeatMap.domain())

  if(render==0){
    const xaxis = gHeatMap.append('g')
      .attr('class', 'x_axis_heatmap')
      .attr("transform", "translate(" + 0 + "," + ((yearGroups.length*gridSize)).toString() + ")")
      .attr('display', 'block')
      .call(xAxis)
      .call(g => {
        g.selectAll("text")
          .style("text-anchor", "start")
          .attr("transform", d=> `translate(${-xScaleHeatMap.bandwidth()/2}, 0)rotate(50)`) 
          .attr('fill', 'white')
        g.select(".domain").remove()
      })

   }

  if(render==0){
    const yaxis = gHeatMap.append('g')
      .attr('class', 'y_axis_heatmap')
      .attr("transform", "translate(" + 0 + "," + (yScaleHeatMap.bandwidth()/2-gridSize/2).toString() + ")")
      .attr('display', 'block')

    const dayLabels = yaxis.selectAll(".dayLabel")
        .data(yearGroups)
        .enter().append("text")
          .attr('class', 'dayLabel')
          .text(function (d) { return d; })
          .attr("x", -15)
          .attr("y", (d, i) => (i * gridSize))
          .attr('fill', 'white')
          .style("text-anchor", "end")
  } 

  colorScale = d3.scaleLinear()
    .domain(RANGE)
    .range(['#70CACB', '#E3E5E5', '#FDB715']);

  function chooseColors(d) {
    if(d[COLUMN]=='NA'){
      return '#000'
    } else if(+d[COLUMN]<=2) {
      return colorScale(+d[COLUMN]) 
    } else {
      return '#FDB715'
    }
  }

  data.forEach(d=>{
    d.x = xScaleHeatMap(d.country)+margin.left
    d.y = yScaleHeatMap(d.group)+margin.top
    d.r = gridSize/2
    d.color = COLUMN=='value' ? colorScale(+d[COLUMN]): chooseColors(d)
    d.strokeColor = 'none'
  })

  if(render==0){
    console.log('map_to_heatmap')
    updateCircles(data, 'map_to_heatmap')
    render+=1
  } else {
    console.log('heatmap_to_heatmap')
    updateCircles(data, 'heatmap_to_heatmap')
  }

}

///////////////////////////////////////////////////////////////////////////
//////////////// Create the gradient for the legend ///////////////////////
///////////////////////////////////////////////////////////////////////////
function createGradient(RANGE, TEXT) {

  const countScale = d3.scaleLinear() //Extra scale since the color scale is interpolated
    .domain(RANGE)
    .range([0, width])

  //Calculate the variables for the temp gradient
  var numStops = 10;
  countRange = countScale.domain();
  countRange[2] = countRange[1] - countRange[0];
  countPoint = [];
  for(var i = 0; i < numStops; i++) {
    countPoint.push(i * countRange[2]/(numStops-1) + countRange[0]);
  }//for i

  //Create the gradient
  svg.append("defs")
    .append("linearGradient")
    .attr("id", "legend-traffic")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "100%").attr("y2", "0%")
    .selectAll("stop") 
    .data(d3.range(numStops))                
    .enter().append("stop") 
    .attr("offset", function(d,i) { 
      return countScale( countPoint[i] )/width;
    })   
    .attr("stop-color", function(d,i) { 
      return colorScale( countPoint[i] ); 
    });

  drawLegend(RANGE, TEXT)
}

///////////////////////////////////////////////////////////////////////////
////////////////////////// Draw the legend ////////////////////////////////
///////////////////////////////////////////////////////////////////////////
function drawLegend(RANGE, TEXT) {

  var legendWidth = Math.min(width*0.8, 400);
  //Color Legend container
  var legendsvg = gHeatMap.append("g")
    .attr("class", "legendWrapper")
    .attr("transform", "translate(" + (gridSize * countries.length)/2 + "," + (-80) + ")");

  //Draw the Rectangle
  legendsvg.append("rect")
    .attr("class", "legendRect")
    .attr("x", -legendWidth/2)
    .attr("y", 0)
    //.attr("rx", hexRadius*1.25/2)
    .attr("width", legendWidth)
    .attr("height", 10)
    .style("fill", "url(#legend-traffic)");
    
  //Append title
  legendsvg.append("text")
    .attr("class", "legendTitle")
    .attr("x", 0)
    .attr("y", -10)
    .style("text-anchor", "middle")
    .attr('fill', 'white')
    .style('font-size', '18px')
    .text(TEXT);

  if(TEXT==''){
    //Append legend label
    legendsvg.append("text")
      .attr("class", "legendTitleRight")
      .attr("x", legendWidth/2+10)
      .attr("y", 8)
      .style("text-anchor", "start")
      .attr('fill', 'white')
      .style('font-size', '10px')
      .text('Country only gave aid');

    //Append legend label
    legendsvg.append("text")
      .attr("class", "legendTitleLeft")
      .attr("x", -legendWidth/2-10)
      .attr("y", 8)
      .style("text-anchor", "end")
      .attr('fill', 'white')
      .style('font-size', '10px')
      .text('Country only received aid');

    legendsvg.append("text")
      .attr("class", "legendTitleMiddle")
      .attr("x", 0)
      .attr("y", -24)
      .style("text-anchor", "middle")
      .attr('fill', 'white')
      .style('font-size', '10px')
      .text('Country did not');
 
    legendsvg.append("text")
      .attr("class", "legendTitleMiddle")
      .attr("x", 0)
      .attr("y", -12)
      .style("text-anchor", "middle")
      .attr('fill', 'white')
      .style('font-size', '10px')
      .text('donate/receive any aid');

   }

  if(TEXT!=''){
    //Append legend label
    legendsvg.append("text")
      .attr("class", "legendTitleRight")
      .attr("x", legendWidth/2+10)
      .attr("y", 8)
      .style("text-anchor", "start")
      .attr('fill', 'white')
      .style('font-size', '10px')
      .text('Greater than or equal');

    //Append legend label
    legendsvg.append("text")
      .attr("class", "legendTitleLeft")
      .attr("x", -legendWidth/2-10)
      .attr("y", 8)
      .style("text-anchor", "end")
      .attr('fill', 'white')
      .style('font-size', '10px')
      .text('Less than or equal');
   }

  //Set scale for x-axis
  var xScale = d3.scaleLinear()
     .range([-legendWidth/2, legendWidth/2])
     .domain(RANGE);

  //Define x-axis
  var xAxis = d3.axisBottom()
      .ticks(5)
      //.tickFormat(formatPercent)
      .scale(xScale);

  //Set up X axis
  legendsvg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + (10) + ")")
    .call(xAxis);

}

function runSimulation(data) {

  ////////////////////////////////////////////////////////////////////////////////////
  // Run force simulation to modify country centroid positions to prevent overlap of bubbles
  var simulation = d3.forceSimulation()  
    //.force('charge', d3.forceManyBody())
    .force("collide", d3.forceCollide().radius(function(d) {
      return d.r+2.5
    }))
    .stop()

  simulation
    .nodes(data)
    .force('x', d3.forceX().strength(1).x(function(d) { 
      var c = centroids.find(c => c.name == d.country)
      return c? c.x : 0
    }))
    .force('y', d3.forceY().strength(1).y(function(d) { 
      var c = centroids.find(c => c.name == d.country)
      return c? c.y : 0
    }))

  simulation.alpha(1).restart()
  for (var i = 0; i < 200; ++i) simulation.tick() // start simulation 'in the background' to update node positions before render
  ////////////////////////////////////////////////////////////////////////////////////

  return data
}