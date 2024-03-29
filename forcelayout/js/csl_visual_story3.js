d3.csv("./data/csl_foreign_players.csv", function(csv) {

  var counter = 0
  var gnodes = null
  var entered_nodes = null
  var countries = ['Poland', 'Colombia', 'Spain', 'Brazil', 'Morocco', 'Nigeria', 'Croatia', 'Senegal', 'South Korea', 'Argentina', 'Belgium', 'Australia', 'Serbia', 'Portugal', 'Germany', 'Sweden', 'France', 'Japan', 'Iceland', 'Costa Rica', 'Tunisia', 'Uruguay']
  var axisPad = 6
  var radius = (screen.width < 1024 ? 3.5 : 2.5) // responsive design: modify node radius based on device's screen width

  // Desktop screen view
  var screenWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) * 0.85 
  var screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) 

  // If viewed on mobile or iPad, overwrite dimensions
  if(screen.width <= 1024){
    var screenWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) * 0.9
    var screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) * 0.9
  } 

  // Dimensions of first chart (beeswarm plot)
  var canvasDim = { width: screenWidth, height: screenHeight}
  var margin = {top: 30, right: 20, bottom: 20, left: 80}
  var width = canvasDim.width - margin.left - margin.right
  var height = canvasDim.height - margin.top - margin.bottom

  // Dimensions of second chart
  var canvasDim2 = { width: screenWidth, height: screenHeight
   }
  var margin2 = {top: 30, right: 30, bottom: 60, left: 30}
  var height2 = canvasDim2.height - margin2.top - margin2.bottom


  // CREATE DOM ELEMENTS
  var svg = d3.select("#chart2").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var tooltip = d3.select("#chart2").append("div")
    .attr("id", "tooltip")
    .style('position', 'absolute')
    .style("background-color", "#D3D3D3")
    .style('padding', "8px")
    .style('display', 'none')

  var nodes = svg.append('g')
    .attr('class', 'nodes')

  var x_axis = svg.append("g")
    .attr("class", "x_axis")
    .attr("transform", "translate(0," + 0 +  ")")

  var y_axis = svg.append("g")
    .attr("class", "y_axis")

  var x_axis2 = svg.append("g")
    .attr("class", "x_axis2")

  var xScale = d3.scaleLinear()
    .domain([2004, 2019])
    .rangeRound([0, width])

  var yScale = d3.scaleBand()
    .domain(countries.sort(function(x, y){ return countries.indexOf(y) - countries.indexOf(x)}))
    .range([height, 0])
    .padding(10)

  var colorScale = d3.scaleLinear()
    .domain(d3.range(1,9))
    .range(['navy', 'gold', 'DarkOrange', 'red','red','red','red','red'])

  var xScale2 = d3.scaleLinear()
    .domain([24, 34])
    .rangeRound([0, width])

  // DATA PROCESSING
  var data = csv.map(function(d) {
    return {
      country: d.Country,
      player: d.Player,
      star: d.Star_Player,
      club: d.Club_Name_1 + " " + d.Club_Name_2,
      description: d.Description,
      start_year: +d.Start_Year,
      end_year: +d.End_Year,
      duration: +d.End_Year - +d.Start_Year + 1,
      age: getRndBias(24, 34, 30, 1) // randomly set age of player according to normal distribution with bias
    }
  })

  var dataAge = data.map((d,i) => {
    return {
      x : xScale2(d.age),
      y: height2/2,
      player : d.player,
      star : d.star,
      club : d.club,
      age: d.age,
      duration: d.duration,
      radius: d.star == "Star" ? 16 : radius+3
    }
  })

  var dataNew = data.map((d,i) => {
      return {
        x : xScale(d.start_year),
        y : yScale(d.country),
        player : d.player,
        star : d.star,
        club : d.club,
        description: d.description,
        duration: d.duration,
        radius: d.star == "Star" ? 16 : radius 
      }
    })

  data.map((d,i) => {
    if(d.duration > 1){
      for (var i=1;i<=d.duration-1; i++) {
        dataNew.push({
          x : xScale(d.start_year+i),
          y : yScale(d.country),
          player : d.player,
          star : "",
          club : d.club,
          description: d.description,
          duration: d.duration,
          radius: radius 
        })
      }
    }
  })

  // CREATE LEGEND // 
  var legendX = 40
  var legendY = 0
  var R = 6
  var category = [{color:'navy', label:"1"}, {color:'gold', label:"2"}, {color:'DarkOrange', label:"3"}, {color:'red', label:">3 seasons"}]

  var svgLegend = d3.select("#chart_legend").append("svg")
    .attr("width", 260)
    .attr("height", 30)
  .append("g")
    .attr('class', 'gLegend')
    .attr("transform", "translate(" + 50 + "," + 10 + ")");

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
      .style("fill", d=>d.color)

  legend.append("text")
      .attr("class", "legend-text")
      .attr("x", R*2)
      .attr("y", R/2)
      .style("fill", "#A9A9A9")
      .style("font-size", 12)
      .text(d=>d.label)

  // Initialize force simulation
  var simulation = d3.forceSimulation()  
    .force('charge', d3.forceManyBody().strength(1))
    .force("collide", d3.forceCollide(function(d,i) { return d.star == "Star" ? 16.5 : radius+0.5 }))
    .alphaDecay(0.1)
    .velocityDecay(0.2)
    .stop()

  draw()

  if(screen.width > 1024){
    setTimeout(splitBeeswarm, 2000)
    //window.addEventListener("scroll", isScrolledIntoView); // split nodes of beeswarm to another force-directed graph upon scroll
  } else {
    splitBeeswarm_mobile() // activate different function when viwed on mobile
  }

  function draw() {

    // AXES // 
    xAxis2 = d3.axisTop(xScale2).tickSize(-height2).tickPadding(20)

    d3.select(".x_axis2")
      .call(xAxis2)
      .call(g => {
        g.selectAll("text").attr("transform", `translate(0, -20)`)
          .attr("y", axisPad)
          .attr('fill', '#A9A9A9')
          .style('font-size', 14)
        g.selectAll("line")
          .attr('stroke', '#A9A9A9')
          .attr('stroke-dasharray', "4")
        g.select(".domain").remove()
      })

    svg.append("line")
      .attr('class', 'x_axis2_line')
      .attr('x1', xScale2(24)-30)
      .attr('x2', xScale2(39)+30)
      .attr('y1', height2/2)
      .attr('y2', height2/2)
      .attr('stroke', 'black')
      .attr('stroke-width', 2)

    // NODES (each representing an entity)
    simulation
      .nodes(dataAge)
      .force("collide", d3.forceCollide(function(d,i) { return d.star == "Star" ? 16.5 : radius+3.5 }))
      .force('x', d3.forceX().strength(0.8).x(d => d.x))
      .force('y', d3.forceY().strength(0.8).y(d => d.y))

    for (var i = 0; i < 100; ++i) simulation.tick() // start simulation 'in the background' to update node positions before render

    gnodes = nodes.selectAll('.node-group').data(dataAge) // Join new data with old elements, if any
    update(gnodes)

  }

  function splitBeeswarm_mobile() {

    // repeating this technique of updating node positions a second time in the background as above seems to cause mislignment of nodes...
    var gnodes_m = nodes.selectAll('.node-group-m').data(dataNew) // Join new data with old elements, if any

    var entered_nodes_m = gnodes_m.enter().append('circle')
      .attr("class", "node-group-m")
      .attr('r', function (d) { return d.radius })
      .attr("transform", function(d,i) { return "translate(" + d.x + "," + d.y + ")" })
      .attr('id', function(d,i) { 
        var type = d.star == "Star" ? "star" : "other"
        return type + "-circle-" + d.player.replace(/[^A-Z0-9]+/ig, "_") + "-" + d.club.replace(/[^A-Z0-9]+/ig, "_") 
      })
      .attr('fill', function(d,i) { return colorScale(d.duration) })
      .attr('fill-opacity', 1)
      .attr('stroke', 'none')

    simulation
      .nodes(dataNew)
      .force("collide", d3.forceCollide(function(d,i) { return d.star == "Star" ? 16.5 : radius+0.5 }))
      .force('x', d3.forceX().strength(0.8).x(d => d.star == "Star" ? d.x-8 : d.x)) // shift node of star player slightly to the left for aesthetic purpose
      .force('y', d3.forceY().strength(0.8).y(d => d.y))
      .on('tick', tickedm)
      .stop()

     gnodes_m = gnodes_m.merge(entered_nodes_m)
     simulation.alpha(1).restart()
     interaction(gnodes_m)

    function tickedm() {
      gnodes_m
        .attr("transform", function(d,i) { return "translate(" + d.x + "," + d.y + ")" })
    }

  }

  function splitBeeswarm() {

    xAxis = d3.axisTop(xScale).tickFormat(d3.format("d")).tickSizeOuter(0).tickSizeInner(0)
    yAxis = d3.axisLeft(yScale).tickSize(-width)

    d3.select(".x_axis")
      .call(xAxis)
      .call(g => {
        g.selectAll("text").attr("transform", `translate(0, 0)`) //shift tick labels to middle of interval
          .attr("y", axisPad)
          .attr('fill', '#A9A9A9')
          .style('font-size', 16)

        g.selectAll("line")
          .attr('stroke', '#A9A9A9')

        g.select(".domain").remove()

      })

    d3.select(".y_axis")
      .call(yAxis)
      .call(g => {
        g.selectAll("text")
          .attr("x", -axisPad*2)
          .style("font-weight", "normal")
          .attr('fill', '#A9A9A9')
          .style('font-size', 12.5)

        g.selectAll("line")
          .attr('stroke', '#A9A9A9')
          .attr('stroke-width', 0.7) // make horizontal tick thinner and lighter so that line paths can stand out
          .attr('opacity', 0.3)

        g.select(".domain").remove()

       })
    console.log(dataNew)
    gnodes = nodes.selectAll('.node-group').data(dataNew) // Join new data with old elements, if any
    update(gnodes)
    d3.select(".x_axis2").remove()
    d3.select(".x_axis2_line").remove()

    simulation
      .nodes(dataNew)
      .force("collide", d3.forceCollide(function(d,i) { return d.star == "Star" ? 16.5 : radius+0.5 }))
      .force('x', d3.forceX().strength(0.8).x(d => d.star == "Star" ? d.x-8 : d.x)) // shift node of star player slightly to the left for aesthetic purpose
      .force('y', d3.forceY().strength(0.8).y(d => d.y))
      .on('tick', ticked)
      .stop()

    gnodes = gnodes.merge(entered_nodes)
    simulation.alpha(0.8).restart()
    
  }

  function update(gnodes) {

    entered_nodes = gnodes.enter().append('circle')
      .attr("class", "node-group")
      .attr('r', function (d) { return d.radius })
      .attr("transform", function(d,i) { return "translate(" + d.x + "," + d.y + ")" })
      .attr('id', function(d,i) { 
        var type = d.star == "Star" ? "star" : "other"
        return type + "-circle-" + d.player.replace(/[^A-Z0-9]+/ig, "_") + "-" + d.club.replace(/[^A-Z0-9]+/ig, "_") 
      })
      .attr('fill', function(d,i) { return colorScale(d.duration) })
      .attr('fill-opacity', 1)
      .attr('stroke', 'none')

    gnodes = gnodes.merge(entered_nodes) // After merging the entered elements with the update selection, apply operations to both.

    gnodes.transition()
      .duration(2000)
      .attr('r', function (d) { return d.radius })
      .attr("transform", function(d,i) { return "translate(" + d.x + "," + d.y + ")" })

    gnodes.exit().remove() // Remove old

    interaction(gnodes)
  }

  function ticked() {

    gnodes
      .transition()
      .duration(280)
      //.delay(function(d, i) { return i * 50 })
      .attr('r', function (d) { return d.radius })
      .attr("transform", function(d,i) { return "translate(" + d.x + "," + d.y + ")" })

  }

  function interaction(gnodes) {
    gnodes.on('mouseover', function (d,i) {
 
      d3.select(this).style("cursor", "pointer") 

      gnodes.selectAll('#other-circle-' + d.player.replace(/[^A-Z0-9]+/ig, "_") + "-" + d.club.replace(/[^A-Z0-9]+/ig, "_"))
        .attr('r', d.type=='age' ? radius+3+3 : radius+3)
        .attr('stroke', 'black')
        .attr('stroke-width', '2px')
        .attr('z-index', 999)

      gnodes.selectAll('#star-circle-' + d.player.replace(/[^A-Z0-9]+/ig, "_") + "-" + d.club.replace(/[^A-Z0-9]+/ig, "_"))
        .attr('stroke', 'black')
        .attr('stroke-width', '2px')

      d3.selectAll("#tooltip")
        .style('display', 'block')
    })
    .on('mousemove', function(d) {
      updateTooltipContent(d)
    })
    .on('mouseout', function (d,i) {
      d3.select(this).style("cursor", "default")

      gnodes.selectAll('#other-circle-' + d.player.replace(/[^A-Z0-9]+/ig, "_") + "-" + d.club.replace(/[^A-Z0-9]+/ig, "_"))
        .attr('r', d.type=='age' ? radius+3 : radius)
        .attr('stroke', 'none')

      gnodes.selectAll('#star-circle-' + d.player.replace(/[^A-Z0-9]+/ig, "_") + "-" + d.club.replace(/[^A-Z0-9]+/ig, "_"))
        .attr('stroke', 'none')

      d3.selectAll("#tooltip")
        .style('display', 'none')
    })
  }

  function updateTooltipContent(d) {

    tooltip.html(d.player) // player name
      .attr('class', 'text-' + d.player.replace(/[^A-Z0-9]+/ig, "_") + "-" + d.club.replace(/[^A-Z0-9]+/ig, "_"))
      .style("left", (d.star == "Star" & d.type=='year') ? (width - 200) + "px" : (d.x + 0) + "px")
      .style("top", (d.star == "Star" & d.type=='year')  ? (canvasDim2.height) + "px" : (d.y - 40) + "px")
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#555')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')

    tooltip.append('div')
        .style('font-size', '10px')
        .style('font-style', 'italic')
        .html(d.club) // club name

    if(d.star=='Star'){
      tooltip.append('div')
        .style('font-size', '9px')
        .html(d.description) // if star player, show description about him
    }

  }

  function isScrolledIntoView() {

    var h3 = d3.select('.new_header').node()
    if (isInViewport(h3)) {
      if(counter==0){
        splitBeeswarm()
      }
      counter=1
    }
  }

  var isInViewport = function (elem) {
    var bounding = elem.getBoundingClientRect()
    return (
        bounding.top >= 0 &&
        bounding.left >= 0 &&
        bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        bounding.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  };

})

function getRndBias(min, max, bias, influence) {
    var rnd = Math.random() * (max - min) + min,   // random in range
        mix = Math.random() * influence;           // random mixer
    return rnd * (1 - mix) + bias * mix;           // mix full range and bias
}
