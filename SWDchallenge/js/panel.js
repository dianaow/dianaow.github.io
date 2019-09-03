///////////////////////////////////////////////////////////////////////////
//////////////////////////////// Panel elements ///////////////////////////
///////////////////////////////////////////////////////////////////////////
function updateGlobalPanel(){

  d3.select('.country-name').html('Global')

  var count_donor = d3.sum(densityData.filter(d=>d.category == 'donor'), d=>d['All'])
  var count_recipient = d3.sum(densityData.filter(d=>d.category == 'recipient'), d=>d['All'])
  var total = count_donor+count_recipient

  d3.select('.statistic.stats-sum > .value').html("$ " + M(total))

  //d3.select('.stats-perc').style('opacity', 0)
  d3.select('.country-ratio').style('opacity', 0)

  var barData = [
   {category: 'donor', perc: 8},
   {category: 'recipient', perc: 8}
  ]
  barChart(barData, "no_label")

  lineData = timelineData.filter(d=>(d.country == "All") & (d.year != "All")) 
  //lineData = timelineData.filter(d=>(d.country == "All") & (d.year != "All") & (d.category == "donor")) // both donor and recipient line will overlap, so only one line is required
  //lineData.map(d=>{
    //d.category = 'net'
  //})
  var maxY = d3.max(lineData, d=>d.sum)
  multipleLineChart(lineData, 30000000000)

}

function updateCountryPanel(){

  d3.select('.country-name').html(newCountry) // Country name

  var count_donor = densityData.find(d=>(d.country == newCountry) & (d.category == 'donor'))
  var count_recipient = densityData.find(d=>(d.country == newCountry) & (d.category == 'recipient'))
  var count_donor_value = count_donor ? +count_donor[newYear] : 0
  var count_recipient_value = count_recipient ? +count_recipient[newYear] : 0
  var total = count_donor_value+count_recipient_value

  // Total amount received and donated (update based on country and year selected)
  d3.select('.statistic.stats-sum > .value')
    .attr('id', newCategory)
    .html("$ " + M(total))

  // Within country: proportion of donors vs recipients (update based on country and year selected)
  var wn_country_perc = count_donor_value/total * 100
  $('#ratio').progress({percent: wn_country_perc}) 

  // Global density: proportion of donors vs recipients 
  var perc_donor = densityPctData.find(d=>(d.country == newCountry) & (d.category == 'donor')) 
  var perc_recipient = densityPctData.find(d=>(d.country == newCountry) & (d.category == 'recipient'))
  var perc_donor_value = perc_donor ? +perc_donor[newYear] : 0
  var perc_recipient_value = perc_recipient ? +perc_recipient[newYear] : 0
  var barData = [
   {category: 'donor', perc: Math.round(parseFloat(perc_donor_value)*100)/100},
   {category: 'recipient', perc: Math.round(parseFloat(perc_recipient_value)*100)/100}
  ]
  barChart(barData, 'show_label')

  //d3.select('.stats-perc').style('opacity', 1)
  d3.select('.country-ratio').style('opacity', 1)

  //d3.select('.statistic.perc_recipient > .value')
    //.attr('id', newCategory)
    //.html((Math.round(parseFloat(perc_recipient_value)*100)/100).toString() + " %") 

  //d3.select('.statistic.perc_donor > .value')
    //.attr('id', newCategory)
    //.html((Math.round(parseFloat(perc_donor_value)*100)/100).toString() + " %")

  lineData = timelineData.filter(d=>(d.country == newCountry) & (d.year != "All"))
  multipleLineChart(lineData, 12000000000)

}

function undoMapActions() {

  countriesPaths.attr('fill', DEFAULT_MAP_COLOR) // reset map color

  bubbles_explore.selectAll('circle')
    .attr('stroke-opacity', 1)
    .attr('fill-opacity', newCategory=='net' ? 0.1 : 0.6) // show bubble chart again

  arcs.selectAll('path').remove() // remove all connector paths
  arcs.selectAll('path.line-dashed').interrupt() // stop all animations

  if(countrySearched==false){
    all_arcs.selectAll('path.connector').attr('opacity', function(d) { return opacityScale(d.value) })
  }
  
}

function undoPanelActions() {

  d3.select('.ui.btn-net.basic.button').style('opacity', 0)
  d3.select('.ui.btn-source.basic.button').style('opacity', 0)
  d3.select('.ui.btn-destination.basic.button').style('opacity', 0)

}

///////////////////////////////////////////////////////////////////////////
//////////////////////////////// Line chart ///////////////////////////////
///////////////////////////////////////////////////////////////////////////
function createLineChart(g) {

  // 2. Create chart dimensions
  var axisPad = 6
  dimensions = {
    width: 330,
    height: 250,
    margin: {
      top: 15,
      right: 15,
      bottom: 40,
      left: 50,
    },
  }

  dimensions.boundedWidth = dimensions.width
    - dimensions.margin.left
    - dimensions.margin.right
  dimensions.boundedHeight = dimensions.height
    - dimensions.margin.top
    - dimensions.margin.bottom

  // 3. Draw canvas
  var wrapper = d3.select('.countries-content').append('svg')
    .attr("width", dimensions.width)
    .attr("height", dimensions.height)

  bounds = wrapper.append("g")
    .attr("class","timeline")
    .attr('transform', "translate(" + dimensions.margin.left + "," + dimensions.margin.top + ")")

  bounds.append("g").attr("class", "x_axis")
  bounds.append("g").attr("class", "y_axis")
  mouseG = bounds.append("g").attr("class", "mouse-over-effects")

  tooltip = d3.select('body').append("div")
    .attr('id', 'tooltip')
    .style('position', 'absolute')
    .style("background-color", "black")
    .style('padding', 6)
    .style('display', 'none')

  // 4. Create scales
  xScaleLine = d3.scaleBand()
    .domain(d3.range(1973, 2014))
    .range([0, dimensions.boundedWidth])
    .padding(0.1)

  // 6. Draw peripherals

  var ticks = xScaleLine.domain().filter((d,i)=>{ return !(i%5) } ) // only show tick labels for the first bidding exercise of the year
  const xAxisGenerator = d3.axisBottom()
    .scale(xScaleLine)
    .tickSizeOuter(0)
    .tickValues(ticks)

  xAxis = d3.select('.x_axis')
    .call(xAxisGenerator)
    .style("transform", `translateY(${ dimensions.boundedHeight }px)`)
    .call(g => {
      g.selectAll("text").attr('fill', 'white')
      g.selectAll("line").attr('stroke', 'white')
      g.select(".domain")
        .attr('stroke', 'white')
        .attr('stroke-width', 0.7)
        .attr('opacity', 0.3)
    })      

  yScaleLine = d3.scaleLinear()
    .domain([0, 30000000000])
    .range([dimensions.boundedHeight, 0]);

  yAxisGenerator = d3.axisLeft()
    .ticks(6)
    .tickSize(-dimensions.boundedWidth)
    .tickFormat(d=>"$" + M(d))
    .tickSizeOuter(0)
    .scale(yScaleLine)

  lineGenerator = d3.line()
    //.defined(d => !isNaN(+d.sum))
    .x(d => xScaleLine(d.year) + xScaleLine.bandwidth() / 2)
    .y(d => yScaleLine(+d.sum))

  // CREATE HOVER TOOLTIP WITH VERTICAL LINE //
  mouseG.append("path") // create vertical line to follow mouse
    .attr("class", "mouse-line")
    .style("stroke", "#A9A9A9")
    .style("stroke-width", '1px')
    .style("opacity", "0")

  mouseG.append('svg:rect') // append a rect to catch mouse movements
    .attr('class', 'dummy_rect')
    .attr('width', dimensions.boundedWidth) 
    .attr('height', dimensions.boundedHeight)
    .attr('fill', 'none')
    .attr('pointer-events', 'all')

}

function multipleLineChart(data, maxY) {
  
  yScaleLine.domain([0, maxY])
  const yAxis = d3.select('.y_axis')
    .call(yAxisGenerator)
    .call(g => {
      g.selectAll("text").attr('fill', 'white')
      g.selectAll("line")
        .attr('stroke', 'white')
        .attr('stroke-width', 0.7) // make horizontal tick thinner and lighter so that line paths can stand out
        .attr('opacity', 0.3)
      g.select(".domain").remove()
    }) 

  var res_nested = d3.nest() // necessary to nest data so that keys represent each category
    .key(d=>d.category)
    .entries(data)

  var glines = bounds.selectAll('.line-group').data(res_nested)

  var entered_lines = glines.enter().append('g').attr('class', 'line-group') 

  entered_lines.append('path').attr('class', 'line') 

  glines.merge(entered_lines).select('.line')  
    //.transition().duration(500) 
    .attr('d', function(d) { return lineGenerator(d.values) })
    .style('stroke', (d, i) => newCountry=='All' ? 'white' :colors[d.key])
    .style('fill', 'none')
    .style('opacity', 1)
    .style('stroke-width', 1)

  glines.exit().remove()

  mouse = mouseG.selectAll('.mouse-per-line').data(res_nested)

  var entered_mouse = mouse.enter().append("g")
    .attr("class", "mouse-per-line")

  entered_mouse.append("circle")

  mouse.merge(entered_mouse).select('circle')         
    .attr("r", 4)
    .style("stroke", function (d) { return colors[d.key] })
    .style("fill", "none")
    .style("stroke-width", '1px')
    .style("opacity", "0");

  mouse.exit().remove()

  d3.select('.dummy_rect')
    .on('mouseout', function () { // on mouse out hide line, circles and text
      d3.select(".mouse-line")
        .style("opacity", "0");
      d3.selectAll(".mouse-per-line circle")
        .style("opacity", "0");
      d3.selectAll(".mouse-per-line text")
        .style("opacity", "0");
      d3.selectAll("#tooltip")
        .style('display', 'none')
    })
    .on('mouseover', function () { // on mouse in show line, circles and text
      d3.select(".mouse-line")
        .style("opacity", "1");
      d3.selectAll(".mouse-per-line circle")
        .style("opacity", "1");
      d3.selectAll("#tooltip")
        .style('display', 'block')
    })
    .on('mousemove', function () { // update tooltip content, line, circles and text when mouse moves
      var mouse = d3.mouse(this) // detect coordinates of mouse position within svg rectangle created within mouseG
      var xDate = scaleBandPosition(mouse) // None of d3's ordinal (band/point) scales have the 'invert' method to to get date corresponding to distance of mouse position relative to svg, so have to create my own method
      d3.selectAll(".mouse-per-line")
        .attr("transform", function (d, i) {
          var bisect = d3.bisector(function (d) { return d.year}).left // retrieve row index of date on parsed csv
          var idx = bisect(d.values, xDate)
          d3.select(".mouse-line")
            .attr("d", function () {
              var data = "M" + (xScaleLine(d.values[idx].year) + 2).toString() + "," + dimensions.boundedHeight;
              data += " " + (xScaleLine(d.values[idx].year) + 2).toString() + "," + 0;
              return data;
            });
          return "translate(" + (xScaleLine(d.values[idx].year) + 2).toString() + "," + yScaleLine(d.values[idx].sum) + ")";
        });
      newYear = xDate
      bubbles_explore.selectAll('.bubble').interrupt()
      setTimeout(function() { drawCirclesMap(densityData, 'show_all') }, 200)
      drawAllLinksMap(world, 'show_all')
      updateTooltipContent(mouse, res_nested)
      $('.dropdown-year').dropdown('set selected', newYear);
    })

}

///////////////////////////////////////////////////////////////////////////
////////////////////////////////// Bar chart //////////////////////////////
///////////////////////////////////////////////////////////////////////////
function barChart(data, label) {

  var xScale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, 300])
    
  var yScale = d3.scaleBand()
    .domain(['donor', 'recipient'])
    .range([0, 50])  
    .padding(0.1)  

  var rects = stats_perc.selectAll('g').data(data) 

  const entered_rects = rects.enter().append('g')

  entered_rects.merge(rects)
     .attr("transform", function(d) {
        return "translate(" + 60 + "," + yScale(d.category) + ")" 
     })

  rects.exit().remove()

  entered_rects.append('rect')
    .merge(rects.select("rect"))
    .attr('class', 'bar')
    .attr('id', function(d) { return "bar-" + d.category })
    .attr("fill", d=>colors[d.category])
    .attr("height", yScale.bandwidth())
    .attr("width", function(d) { return xScale(d.perc) })

  entered_rects.append("text")
    .merge(rects.select("text"))
     .attr('class', 'rectLabel')
     .attr('id', function(d) { return "rectLabel-" + d.category })
     .attr("dx", d=>xScale(d.perc)+10)
     .attr("dy", yScale.bandwidth()/2)
     .attr('font-size', '8px')
     .attr('font-weight', 'bold')
     .attr('alignment-baseline', 'middle')
     .attr('fill', d=>colors[d.category])
     .text(function(d) { return label=='show_label' ? d.perc + '%' : ''})

  var axis = stats_perc.selectAll('g.axis').data(data) 

  const entered_axis = axis.enter().append('g').attr('class', 'axis')

  entered_axis.merge(axis)
     .attr("transform", function(d) {
        return "translate(" + 0 + "," + yScale(d.category) + ")" 
     })

  axis.exit().remove()

  entered_axis.append("text")
    .merge(axis.select("text.axisLabel"))
     .attr('class', 'axisLabel')
     .attr('id', function(d) { return "axisLabel-" + d.category })
     .attr("x", 0)
     .attr("y", yScale.bandwidth()/2)
     .attr('font-size', '8px')
     .attr('font-weight', 'bold')
     .attr('alignment-baseline', 'middle')
     .attr('fill', d=>colors[d.category])
     .text(function(d) { return d.category })

}

///////////////////////////////////////////////////////////////////////////
///////////////////////////// Helper functions ////////////////////////////
///////////////////////////////////////////////////////////////////////////
function updateTooltipContent(mouse, res_nested) {

  sortingObj = []
  res_nested.map(d => {
    xDate = scaleBandPosition(mouse)
    var bisect = d3.bisector(function (d) { return d.year }).left
    var idx = bisect(d.values, xDate)
    sortingObj.push({key: d.values[idx].category, sum: d.values[idx].sum})
  })

  sortingObj.sort(function(x, y){ return d3.descending(x.sum, y.sum)})
  var sortingArr = sortingObj.map(d=> d.key)
  var res_nested1 = res_nested.slice().sort(function(a, b){
    return sortingArr.indexOf(a.key) - sortingArr.indexOf(b.key)
  })
  tooltip.html(xDate)
    .style('display', 'inline')
    .style('left', (d3.event.pageX + 20) + "px")
    .style('top', (d3.event.pageY - 20) + "px")
    .style('color', 'white')
    .selectAll()
    .data(res_nested1).enter() // for each vehicle category, list out name and price of premium
    .append('div')
    .style('color', d => colors[d.key])
    .style('font-size', 10)
    .html(d => {
      var xDate = scaleBandPosition(mouse)
      var bisect = d3.bisector(function (d) { return d.year }).left
      var idx = bisect(d.values, xDate)
      return d.key + ": $" + (M(d.values[idx].sum)).toString()
    })
}

function scaleBandPosition(mouse, xScale) {
  var xPos = mouse[0];
  var domain = xScaleLine.domain(); 
  var range = xScaleLine.range();
  var rangePoints = d3.range(range[0], range[1], xScaleLine.step())
  return domain[d3.bisectLeft(rangePoints, xPos)]
}
