d3.csv("./data/csl_foreign_players.csv", function(csv) {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 

  var player, circle, path, text_country, text_team, text_player, entered_nodes, simulation1, simulation2
  var countries = ['Brazil','Portugal', 'Germany', 'Poland', 'France', 'Argentina', 'Spain', 'South Korea', 'Uruguay', 'Colombia', 'Croatia', 'Costa Rica', 'Nigeria', 'Iceland', 'Sweden', 'Australia', 'Senegal', 'Serbia', 'Morocco', 'Tunisia', 'Belgium', 'Japan']
  var nodes = [] // array to store ALL nodes
  var links = [] // array to store ALL links

  // responsive design: modify network chart radius based on device's screen width
  if (mobile) {
    var multiplier = 1
  } else if (ipad_landscape) {
    var multiplier = 0.8
  } else if (ipad_portrait) {
    var multiplier = 1
  } else if (ipadPRO_landscape) {
    var multiplier = 0.8
  } else {
    var multiplier = 1
  }

  var screenWidth = 900 * multiplier
  var screenHeight = 900
  var canvasDim = { width: screenWidth, height: screenHeight}
  var margin = {top: 20, right: 20, bottom: 20, left: 20}
  var width = canvasDim.width - margin.left - margin.right 
  var height = canvasDim.width - margin.top - margin.bottom 
  var radius = canvasDim.width * 0.45

  // set node, link and text colors
  var teamFillColor = 'darkorange'
  var teamStrokeColor = 'darkorange'
  var teamText = '#212121'
  var playerFillColor = '#212121'
  var playerStrokeColor = 'darkorange'
  var playerText = '#212121'
  var countryFillColor = '#DCDCDC'
  var countryStrokeColor = 'navy'
  var countryText = 'navy'
  var country_player_StrokeColor = '#212121'
  var player_team_StrokeColor = 'darkorange'

  // set node, link and text dimenstions
  var playerRadius = 2
  var countryRadius = 32
  var country_player_StrokeWidth = 0.3
  var player_team_StrokeWidth = 0.5

  ///////////////////////////////////////////////////////////////////////////
  //////////////////// Set up and initiate containers ///////////////////////
  /////////////////////////////////////////////////////////////////////////// 

  var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var pathG = svg.append("g")
    .attr("class", "pathG")

  var circleG = svg.append("g")
    .attr("class", "circleG")

  var textG = svg.append("g")
    .attr("class", "textG")

  ///////////////////////////////////////////////////////////////////////////
  /////////////////////////// Data Processing ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  var data = csv.map(function(d) {
    return {
      country: d.Country,
      player: d.Player,
      club: d.Club_Name_1 + " " + d.Club_Name_2
    }
  })

  // CREATE COUNTRY NODES
  var country_stats  = d3.nest()
    .key(function(d) { return d.country }).sortKeys(function(a,b) { return countries.indexOf(a) - countries.indexOf(b); }) // custom sort arrangement of country nodes to make force layout aesthetically pleasing
    .entries(data);

  country_stats.map(function(d,i) {
    var radian = (2 * Math.PI) / countries.length * i - (Math.PI / 2);
    nodes.push({
      id: d.key,
      size: countryRadius,
      fill: countryFillColor,
      stroke: countryStrokeColor,
      strokeWidth: 2,
      type: 'country',
      fx: radius * Math.cos(radian) + (width / 2),
      fy: radius * Math.sin(radian) + (height / 2)
    })
  })

  // CREATE TEAM NODES
  var team_stats = d3.nest()
    .key(function(d) { return d.club })
    .key(function(d) { return d.country })
    .rollup(function(leaves) { return leaves.length })
    .entries(data)

  team_stats.map(function(d,i) {
    nodes.push({
      id: d.key,
      size: d.values.length*2, // size of team node is dependent on the number of players within each team
      fill: teamFillColor, 
      stroke: teamStrokeColor,
      strokeWidth: 2,
      type: 'team',
      x: width/2,
      y: height/2
    })
  })
 
  var countryNodes_nested = d3.nest()
    .key(function(d) { return d.id })
    .entries(nodes.filter(d=>d.type=='country'))

  var team_stats1 = d3.nest()
    .key(function(d) { return d.country })
    .entries(data)

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Create scales ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  var linkStrengths = [] // create custom link strength scale based on number of players from each country
  team_stats1.map(function(d,i) {
    linkStrengths.push(d.values.length)
  })

  var strengthScale = d3.scaleLinear()
    .domain([d3.min(linkStrengths), d3.max(linkStrengths)])
    .range([0, 1])

  ///////////////////////////////////////////////////////////////////////////
  ////////////////// Data Processing - Continued... /////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  team_stats1.map(function(d,i) {
    var radian = (2 * Math.PI) / countries.length * i - (Math.PI / 2);
    d.values.map(x => {
      // CREATE A NODE FOR EACH PLAYER
      var node = {
        id: x.player.replace(/[^A-Z0-9]+/ig, "_") + "/" + x.club.replace(/[^A-Z0-9]+/ig, "_"),
        size: playerRadius,
        fill: playerFillColor,
        stroke: playerStrokeColor,
        strokeWidth: 0.5,
        type: 'player',
        x: radius-40 * Math.cos(radian) + (width / 2),
        y: radius-40 * Math.sin(radian) + (height / 2),
        text: x.player     
      }
      nodes.push(node)
      // CREATE COUNTRY-PLAYER LINKS
      links.push({
        id: x.country.replace(/[^A-Z0-9]+/ig, "_") + "/" + x.player.replace(/[^A-Z0-9]+/ig, "_") + x.club.replace(/[^A-Z0-9]+/ig, "_"), // remove spaces because they cannot be contained in class/id names
        source: countryNodes_nested.find(n=>n.key == x.country).values[0],
        target: node,
        size: country_player_StrokeWidth,
        stroke: country_player_StrokeColor,
        strength: 0.5,
        type: 'country_player'
      })
      // CREATE PLAYER-TEAM LINKS
      links.push({
        id: x.player.replace(/[^A-Z0-9]+/ig, "_") + "/" + x.club.replace(/[^A-Z0-9]+/ig, "_"),
        source: node,
        target: nodes.filter(d=>d.type=='team').find(n=>n.id == x.club),
        size: player_team_StrokeWidth,
        stroke: player_team_StrokeColor,
        strength: strengthScale(d.values.length),
        type: 'player_team'
      })
    })
  })

  ///////////////////////////////////////////////////////////////////////////
  //////////////////// Initialize force simulation //////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  simulation1 = d3.forceSimulation()
    .force("link", d3.forceLink()
      .id(function(d) { return d.id; })
      .strength(function(d) {return d.strength})
      .distance(40)
    )
    .force("collide", d3.forceCollide().radius(function(d) { return d.size * 1.3 }))
    .stop()

  simulation1
      .nodes(nodes)
      .on("tick", update) // start simulation to update node positions

  simulation1.force("link")
      .links(links)

  for (var i = 0; i < 100; ++i) simulation1.tick()
  simulation1.alpha(1).alphaDecay(0.1).restart()

  ///////////////////////////////////////////////////////////////////////////
  //////////////////////////////////// CORE /////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  enter() 

  function enter() {

    path = pathG.selectAll('line')
      .data(links).enter().append('line')
      .attr('stroke-linecap', 'round')

    circle = circleG.selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('stroke-width', d=>d.strokeWidth) 

    text_country = textG.selectAll('.text_country')
      .data(nodes.filter(d=>d.type=='country'))
      .enter().append('text')
      .attr('class', 'text_country')
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .attr('fill', countryText)
      .style('font-size', '13.5px')
      .style('font-family', 'Helvetica')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')

    text_team = textG.selectAll('text_team')
      .data(nodes.filter(d=>(d.type=='team') & (d.size>10)))
      .enter().append('text')
      .attr('class', 'text_team')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', teamText)
      .style('font-size', '12px')
      .style('font-weight', 'normal')
      .style('pointer-events', 'none')

    text1 = text_team.append('tspan')
    text2 = text_team.append('tspan')

  }

  function update() {

    path.attr('stroke-width', function(d) {return d.size})
      .attr('stroke', function(d) {return d.stroke})
      .attr('fill', function(d) {return d.stroke})
      .attr('x1', function(d) {return d.source.x})
      .attr('y1', function(d) {return d.source.y})
      .attr('x2', function(d) {return d.target.x})
      .attr('y2', function(d) {return d.target.y})
      .attr('class', function(d) {return d.type})
      .attr('id', function(d) {return d.id})

    circle.attr('r', function(d) {return d.size})
      .attr('stroke', function(d) {return d.stroke || 'none'})
      .attr('fill', function(d) {return d.fill || '#fff'})
      .attr('cx', function(d) {return d.x})
      .attr('cy', function(d) {return d.y})
      .attr('class', function(d) {return d.type})
      .attr('id', function(d) {return d.id}) 

    text_country.attr('x', function(d) {return d.x})
      .attr('y', function(d) {return d.y})
      .attr('id', function(d) {return d.id}) 
      .text(function(d) {return d.id})
      
    text1.attr('x', function(d) {return d.x})
      .attr('y', function(d) {return d.y-8})
      .attr('id', function(d) {return d.id.replace(/[^A-Z0-9]+/ig, "_")}) 
      .text(function(d) {return d.id.split(' ')[0]})  

    text2.attr('x', function(d) {return d.x})
      .attr('y', function(d) {return d.y+8})
      .attr('id', function(d) {return d.id.replace(/[^A-Z0-9]+/ig, "_")}) 
      .text(function(d) {return d.id.split(' ')[1]})  
  
    interactive()
  }

  function updatePlayerText() {
    text_player.attr('x', function(d) {return d.x})
      .attr('y', function(d) {return d.y})
      .attr('id', function(d) {return d.id}) 
      .text(function(d) {return d.text})
      .style('opacity', 1)

    selCircles.attr('cx', function(d) {return d.x})
      .attr('cy', function(d) {return d.y})

    selLines.attr('x1', function(d) {return d.source.x})
      .attr('y1', function(d) {return d.source.y})
      .attr('x2', function(d) {return d.target.x})
      .attr('y2', function(d) {return d.target.y})
  }

  function interactive() {

    d3.selectAll('.team').on('mouseover', function (l) {

      d3.select(this).style("cursor", "pointer") 
      d3.selectAll(".country_player").style('opacity', 0) // make all country-player links invisible
      d3.selectAll(".player_team").style('opacity', 0) // make all player-team links invisible
      d3.selectAll('.team').style('opacity', 0) // make all team nodes invisible
      d3.selectAll('.player').style('opacity', 0) // make all player nodes invisible
      
      text1.style('opacity', 0) // make all team node labels invisible
      text2.style('opacity', 0) // make all team node labels invisible

      var players = nodes.filter(d=>d.id.includes(l.id.replace(/[^A-Z0-9]+/ig, "_"))===true)

      text_player = textG.selectAll('.text_player').data(players)
      selCircles = circleG.selectAll("circle[id*='" + l.id.replace(/[^A-Z0-9]+/ig, "_") + "']")
      selLines = pathG.selectAll("line[id*='" + l.id.replace(/[^A-Z0-9]+/ig, "_") + "']")

      simulation2 = d3.forceSimulation()
        .force("collide", bboxCollision([[-4,-8],[4,8]]))
        .on("tick", updatePlayerText)

      entered_nodes = text_player.enter().append('text')
        .attr('class', 'text_player')
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .attr('fill', playerText)
        .style('font-size', '10px')
        .style('font-weight', 'normal')

      simulation1.stop()

      simulation2.nodes(players)
      text_player = text_player.merge(entered_nodes)
      simulation2.alpha(1).restart()

      // only select links and nodes connected to specific team node hovered upon visible
      pathG.selectAll("line[id*='" + l.id.replace(/[^A-Z0-9]+/ig, "_") + "']")
        .each(function(d,i) {
          var player = d3.select(this).attr('id')
          pathG.selectAll("line[id*='" + player + "']")
            .style('opacity', 1)
          circleG.selectAll("circle[id*='" + player + "']")
            .style('opacity', 1) 
            .attr('fill', 'none')
            .attr('r', 8)

        })

      // only select node labels for the specific team node hovered upon visible
      textG.selectAll("#" + l.id.replace(/[^A-Z0-9]+/ig, "_")).style('opacity', 1)
      circleG.selectAll("circle[id*='" + l.id + "']").style('opacity', 1)

    })
    .on('mouseout', function (l) {

      d3.select(this).style("cursor", "default")
      d3.selectAll(".country_player").style('opacity', 1) 
      d3.selectAll(".player_team").style('opacity', 1) 
      d3.selectAll('.team').style('opacity', 1) 
      d3.selectAll('.player').style('opacity', 1) 
      
      text1.style('opacity', 1) 
      text2.style('opacity', 1) 

      simulation2.stop()

      pathG.selectAll("line[id*='" + l.id.replace(/[^A-Z0-9]+/ig, "_") + "']")
        .each(function(d,i) {
          var player = d3.select(this).attr('id')
          textG.selectAll("text[id*='" + player + "']")
            .style('opacity', 0)
          circleG.selectAll("circle[id*='" + player + "']")
            .attr('fill', playerFillColor)
            .attr('r', 2)
        })

      simulation1
          .nodes(nodes)
          .on("tick", update) // start simulation to 'return' node positions back to original

      simulation1.force("link")
          .links(links)

      simulation1.alpha(1).restart()

    })
  }

})


