d3.csv("./data/csl_foreign_players.csv", function(csv) {

  var player, circle, path, text
  var nodes = [] // array to store ALL nodes
  var links = [] // array to store ALL links

  var multiplier = (screen.width < 1024 ? 0.75 : 0.9) 
  var screenWidth = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) * multiplier
  var screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
  var canvasDim = { width: screenWidth, height: screenHeight}

  var margin = {top: 20, right: 20, bottom: 20, left: 20}
  var width = canvasDim.width - margin.left - margin.right 
  var height = canvasDim.width - margin.top - margin.bottom 
  var radius = canvasDim.width * 0.45

  var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var data = csv.map(function(d) {
    return {
      country: d.Country,
      player: d.Player,
      club: d.Club_Name_1 + " " + d.Club_Name_2
    }
  })

  // CREATE COUNTRY NODES
  var countries = ['Brazil','Portugal', 'Germany', 'Poland', 'France', 'Argentina', 'Spain', 'South Korea', 'Uruguay', 'Colombia', 'Croatia', 'Costa Rica', 'Nigeria', 'Iceland', 'Sweden', 'Australia', 'Senegal', 'Serbia', 'Morocco', 'Tunisia', 'Belgium', 'Japan']

  var country_stats  = d3.nest()
    .key(function(d) { return d.country }).sortKeys(function(a,b) { return countries.indexOf(a) - countries.indexOf(b); }) // custom sort arrangement of country nodes to make force layout aesthetically pleasing
    .entries(data);

  country_stats.map(function(d,i) {
    var radian = (2 * Math.PI) / countries.length * i - (Math.PI / 2);
    nodes.push({
      id: d.key,
      size: 6,
      fill: 'black', // standardize empty black circle for each team
      stroke: 'black',
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
      size: d.values.length*2,
      fill: '#F4B95F', 
      stroke: '#F4B95F',
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

  var linkStrengths = [] // create custom link strength scale based on number of players from each country
  team_stats1.map(function(d,i) {
    linkStrengths.push(d.values.length)
  })

  var strengthScale = d3.scaleLinear()
    .domain([d3.min(linkStrengths), d3.max(linkStrengths)])
    .range([0, 1])

  team_stats1.map(function(d,i) {
    var radian = (2 * Math.PI) / countries.length * i - (Math.PI / 2);
    d.values.map(x => {
      // CREATE A NODE FOR EACH PLAYER
      var node = {
        text: x.player,
        id: x.player.replace(/[^A-Z0-9]+/ig, "_") + "/" + x.club.replace(/[^A-Z0-9]+/ig, "_"),
        size: 2,
        fill: 'grey',
        stroke: 'none',
        type: 'player',
        x: radius-40 * Math.cos(radian) + (width / 2),
        y: radius-40 * Math.sin(radian) + (height / 2)       
      }
      nodes.push(node)
      // CREATE COUNTRY-PLAYER LINKS
      links.push({
        source: countryNodes_nested.find(n=>n.key == x.country).values[0],
        target: node,
        size: 0.5,
        strength: 0.5,
        stroke: 'lightgrey',
        type: 'country_player',
        // remove spaces because they cannot be contained in class/id names
        id: x.country.replace(/[^A-Z0-9]+/ig, "_") + "/" + x.player.replace(/[^A-Z0-9]+/ig, "_") + x.club.replace(/[^A-Z0-9]+/ig, "_")
      })
      // CREATE PLAYER-TEAM LINKS
      links.push({
        source: node,
        target: nodes.filter(d=>d.type=='team').find(n=>n.id == x.club),
        size: 0.5,
        strength: strengthScale(d.values.length),
        stroke: '#F4B95F',
        type: 'player_team',
        id: x.player.replace(/[^A-Z0-9]+/ig, "_") + "/" + x.club.replace(/[^A-Z0-9]+/ig, "_")
      })
    })
  })

  enter() // create DOM elements

  // Initialize force simulation
  var simulation1 = d3.forceSimulation()
    .force("link", d3.forceLink()
      .id(function(d) { return d.id; })
      .strength(function(d) {return d.strength})
      .distance(40)
    )
    .force("collide", d3.forceCollide().radius(function(d) { return d.size * 1.3 }))
    //.force("collide", d3.forceCollide().radius(function(d) { return d.type == 'team' ?  d.size * 2 : d.size * 1.3 }))

  simulation1
      .nodes(nodes)
      .on("tick", update) // start simulation to update node positions

  simulation1.force("link")
      .links(links)

  function enter() {

    path = svg.selectAll('line')
      .data(links).enter().append('line')
      .attr('stroke-linecap', 'round')

    circle = svg.selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('stroke-width', 2)

    text_country = svg.selectAll('.text_country')
      .data(nodes.filter(d=>d.type=='country'))
      .enter().append('text')
      .attr('class', 'text_country')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#555')
      .style('font-size', '12px')
      .style('font-family', 'Helvetica')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')

    text_team = svg.selectAll('text_team')
      .data(nodes.filter(d=>(d.type=='team') & (d.size>10)))
      .enter().append('text')
      .attr('class', 'text_text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#555')
      .style('font-size', '12px')
      .style('font-weight', 'normal')
      .style('pointer-events', 'none')

    text_player = svg.selectAll('text_player')
      .data(nodes.filter(d=>d.type=='player'))
      .enter().append('text')
      .attr('class', 'text_player')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#555')
      .style('font-size', '10px')
      .style('font-weight', 'normal')
      .style('pointer-events', 'none')
      .style('opacity', 0)

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
      .attr('y', function(d) {return d.y + 15})
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

    text_player.attr('x', function(d) {return d.x})
      .attr('y', function(d) {return d.y})
      .attr('id', function(d) {return d.id}) 
      .text(function(d) {return d.text})
  
    interactive()
  }

  function interactive() {
    d3.selectAll('.team').on('mouseover', function (l) {

      d3.selectAll(".country_player").style('opacity', 0) // make all country-player links invisible
      d3.selectAll(".player_team").style('opacity', 0) // make all player-team links invisible
      d3.selectAll('.team').style('opacity', 0) // make all team nodes invisible
      d3.selectAll('.player').style('opacity', 0) // make all player nodes invisible
      
      text1.style('opacity', 0) // make all team node labels invisible
      text2.style('opacity', 0) // make all team node labels invisible

      // only select links and nodes connected to specific team node hovered upon visible
      d3.selectAll("line[id*='" + l.id.replace(/[^A-Z0-9]+/ig, "_") + "']")
        .each(function(d,i) {
          var player = d3.select(this).attr('id')
          d3.selectAll("line[id*='" + player + "']")
            .style('opacity', 1)
          //var textPlayers = d3.selectAll("text[id*='" + player + "']")
            //.style('opacity', 1)
          d3.selectAll("circle[id*='" + player + "']")
            .style('opacity', 1) 

        })

      // only select node labels for the specific team node hovered upon visible
      d3.selectAll("#" + l.id.replace(/[^A-Z0-9]+/ig, "_")).style('opacity', 1)
      d3.selectAll("circle[id*='" + l.id + "']").style('opacity', 1)

    })
    .on('mouseout', function (l) {

      d3.selectAll(".country_player").style('opacity', 1) 
      d3.selectAll(".player_team").style('opacity', 1) 
      d3.selectAll('.team').style('opacity', 1) 
      d3.selectAll('.player').style('opacity', 1) 
      
      text1.style('opacity', 1) 
      text2.style('opacity', 1) 
      text_player.style('opacity', 0) 

    })
  }

})


