d3.csv("./data/csl_foreign_players.csv", function(csv) {

  var screenWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) * 0.85
  var screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) * 0.9
  var canvasDim = { width: screenWidth, height: screenHeight}

  var margin = {top: 20, right: 20, bottom: 20, left: 70}
  var width = canvasDim.width - margin.left - margin.right
  var height = canvasDim.height - margin.top - margin.bottom

  var countries = ['Poland', 'Colombia', 'Spain', 'Brazil', 'Morocco', 'Nigeria', 'Senegal', 'Croatia', 'South Korea', 'Argentina', 'Belgium', 'Peru', 'Australia', 'Serbia', 'Portugal', 'Germany', 'Sweden', 'France', 'Switzerland', 'Tunisia', 'Japan', 'Iran', 'Iceland', 'England', 'Egypt', 'Denmark', 'Costa Rica', 'Uruguay']
  var axisPad = 6

  // CREATE DOM ELEMENTS
  var svg = d3.select("#chart1").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var tooltip = d3.select("#chart1").append("div")
    .attr("id", "tooltip")
    .style('position', 'absolute')
    .style("background-color", "#D3D3D3")
    .style('padding', "8px")
    .style('display', 'none')

  var nodes = svg.append('g')
    .attr('class', 'nodes')

  var x_axis = svg.append("g")
    .attr("class", "x_axis")

  var y_axis = svg.append("g")
    .attr("class", "y_axis")

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
      duration: +d.End_Year - +d.Start_Year + 1
    }
  })

  var xScale = d3.scaleLinear()
    .domain([2004, 2019])
    .rangeRound([0, width])

  var yScale = d3.scaleBand()
    .domain(countries.sort(function(x, y){
       return countries.indexOf(y) - countries.indexOf(x)
     }))
    .range([height, 0])
    .padding(10)

  var colorScale = d3.scaleLinear()
    .domain(d3.range(1,9))
    .range(['navy', 'gold', 'DarkOrange', 'red','red','red','red','red'])

  var dataNew = data.map((d,i) => {
      return {
        x : xScale(d.start_year),
        y : yScale(d.country),
        player : d.player,
        star : d.star,
        club : d.club,
        description: d.description,
        duration: d.duration
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
          duration: d.duration
        })
      }
    }
  })

  // Initialize force simulation
  var simulation = d3.forceSimulation()  
    .force('charge', d3.forceManyBody().strength(1))
    .force("collide", d3.forceCollide(function(d,i) { return d.star == "Star" ? 16.5 : 2.5 }))
    .alphaDecay(0.1)
    .velocityDecay(0.4)
    .stop()

  simulation
    .nodes(dataNew)
    .force('x', d3.forceX().strength(0.8).x(d => d.star == "Star" ? d.x-8 : d.x))
    .force('y', d3.forceY().strength(0.8).y(d => d.y))

  for (var i = 0; i < 100; ++i) simulation.tick() // start simulation 'in the background' to update node positions before render

  // NODES (each representing an entity)
  var gnodes = nodes.selectAll('.node-group').data(dataNew) // Join new data with old elements, if any

  // After merging the entered elements with the update selection, apply operations to both.
  var entered_nodes = gnodes.enter().append('g')
    .merge(gnodes)
    .attr('id', function(d,i) { return d.star == "Star" ? "star" : "other" })
    .attr("class", function(d,i) { return "node-group"})
    .attr("transform", function(d,i) { 
      return "translate(" + d.x + "," + d.y + ")" 
    })

  // set up filter
  svg.append('filter')
    .attr('id','desaturate')
    .append('feColorMatrix')
    .attr('type','matrix')
    .attr('values',"0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0");

  entered_nodes.append("defs").attr("id", "imgdefs")
    .append("pattern")
      .attr('id', function(d,i) { return "image-" + d.player.replace(/[^A-Z0-9]+/ig, "_") + "-" + d.club.replace(/[^A-Z0-9]+/ig, "_") })
      .attr("height", 38)
      .attr("width", 38)
    .append('image')
      .attr("xlink:href",  function(d,i) { 
        return d.star == "Star" ? ("./csl_player_thumbnail/" + d.player.replace(/[^A-Z0-9]+/ig, "_") + ".png") : null
      })  
      .style("filter", function(d,i) { 
        return d.star == "Star" ? ("filter", "url(#desaturate)") : null // apply grey filter only on star players
      })
      .attr("x", -2)
      .attr("y", -2)
      .attr("height", 38)
      .attr("width", 38)

  entered_nodes
    .append("circle")
      .attr('id', function(d,i) { return "circle-" + d.player.replace(/[^A-Z0-9]+/ig, "_") + "-" + d.club.replace(/[^A-Z0-9]+/ig, "_") })
      .attr('r', function(d,i) { return d.star == "Star" ? 16 : 2 })
      .attr('fill', function(d,i) { return d.star == "Star" ? "url(#" + ("image-" + d.player.replace(/[^A-Z0-9]+/ig, "_") + "-" + d.club.replace(/[^A-Z0-9]+/ig, "_"))  : colorScale(d.duration) })
      .attr('fill-opacity', 1)
      .attr('stroke', 'none')

  d3.selectAll('#star')
    .append("circle")
      .attr('r', 16)
      .attr('fill', function(d,i) { return colorScale(d.duration) })
      .attr('fill-opacity', 0.2)
      .attr('stroke', 'none')


  // CREATE INTERACTIVITY
  // can't use gnodes.on() because no nodes have been created yet. 
  entered_nodes.on('mouseover', function (d,i) {
    d3.select(this).style("cursor", "pointer") 

    d3.selectAll('#other #circle-' + d.player.replace(/[^A-Z0-9]+/ig, "_") + "-" + d.club.replace(/[^A-Z0-9]+/ig, "_"))
      .attr('r', 4)
      .attr('stroke', 'white')
      .attr('stroke-width', '2px')

    d3.selectAll("#tooltip")
      .style('display', 'block')
  })
  .on('mousemove', function(d) {
    updateTooltipContent(d)
  })
  .on('mouseout', function (d,i) {
    d3.select(this).style("cursor", "default")

    d3.selectAll('#other #circle-' + d.player.replace(/[^A-Z0-9]+/ig, "_") + "-" + d.club.replace(/[^A-Z0-9]+/ig, "_"))
      .attr('r', 2)
      .attr('stroke', 'none')

    d3.selectAll("#tooltip")
      .style('display', 'none')
  })

  // AXES // 
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
      .style("cursor", "pointer")

      g.selectAll("line")
        .attr('stroke', '#A9A9A9')
        .attr('stroke-width', 0.7) // make horizontal tick thinner and lighter so that line paths can stand out
        .attr('opacity', 0.3)

      g.select(".domain").remove()

     })

  gnodes.exit().remove() // Remove old

  // CREATE LEGEND // 
  var legendX = 40
  var legendY = 0
  var R = 6
  var category = [{color:'navy', label:"1"},
   {color:'gold', label:"2"}, 
   {color:'DarkOrange', label:"3"},
   {color:'red', label:">3 seasons"}]

  var svgLegend = d3.select("#chart1_legend").append("svg")
    .attr("width", 210)
    .attr("height", 30)
  .append("g")
    .attr('class', 'gLegend')
    .attr("transform", "translate(" + 10 + "," + 18 + ")");

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

  function updateTooltipContent(d) {

    tooltip.html(d.player) // player name
      .attr('class', 'text-' + d.player.replace(/[^A-Z0-9]+/ig, "_") + "-" + d.club.replace(/[^A-Z0-9]+/ig, "_"))
      .style("left", (d.x + 0) + "px")
      .style("top", (d.y + -40) + "px")
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

})


