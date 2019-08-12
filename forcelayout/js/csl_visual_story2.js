d3.csv("./data/csl_foreign_players.csv", function(csv) {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 

  var simulaton, entered_nodes 
  var countries = ['Poland', 'Colombia', 'Spain', 'Brazil', 'Morocco', 'Nigeria', 'Croatia', 'Senegal', 'South Korea', 'Argentina', 'Belgium', 'Australia', 'Serbia', 'Portugal', 'Germany', 'Sweden', 'France', 'Japan', 'Iceland', 'Costa Rica', 'Tunisia', 'Uruguay']
  var axisPad = 6
  var starRadius = 16

  var screenWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) * 0.92 
  var screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)

  // responsive design: modify node radius based on device's screen width
  if (mobile) {
    var normalRadius = 8
  } else {
    var normalRadius = 7
  }

  // Dimensions of first chart
  var canvasDim = { width: screenWidth, height: screenHeight }
  var margin = {top: 30, right: 20, bottom: 20, left: 80}
  var width = canvasDim.width - margin.left - margin.right
  var height = canvasDim.height - margin.top - margin.bottom

  // Dimensions of second chart
  var canvasDim2 = { width: screenWidth, height: screenHeight }
  var margin2 = {top: 0, right: 30, bottom: 0, left: 100}
  var height2 = canvasDim2.height - margin2.top - margin2.bottom

  ///////////////////////////////////////////////////////////////////////////
  //////////////////// Set up and initiate containers ///////////////////////
  /////////////////////////////////////////////////////////////////////////// 

  var svg = d3.select("#chart2").append("svg")
    .attr("width", width + margin2.left + margin2.right)
    .attr("height", height + margin2.top + margin2.bottom)
  .append("g")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

  var x_axis = svg.append("g")
    .attr("class", "x_axis")
    .attr("transform", "translate(0," + 50 +  ")")
    //.attr("transform", "translate(0," + (canvasDim2.height+70).toString() +  ")")

  var y_axis = svg.append("g")
    .attr("class", "y_axis")

  var x_axis2 = svg.append("g")
    .attr("class", "x_axis2")

  var nodes2 = svg.append('g')
    .attr('class', 'nodes2')

  var nodes = svg.append('g')
    .attr('class', 'nodes')

  var tooltip = d3.select("#chart2").append("div")
    .attr("id", "tooltip")
    .style('position', 'absolute')
    .style("background-color", "#D3D3D3")
    .style('padding', "8px")
    .style('display', 'none')

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Create scales ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  var xScale = d3.scaleLinear()
    .domain([2004, 2019])
    .rangeRound([0, width])

  var yScale = d3.scaleBand()
    .domain(countries.sort(function(x, y){ return countries.indexOf(y) - countries.indexOf(x)}))
    .range([canvasDim2.height-50, 50])
    //.range([height, canvasDim2.height+70])
    .padding(10)

  var colorScale = d3.scaleLinear()
    .domain(d3.range(1,9))
    .range(['#9E9E9E', '#757575', '#424242', 'red','red','red','red','red'])

  var xScale2 = d3.scaleLinear()
    .domain([24, 34])
    .rangeRound([0, width])


  ///////////////////////////////////////////////////////////////////////////
  /////////////////////////// Data Processing ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

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
      //age: getRndBias(24, 34, 26, 0.7) // randomly set age of player according to normal distribution with bias
    }
  })

  //var dataAge = data.map((d,i) => {
    //return {
      //x : xScale2(d.age),
      //y: height2/2,
      //player : d.player,
      //star : d.star,
      //club : d.club,
      //age: d.age,
      //duration: d.duration,
      //radius: d.star == "Star" ? starRadius : normalRadius,
      //type: "age"
    //}
  //})

  var dataNew = data.map((d,i) => {
      return {
        x : xScale(d.start_year),
        y : yScale(d.country),
        player : d.player,
        star : d.star,
        club : d.club,
        description: d.description,
        duration: d.duration,
        radius: d.star == "Star" ? starRadius : normalRadius-4,
        type: "year"
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
          radius: normalRadius-4,
          type: "year"
        })
      }
    }
  })

  ///////////////////////////////////////////////////////////////////////////
  /////////////////////////// Create legend /////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  var legendX = 40
  var legendY = 0
  var R = 6
  var category = [{color:'#9E9E9E', label:"1"}, {color:'#757575', label:"2"}, {color:'#424242', label:"3"}, {color:'red', label:">3 seasons"}]

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

  ///////////////////////////////////////////////////////////////////////////
  /////////////////////////// Create axis ///////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  //xAxis2 = d3.axisTop(xScale2).tickSize(-height2).tickPadding(20)

  //d3.select(".x_axis2")
    //.call(xAxis2)
    //.call(g => {
      //g.selectAll("text").attr("transform", `translate(0, -20)`)
        //.attr("y", axisPad)
        //.attr('fill', '#A9A9A9')
        //.style('font-size', 14)
      //g.selectAll("line")
        //.attr('stroke', '#A9A9A9')
        //attr('stroke-dasharray', "4")
      //g.select(".domain").remove()
    //})

  xAxis = d3.axisTop(xScale).tickFormat(d3.format("d")).tickSizeOuter(0).tickSizeInner(0)
  yAxis = d3.axisLeft(yScale).tickSize(-width)

  d3.select(".x_axis")
    .call(xAxis)
    .call(g => {
      g.selectAll("text").attr("transform", `translate(0, 0)`) //shift tick labels to middle of interval
        .attr("y", axisPad)
        .attr('fill', '#212121')
        .style('font-size', 20)

      g.selectAll("line")
        .attr('stroke', '#212121')

      g.select(".domain").remove()

    })

  d3.select(".y_axis")
    .call(yAxis)
    .call(g => {
      g.selectAll("text")
        .attr("x", -axisPad*2)
        .style('font-family', 'Helvetica')
        .style('font-weight', 'bold')
        .attr('fill', 'navy')
        .style('font-size', 13.5)

      g.selectAll("line")
        .attr('stroke', 'navy')
        .attr('stroke-width', 0.7) // make horizontal tick thinner and lighter so that line paths can stand out
        .attr('opacity', 0.3)

      g.select(".domain").remove()

     })

  ///////////////////////////////////////////////////////////////////////////
  /////////////////////////// Miscelleneous /////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  //svg.append('text')
    //.attr('class', 'new_header')
    //.attr('x', 0)
    //.attr('y', canvasDim2.height+30)
    //.attr('font-size', '1.75rem')
    //.attr('font-family', 'Merriweather')
    //.text('Timeline of the entry and exit of foreign CSL players') // second chart title

  //svg.append("line")
    //.attr('class', 'x_axis2_line')
    //.attr('x1', xScale2(24)-30)
    //.attr('x2', xScale2(39)+30)
    //.attr('y1', height2/2)
    //.attr('y2', height2/2)
    //.attr('stroke', 'black')
    //.attr('stroke-width', 2) // visualize baseline of beeswarm plot

  ///////////////////////////////////////////////////////////////////////////
  //////////////////////////////////// CORE /////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  //Graph1()
  Graph2()

  function Graph1() {

    /////////////////// Initialize force simulation 1 - Beeswarm ///////////////////////////

    var simulation1 = d3.forceSimulation()  
      .force('charge', d3.forceManyBody().strength(-30))
      .force("collide", d3.forceCollide(function(d,i) { return d.star == "Star" ? starRadius + 2 : normalRadius + 2 }))
      .force("x", d3.forceX(function(d) { return d.x }).strength(0.8))
      .force('y', d3.forceY(function(d) { return d.y }).strength(0.8))
      .alphaDecay(0.1)
      .velocityDecay(0.4)
      .stop()

    simulation1.nodes(dataAge)

    for (var i = 0; i < 150; ++i) simulation1.tick() // start simulation 'in the background' to update node positions before render

    var gnodes = nodes.selectAll('.node-group').data(dataAge) // render updated node positions after force layout does its magic on it
    
    update(gnodes)

  }

  function Graph2() {

    /////////////////// Initialize force simulation 2 - Clustered scatterplot ///////////////////////////

    // responsive design: modify node radius based on device's screen width
    if (ipad_landscape | mobile) {
      var strengthX = 1
      var strengthY = 0.3
    } else if (ipad_portrait) {
      var strengthX = 1
      var strengthY = 0.6
    } else {
      var strengthX = 1
      var strengthY = 1
    }

    //if (ipad_portrait | ipad_landscape | mobile) {
      updateSame(strengthX, strengthY)
    //} else {
      update(strengthX, strengthY)
    //}

  }
  function updateSame(strengthX, strengthY) {

    var simulation2 = d3.forceSimulation()  
      .force('charge', d3.forceManyBody().strength(1))
      .force("collide", d3.forceCollide(normalRadius-4+0.5))
      .force('x', d3.forceX().strength(strengthX).x(d => d.star == "Star" ? d.x-8 : d.x)) // shift node of star player slightly to the left for aesthetic purpose
      .force('y', d3.forceY().strength(strengthY).y(d => d.y))
      //.alphaDecay(0.1)
      //.velocityDecay(0.4)
      .stop()

    simulation2.nodes(dataNew)

    for (var i = 0; i < 200; ++i) simulation2.tick()
    
    var gnodes = nodes.selectAll('.node-group-1').data(dataNew) 

    /////////////////// Update static node positions based on simulation  //////////////////////

    entered_nodes = gnodes.enter().append('g')
      .attr('id', function(d,i) { return d.star == "Star" ? "star" : "other" })
      .attr("class", function(d,i) { return "node-group-1"})
      .attr("transform", function(d,i) { 
        return "translate(" + d.x + "," + d.y + ")" 
      })

    entered_nodes
      .append("circle")
        .attr('id', function(d,i) { return "circle-" + d.player.replace(/[^A-Z0-9]+/ig, "_") + "-" + d.club.replace(/[^A-Z0-9]+/ig, "_") })
        .attr('r', normalRadius-4)
        .attr('fill', function(d,i) { return colorScale(d.duration) })
        .attr('fill-opacity', 1)
        .attr('stroke', 'none')

    gnodes = gnodes.merge(entered_nodes) // required to merge entering elements before we can use 'gnodes.on('mouseover')'

    gnodes.exit().remove()

    interactive(gnodes)

  }

  function update(strengthX, strengthY) {

    var simulation2 = d3.forceSimulation()  
      .force('charge', d3.forceManyBody().strength(1))
      .force("collide", d3.forceCollide(function(d,i) { return d.star == "Star" ? starRadius+0.5 : normalRadius-4+0.5 }))
      .force('x', d3.forceX().strength(strengthX).x(d => d.star == "Star" ? d.x-8 : d.x)) // shift node of star player slightly to the left for aesthetic purpose
      .force('y', d3.forceY().strength(strengthY).y(d => d.y))
      //.alphaDecay(0.1)
      //.velocityDecay(0.4)
      .stop()

    simulation2.nodes(dataNew)

    for (var i = 0; i < 200; ++i) simulation2.tick()
    
    var gnodes = nodes2.selectAll('.node-group-2').data(dataNew) 

    /////////////////// Update static node positions based on simulation  //////////////////////

    entered_nodes = gnodes.enter().append('g')
      .attr('id', function(d,i) { return d.star == "Star" ? "star" : "other" })
      .attr("class", function(d,i) { return "node-group-2"})
      .attr("transform", function(d,i) { 
        return "translate(" + d.x + "," + d.y + ")" 
      })

    // set up grey filter
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
          return d.star == "Star" ? ("./csl_player_thumbnail/" + d.player.replace(/[^A-Z0-9]+/ig, "_") + ".png") : null // add image only for star players
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
        .attr('r', function(d,i) { return d.radius })
        .attr('fill', function(d,i) { return d.star == "Star" ? "url(#" + ("image-" + d.player.replace(/[^A-Z0-9]+/ig, "_") + "-" + d.club.replace(/[^A-Z0-9]+/ig, "_"))  : colorScale(d.duration) })
        .attr('fill-opacity', 1)
        .attr('stroke', 'none')

    nodes2.selectAll('#star')
      .append("circle")
        .attr('r', starRadius)
        .attr('fill', function(d,i) { return colorScale(d.duration) })
        .attr('fill-opacity', 0.2) // overlay a translucent colored filter over the grey star player images
        .attr('stroke', 'none')

    gnodes = gnodes.merge(entered_nodes) // required to merge entering elements before we can use 'gnodes.on('mouseover')'

    gnodes.exit().remove()

    interactive(gnodes)
  }

  ///////////////////////////////////////////////////////////////////////////
  //////////////////////////////// Interactivity  ///////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function interactive(gnodes) {

    gnodes.on('mouseover', function (d,i) {
 
      d3.select(this).style("cursor", "pointer") 

      gnodes.selectAll('#other #circle-' + d.player.replace(/[^A-Z0-9]+/ig, "_") + "-" + d.club.replace(/[^A-Z0-9]+/ig, "_"))
        .attr('r', function(d,i) { return d.radius })
        .attr('stroke', 'darkorange')
        .attr('stroke-width', '5px')
        .attr('z-index', 999)

      gnodes.selectAll('#star #circle-' + d.player.replace(/[^A-Z0-9]+/ig, "_") + "-" + d.club.replace(/[^A-Z0-9]+/ig, "_"))
        .attr('stroke', 'darkorange')
        .attr('stroke-width', '2px')

      d3.selectAll("#tooltip")
        .style('display', 'block')
    })
    .on('mousemove', function(d) {
      updateTooltipContent(d)
    })
    .on('mouseout', function (d,i) {
      d3.select(this).style("cursor", "default")

      gnodes.selectAll('#other #circle-' + d.player.replace(/[^A-Z0-9]+/ig, "_") + "-" + d.club.replace(/[^A-Z0-9]+/ig, "_"))
        .attr('r', function(d,i) { return d.radius })
        .attr('stroke', 'none')

      gnodes.selectAll('#star #circle-' + d.player.replace(/[^A-Z0-9]+/ig, "_") + "-" + d.club.replace(/[^A-Z0-9]+/ig, "_"))
        .attr('stroke', 'none')

      d3.selectAll("#tooltip")
        .style('display', 'none')
    })

  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Set up tooltip //////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function updateTooltipContent(d) {

    tooltip.html(d.player) // player name
      .attr('class', 'text-' + d.player.replace(/[^A-Z0-9]+/ig, "_") + "-" + d.club.replace(/[^A-Z0-9]+/ig, "_"))
      .style("left", (d.star == "Star" & d.type=='year') ? (width - 300) + "px" : (d.x + 0) + "px")
      .style("top", (d.star == "Star" & d.type=='year')  ? -100 + "px" : (d.y - 60) + "px")
      .attr('text-anchor', 'middle')
      .attr('fill', '#DCDCDC')
      .style('font-size', '13.5px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')

    tooltip.append('div')
        .style('font-size', '12.5px')
        .style('font-style', 'italic')
        .style('line-height', '1.5em')
        .html(d.club) // club name

    if(d.star=='Star'){
      tooltip.append('div')
        .style('font-size', '11px')
        .style('line-height', '1.5em')
        .html(d.description) // if star player, show description about him
    }

  }

})

///////////////////////////////////////////////////////////////////////////
///////////////////////////// Helper functions ////////////////////////////
///////////////////////////////////////////////////////////////////////////

function getRndBias(min, max, bias, influence) {
    var rnd = Math.random() * (max - min) + min,   // random in range
        mix = Math.random() * influence;           // random mixer
    return rnd * (1 - mix) + bias * mix;           // mix full range and bias
}

