///////////////////////////////////////////////////////////////////////////
/////////////////////////////////// HEAT MAP //////////////////////////////
///////////////////////////////////////////////////////////////////////////
var colorScale, countScale, xScaleHeatMap, yScaleHeatMap, yearGroups, countries, g_circles
var gridSize = 24

var xScaleHeatMap = d3.scaleBand()
var yScaleHeatMap = d3.scaleBand()

////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Draw density circles on map ////////////////////////
//////////////////////////////////////////////////////////////////////////////////// 
function drawCirclesHeatMap(data) {

  colorScale = d3.scaleLinear()
    .domain([-1, 0, 1])
    .range(['#FDB715', '#E3E5E5', '#70CACB']);

  var rScale1 = d3.scaleSqrt()
    .range([0, 50])
    .domain([0, 5100000000])

  var bubbleData = []
  data.map((d,i)=>{
    var c = centroids.find(c => c.name == d.country)
    if(c) {
      bubbleOne = {
        group: d.group,
        colorValue: +d.value,
        value: +d.total,
        country: d.country,
        x: c.x,   
        y: c.y
      }
      bubbleData.push(bubbleOne)
    }
  })
  bubbleData = bubbleData.sort(function(a, b){ return d3.ascending(+a['group'], +b['group']) })
  console.log(bubbleData)

  circles = bubbles.selectAll("g.nodegroup").data(bubbleData, d=>d.country)

  var entered_circles = circles.enter().append("g")
    .attr('class', 'nodegroup')
    .attr('transform', d=>'translate(' + d.x + "," + d.y + ")")

  entered_circles.append("circle").attr('class', 'bubble')

  circles.merge(entered_circles).select('.bubble')         
    .attr('id', d=>'bubble' + d.country)
    .transition().duration(300) 
    .attr('r', d=>rScale1(d.value))
    .attr('stroke', 'none')
    .attr('stroke-opacity', 1)
    .attr('fill', function(d) { return colorScale(d.colorValue) })
    .attr('fill-opacity', 0.6)

  circles.exit().remove()

  // append country labels below their respective bubble
  var countryLabels = map.selectAll(".countryLabel").data(bubbleData, d=>d.country)

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

function drawHeatMap(data) {

  yearGroups = data.map(d=>d.group).filter(onlyUnique)
  countries = data.map(d=>d.country).filter(onlyUnique)

  xScaleHeatMap = xScaleHeatMap
    .domain(countries)
    .range([0, (countries.length * gridSize)])

  yScaleHeatMap = yScaleHeatMap
    .domain(yearGroups)
    .range([0, (yearGroups.length * gridSize)])

  var xAxis = d3.axisBottom(xScaleHeatMap)
    .tickSize(0)
    .tickValues(xScaleHeatMap.domain())

  const xaxis = g.append('g')
    .attr('class', 'x_axis')
    .attr("transform", "translate(" + 0 + "," + (yearGroups.length * gridSize) + ")")
    .call(xAxis)
    .call(g => {
      g.selectAll("text")
        .style("text-anchor", "start")
        .attr("transform", d=> `translate(${-xScaleHeatMap.bandwidth()/2}, 0)rotate(50)`) 
        .attr('fill', 'white')
      g.select(".domain").remove()
    })    

  const yaxis = g.append('g')
    .attr('class', 'y_axis')
    .attr("transform", "translate(" + 0 + "," + yScaleHeatMap.bandwidth()/2 + ")")

  const dayLabels = yaxis.selectAll(".dayLabel")
      .data(yearGroups)
      .enter().append("text")
        .attr('class', 'dayLabel')
        .text(function (d) { return d; })
        .attr("x", -15)
        .attr("y", (d, i) => (i * gridSize))
        .attr('fill', 'white')
        .style("text-anchor", "end")

  g_circles = g.append('g')
    .attr('class', 'g_circles')
    .attr("transform", "translate(" + 0 + "," + 0 + ")")

  updateHeatMap(data, [-1, 0, 1])

}

function updateHeatMap(data, RANGE) {

  colorScale = d3.scaleLinear()
    .domain(RANGE)
    .range(['#FDB715', '#E3E5E5', '#70CACB']);

  const cards = g_circles.selectAll(".hour").data(data, (d) => d.index);

  cards.append("title");

  cards.enter().append("circle")
      .attr("cx", function(d) { return xScaleHeatMap(d.x) })
      .attr("cy", function(d) { return yScaleHeatMap(d.y) })
      .attr("r", function(d) { return 10 })
      .attr("class", "hour bordered")
      .attr("width", gridSize)
      .attr("height", gridSize)
      .style("fill", function(d) { return colorScale(d.value) })
    .merge(cards)
      .transition()
      .duration(1000)
      .style("fill", (d) => colorScale(d.value))

  cards.exit().remove();

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
  var legendsvg = g.append("g")
    .attr("class", "legendWrapper")
    .attr("transform", "translate(" + (gridSize * countries.length)/2 + "," + (gridSize * yearGroups.length + 120) + ")");

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
    .text(TEXT);

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