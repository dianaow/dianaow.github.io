var beeswarm = function () {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 

  var svg, nodes
  var canvasDim = { width: 1200, height: 600}
  var margin = {top: 30, right: 0, bottom: 20, left: 100}
  var width = canvasDim.width - margin.left - margin.right
  var height = canvasDim.height - margin.top - margin.bottom
  var modal = d3.select(".content-beeswarm")

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Create scales ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  var xScale = d3.scaleLinear()
    .domain([0, 1])
    .rangeRound([margin.left, width])

  var colorScale = d3.scaleOrdinal()
    .domain(["1", "2", "3", "4", "5", "6", "7", "8"])
    .range(['#f0f0f0','#d9d9d9','#bdbdbd','#969696','#737373','#525252','#252525','#000000'])

  var radiusScale = d3.scaleLinear()
    .domain(d3.range(1,9))
    .range(d3.range(6, 30, 3))

  ///////////////////////////////////////////////////////////////////////////
  ////////////////////// Initialize force simulation ////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  var simulation = d3.forceSimulation()  
    .force("x", d3.forceX(function(d) { return d.x }).strength(0.8))
    .force("y", d3.forceY(height / 2))
    .force("collide", d3.forceCollide(function(d,i) { return d.radius+5 }))
    .stop()

  ///////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// CORE  //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  return { 
    clear : function () {
      modal.select("svg").remove()
    },
    run : function () {

      //////////////////// Set up and initiate containers ///////////////////////
      svg = modal.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      nodes = svg.append('g')
        .attr('class', 'nodes')

      ///////////////////////// Data processing ////////////////////////////////
      shuffled = shuffle(d3.range(1,104))

      var data = shuffled.map(function(d,i) {
        return {
          id: i,
          x: xScale(getRndBias(0, 1, 0.15, 0.8)),
          y: height/2,
          score: getRndBias(0, 1, 0.15, 1),
          color: [10].indexOf(i) ? colorScale(getRandomArbitrary(1, 8).toString()) : 'red', // select nodes to be colored red
          radius: [10].indexOf(i) ? radiusScale(getRandomArbitrary(1, 8)) : 22 // red nodes fixed at radius of 22
        }
      })
        
      //////////////////////// Kick off simulation //////////////////////////////
      simulation.nodes(data)
      for (var i = 0; i < 500; ++i) simulation.tick() // let simulation run in the background

      update(data)

    }
  }

  function update(data) {

    var groups = nodes.selectAll('.node-group').data(data) // join data with new x-y coordinates after force layout does its magic on it

    var groupsEnter = groups.enter().append("g")
      .attr("class", function(d,i) { return "node-" + d.id})

    groupsEnter.append("defs").attr("id", "imgdefs")
      .append("pattern")
        .attr("id", function(d,i) { return "image-" + d.id})
        .attr("height", function(d) { return d.radius})
        .attr("width", function(d) { return d.radius})
      .append('image')
        .attr("xlink:href", function(d,i) { 
          if( d.radius < 20 ) { return null } 
          if( d.color == 'red') { return "./icons_svg/user-secret.svg" } 
          if( d.score > 0.8 ) {
            return "./icons_svg/user.svg"
          } else if ( d.score < 0.3) {
            return "./icons_svg/building.svg"
          } else {
            return "./icons_svg/handshake.svg"
          }
        })  
        .style('background-color', function(d) { return d.color })
        .attr("x", d=>d.radius/2)
        .attr("y", d=>d.radius/2)
        .attr("height", d=>d.radius)
        .attr("width", d=>d.radius)

    groupsEnter.merge(groups)
        .attr('transform', (d, i) =>
          `translate(${d.x},${d.y})` 
        ); 

    groups.exit().remove();

    groupsEnter.append('circle')
      .attr('fill-opacity', 1)
      .attr("fill", function(d) { return d.color })
      .attr('r', function (d) { return 0 })
      .merge(groups.select('circle'))
        .transition()
        .attr('r', function (d) { return d.radius })
        .attr('stroke', function(d) { return d.color })

    groupsEnter.append('circle')
      .attr('fill-opacity', 1)
      .attr("fill", function(d) { return "url(#" + ("image-" + d.id) + ")" || "grey" })
      .attr('r', function (d) { return 0 })
      .merge(groups.select('circle'))
        .transition()
        .attr('r', function (d) { return d.radius })
        .attr('stroke', function(d) { return d.color })

  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Helper functions ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function getRndBias(min, max, bias, influence) {
    var rnd = Math.random() * (max - min) + min,   // random in range
        mix = Math.random() * influence;           // random mixer
    return rnd * (1 - mix) + bias * mix;           // mix full range and bias
  }

  function getRandomArbitrary(min, max) {
    return Math.round(Math.random() * (max - min) + min)
  }

  function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
  }

}()