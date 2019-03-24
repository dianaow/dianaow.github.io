d3.csv("./data/csl_foreign_players.csv", function(csv) {

  var player, circle, path, text
  var radius = 350
  var margin = {top: 20, right: 100, bottom: 20, left: 100}
  var width = 1024 - margin.left - margin.right
  var height = 968 - margin.top - margin.bottom

  var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var data = csv.map(function(d) {
    return {
      country: d.Country,
      player: d.Player,
      star: d.Star_Player,
      club: d.Club_Name_1 + " " + d.Club_Name_2
    }
  })

  //var countries = ['Germany', 'Brazil', 'Belgium', 'Portugal', 'Argentina', 'Switzerland','France', 'Poland', 'Spain', 'Peru', 'Denmark', 'England', 'Uruguay', 'Colombia', 'Croatia', 'Tunisia', 'Iceland', 'Costa Rica', 'Sweden', 'Senegal', 'Serbia', 'Australia', 'Iran', 'Morocco', 'Egypt', 'Nigeria', 'South Korea', 'Japan']

  var countries = ['Germany', 'Brazil', 'Belgium', 'Portugal', 'England', 'Poland','France', 'Argentina', 'Spain', 'Peru', 'South Korea', 'Switzerland', 'Uruguay', 'Colombia', 'Croatia', 'Costa Rica', 'Iceland', 'Nigeria', 'Sweden', 'Senegal', 'Serbia', 'Australia', 'Iran', 'Morocco', 'Egypt', 'Tunisia', 'Denmark', 'Japan']

  var country_stats  = d3.nest()
    .key(function(d) { return d.country }).sortKeys(function(a,b) { return countries.indexOf(a) - countries.indexOf(b); })
    .entries(data);

  var countryNodes = []
  country_stats.map(function(d,i) {
      var radian = (2 * Math.PI) / countries.length * i - (Math.PI / 2);
      countryNodes.push({
        id: d.key,
        size: 6,
        fill: 'none', // standardize empty black circle for each team
        stroke: 'black',
        type: 'country',
        fx: radius * Math.cos(radian) + (width / 2),
        fy: radius * Math.sin(radian) + (height / 2)
      })
  })

  var team_stats = d3.nest()
    .key(function(d) { return d.club })
    .key(function(d) { return d.country })
    .rollup(function(leaves) { return leaves.length })
    .entries(data)

  var linkStrengths = []
    team_stats.map(function(d,i) {
      d.values.map(x => {
        linkStrengths.push(x.value)
    })
  })

  var strengthScale = d3.scaleLinear()
    .domain([d3.min(linkStrengths), d3.max(linkStrengths)])
    .range([0, 1])

  var countryNodes_nested = d3.nest()
    .key(function(d) { return d.id })
    .entries(countryNodes)

  var teamNodes = []
  var links = []
  team_stats.map(function(d,i) {
    var node = {
      id: d.key,
      size: d.values.length*2,
      fill: 'none', // standardize empty black circle for each team
      stroke: 'blue',
      type: 'team',
      x: width/2,
      y: height/2
    }
    teamNodes.push(node)
    d.values.map(x => {
      links.push({
        source: node,
        target: countryNodes_nested.find(n=>n.key == x.key).values[0],
        size: 0.2,
        strength: strengthScale(x.value),
        stroke: 'blue'
      })
    })
  })
  
  var team_stats1 = d3.nest()
    .key(function(d) { return d.club })
    .entries(data)

  var nodes = countryNodes.concat(teamNodes)

  enter()

  // Initialize force simulation
  var simulation = d3.forceSimulation()
    .force("link", d3.forceLink()
      .id(function(d) { return d.id; })
      .strength(function(d) {return d.strength})
    )
    .force("collide", d3.forceCollide().radius(function(d) { return d.size }))
    //.force("charge", function(d) {return d.type === 'country' ? -100 : -Math.pow(d.size, 10)})

  simulation
      .nodes(nodes)
      .on("tick", update)

  simulation.force("link")
      .links(links)

  var simulation1 = d3.forceSimulation()
    //.force("charge", d3.forceManyBody().strength(-300))
    .force("collide", d3.forceCollide().radius(4))

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
      .style('font-family', 'Helvetica')
      .style('font-weight', 'normal')
      .style('pointer-events', 'none')

    circle.each(function (nodeElement) {
      if(countries.indexOf(nodeElement.id) < 0){
        var idx = nodeElement.id.replace(/[^A-Z0-9]+/ig, "_")
        var data_filtered = team_stats1.filter(d=>d.key==nodeElement.id)[0].values
        svg.selectAll('#' + idx + '.team_players')
          .data(data_filtered)
          .enter().append('circle')
            .attr("class", "team_players")
            .attr('id', idx)
            .attr("r", 3)
            .attr("fill", 'grey')
            .attr("stroke", 'none')
            .attr("stroke-width", 0)  
      }
    })
  }

  function update() {

    path.attr('stroke-width', function(d) {return d.size})
      .attr('stroke', function(d) {return d.stroke})
      .attr('fill', function(d) {return d.stroke})
      .attr('x1', function(d) {return d.source.x})
      .attr('y1', function(d) {return d.source.y})
      .attr('x2', function(d) {return d.target.x})
      .attr('y2', function(d) {return d.target.y})

    circle.attr('r', function(d) {return d.size})
      .attr('fill', function(d) {return d.fill || '#fff'})
      .attr('stroke', function(d) {return d.stroke || 'none'})
      .attr('cx', function(d) {return d.x})
      .attr('cy', function(d) {return d.y})
      .attr('id', function(d) {return d.id.replace(/[^A-Z0-9]+/ig, "_")})

    text_country.attr('x', function(d) {return d.x})
      .attr('y', function(d) {return d.y + 15})
      .text(function(d) {return d.id})
  
    text_team.attr('x', function(d) {return d.x})
      .attr('y', function(d) {return d.y-d.size/2})
      .text(function(d) {return d.id})  

    circle.each(function (nodeElement) {
      if(countries.indexOf(nodeElement.id) < 0){
        var idx = nodeElement.id.replace(/[^A-Z0-9]+/ig, "_")
        var data_filtered = team_stats1.filter(d=>d.key==nodeElement.id)[0].values
        data_filtered.forEach((d,i) => {
          d.x = nodeElement.x
          d.y = nodeElement.y
        })

        var player = svg.selectAll('#' + idx + '.team_players')
          .data(data_filtered)
          .attr('cx', function(d) {return d.x})
          .attr('cy', function(d) {return d.y}) 

        simulation1
          .nodes(data_filtered)
        
         for (var i = nodes.length * nodes.length; i > 0; --i) simulation1.tick();

      }
    })

  }

})
