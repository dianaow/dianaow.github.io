var coe = function () {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 

  var res, svg, g, mouseG, tooltip
  var xScale = d3.scaleBand() // can't use scaleTime as the time interval between bidding exercises are not evenly spaced
  var parseDate = d3.timeParse("%Y-%m")
  var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"]
  var category = ["Category A", "Category B", "Category C", "Category D", "Category E"]
  var lineOpacity = 1
  var lineStroke = "1.8px"
  var axisPad = 6 // axis formatting
  var R = 6 //legend marker
  var modal = d3.select(".modal-content-coe")

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Create scales ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  var color = d3.scaleOrdinal()
    .domain(category)
    .range(["#2D4057", "#7C8DA4", "#B7433D", "#2E7576", "#EE811D"])

  ///////////////////////////////////////////////////////////////////////////
  /////////////////////////////////// CORE //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  return { 
    clear : function () {
      modal.select("svg").remove()
      tooltip.remove()
    },
    run : function () {

      svg = modal.append("svg")
      g = svg.append('g')
        
      g.append('g')
        .attr('class', 'lines')

      g.append("g")
        .attr("class", "x_axis")

      g.append("g")
        .attr("class", "y_axis")
        .append('text')
        .attr('x', 100)
        .attr("y", -8)
        .attr("fill", "#A9A9A9")
        .text("SGD$")

      g.append('g')
        .attr('class', 'gLegend')

      mouseG = g.append("g")
        .attr("class", "mouse-over-effects")

      tooltip = modal.append("div")
        .attr('id', 'tooltip')
        //.style('position', 'absolute')
        .style("background-color", "#D3D3D3")
        .style('padding', 6)
        .style('width', '200px')
        .style('display', 'none')

      window.addEventListener("resize", draw)
      loadData()

    }
  }

  ///////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Data Processing ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function loadData() {

    d3.csv("./data/coe-results.csv", function(data) {
      res = data.map((d,i) => {
        return {
          date : parseDate(d.month),
          bidding_no : +d.bidding_no,
          event : d.month + " :" + d.bidding_no, // create a unique identifier to each bidding exercise
          vehicle_class : d.vehicle_class,
          premium : +d.premium
        }
      })
      draw()
    })

  }

  function draw () {

    var bounds = modal.node().getBoundingClientRect()

    var margin = {top: 80, right: 80, bottom: 40, left: 80}
    var legendX = 100
    var legendY = 0
    var legendG = -60

    if(bounds.width <= 768) {
      margin = {top: 80, right: 40, bottom: 20, left: 40}
    } 

    var width = bounds.width*0.9 - margin.left - margin.right
    var height = 500 - margin.top - margin.bottom

    var tickNum = (bounds.width <= 768 ? 48 : 24)

    svg.attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)

    xScale
      .domain(res.map(d=>d.event))
      .range([0, width])
      .padding(0.1)

    var yScale = d3.scaleLinear()
      .domain([0, roundToNearest10K(d3.max(res, d => d.premium))])
      .range([height, 0]);

    ///////////////////////////////////////////////////////////////////////////
    ///////////////////////////////// Render axis /////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    // render axis first before lines so that lines will overlay the horizontal ticks
    var ticks = xScale.domain().filter((d,i)=>{ return !(i%tickNum) } ) // only show tick labels for the first bidding exercise of the year
    var xAxis = d3.axisBottom(xScale)
      .tickSizeOuter(0)
      .tickSizeInner(-height)
      .tickValues(ticks)

    var yAxis = d3.axisLeft(yScale)
      .ticks(10, "s")
      .tickSizeOuter(0)
      .tickSizeInner(-width)

    g.attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    g.select(".x_axis")
      .attr("transform", `translate(0, ${height})`) 
      .call(xAxis)
      .call(g => {
        g.selectAll("text")
          .style("text-anchor", "middle")
          .attr("y", axisPad)
          .attr('fill', '#A9A9A9')

        g.selectAll("line")
          .attr('stroke', '#A9A9A9')

        g.select(".domain")
          .attr('stroke', '#A9A9A9')
      })      

    g.select(".y_axis")
      .call(yAxis)
      .call(g => {
        g.selectAll("text")
        .style("text-anchor", "middle")
        .attr("x", -axisPad*2)
        .attr('fill', '#A9A9A9')

        g.selectAll("line")
          .attr('stroke', '#A9A9A9')
          .attr('stroke-width', 0.7) // make horizontal tick thinner and lighter so that line paths can stand out
          .attr('opacity', 0.3)

        g.select(".domain").remove()
       })

    ///////////////////////////////////////////////////////////////////////////
    /////////////////////////////// Create legend /////////////////////////////
    ///////////////////////////////////////////////////////////////////////////

    var svgLegend = d3.select('.gLegend')

    svgLegend.attr("transform", "translate(" + 0 + "," + legendG + ")")

    var legend = svgLegend.selectAll('.legend')
      .data(category)
      .enter().append('g')
        .attr("class", "legend")
        .attr("transform", function (d, i) {return "translate(" +  i * legendX + "," + i * legendY + ")"})

    legend.append("circle")
        .attr("class", "legend-node")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", R)
        .style("fill", d=>color(d))

    legend.append("text")
        .attr("class", "legend-text")
        .attr("x", R*2)
        .attr("y", R/2)
        .style("fill", "#A9A9A9")
        .style("font-size", 12)
        .text(d=>d)

    ///////////////////////////////////////////////////////////////////////////
    ///////////////////////////// Multiple-line plot //////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    // line generator
    var line = d3.line()
      .x(d => xScale(d.event) + xScale.bandwidth() / 2)
      .y(d => yScale(d.premium))

    var res_nested = d3.nest() // necessary to nest data so that keys represent each vehicle category
      .key(d=>d.vehicle_class)
      .entries(res)

    var lines = g.select('.lines')

    var glines = lines.selectAll('.line-group')
      .data(res_nested)

    glines.enter().append('g')
      .attr('class', 'line-group')  
      .append('path')
      .attr('class', 'line')  
      .attr('d', d => line(d.values))
      .style('stroke', (d, i) => color(i))
      .style('fill', 'none')
      .style('opacity', lineOpacity)
      .style('stroke-width', lineStroke)

    glines.select('path').attr('d', d => line(d.values)) // update

    glines.exit().remove()

    ///////////////////////////////////////////////////////////////////////////
    //////////////////// Create tooltip (with vertical marker) ////////////////
    ///////////////////////////////////////////////////////////////////////////

    mouseG.append("path") // create vertical line to follow mouse
      .attr("class", "mouse-line")
      .style("stroke", "#A9A9A9")
      .style("stroke-width", lineStroke)
      .style("opacity", "0");

    var lines = document.getElementsByClassName('line');

    var mousePerLine = mouseG.selectAll('.mouse-per-line')
      .data(res_nested)
      .enter()
      .append("g")
      .attr("class", "mouse-per-line");

    mousePerLine.append("circle")
      .attr("r", 4)
      .style("stroke", function (d) {
        return color(d.key)
      })
      .style("fill", "none")
      .style("stroke-width", lineStroke)
      .style("opacity", "0");

    mouseG.append('svg:rect') // append a rect to catch mouse movements
      .attr('width', width) 
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
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

        d3.selectAll(".mouse-per-line")
          .attr("transform", function (d, i) {
            var xDate = scaleBandPosition(mouse) // None of d3's ordinal (band/point) scales have the 'invert' method to to get date corresponding to distance of mouse position relative to svg, so have to create my own method
            var bisect = d3.bisector(function (d) { return d.event }).left // retrieve row index of date on parsed csv
            var idx = bisect(d.values, xDate)

            d3.select(".mouse-line")
              .attr("d", function () {
                var data = "M" + (xScale(d.values[idx].event) + 2).toString() + "," + (height);
                data += " " + (xScale(d.values[idx].event) + 2).toString() + "," + 0;
                return data;
              });
            return "translate(" + (xScale(d.values[idx].event) + 2).toString() + "," + yScale(d.values[idx].premium) + ")";

          });

        updateTooltipContent(mouse, res_nested)

      })

  }

  ///////////////////////////////////////////////////////////////////////////
  ////////////////////////// Update tooltip content /////////////////////////
  /////////////////////////////////////////////////////////////////////////// 

  function updateTooltipContent(mouse, res_nested) {

    sortingObj = []
    res_nested.map(d => {
      var xDate = scaleBandPosition(mouse)
      var bisect = d3.bisector(function (d) { return d.event }).left
      var idx = bisect(d.values, xDate)
      sortingObj.push({key: d.values[idx].vehicle_class, premium: d.values[idx].premium, bidding_no: d.values[idx].bidding_no, year: d.values[idx].date.getFullYear(), month: monthNames[d.values[idx].date.getMonth()]})
    })

    sortingObj.sort(function(x, y){
       return d3.descending(x.premium, y.premium);
    })

    var sortingArr = sortingObj.map(d=> d.key)

    var res_nested1 = res_nested.slice().sort(function(a, b){
      return sortingArr.indexOf(a.key) - sortingArr.indexOf(b.key) // rank vehicle category based on price of premium
    }) 

    tooltip.html(sortingObj[0].month + "-" + sortingObj[0].year + " (Bidding No:" + sortingObj[0].bidding_no + ')')
      .style('display', 'block')
      //.style('left', d3.event.pageX + 20)
      //.style('top', d3.event.pageY - 20)
      .style('font-size', 11.5)
      .selectAll()
      .data(res_nested1).enter() // for each vehicle category, list out name and price of premium
      .append('div')
      .style('color', d => {
        return color(d.key)
      })
      .style('font-size', 10)
      .html(d => {
        var xDate = scaleBandPosition(mouse)
        var bisect = d3.bisector(function (d) { return d.event }).left
        var idx = bisect(d.values, xDate)
        return d.key.substring(0, 3) + " " + d.key.slice(-1) + ": $" + d.values[idx].premium.toString()
      })
  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Helper functions ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function scaleBandPosition(mouse) {
    var xPos = mouse[0];
    var domain = xScale.domain(); 
    var range = xScale.range();
    var rangePoints = d3.range(range[0], range[1], xScale.step())
    return domain[d3.bisectLeft(rangePoints, xPos) -1]
  }

  function roundToNearest10K(x) {
    return Math.round(x / 10000) * 10000
  }


}()