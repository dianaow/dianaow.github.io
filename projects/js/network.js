var network = function () {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 
  var simulation, circle, path, g, pathG, circleG
  var canvasDim = { width: 900, height: 900}
  var margin = {top: 0, right: 0, bottom: 0, left: 0}
  var width = canvasDim.width - margin.left - margin.right;
  var height = canvasDim.height - margin.top - margin.bottom;
  var modal = d3.select("#chart")

  // set node, link and text colors
  var nodeFillColor = 'mediumblue'
  var nodeStrokeColor = 'mediumblue'
  var linkStrokeColor = 'mediumblue'

  // set node, link and text dimenstions
  var nodeRadius = 6
  var nodeStrokeWidth = 1
  var linkStrokeWidth = 0.6
  var linkOpacity = 1

  var clicked = 1

  ///////////////////////////////////////////////////////////////////////////
  /////////////////////////////////// CORE //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  return { 
    clear : function () {
      modal.select("svg").remove()
    },
    run : function () {

      //////////////////// Set up and initiate containers ///////////////////////
      var svg = modal.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)

      g = svg.append("g")
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

      pathG = g.append("g")
        .attr("class", "pathG")

      circleG = g.append("g")
        .attr("class", "circleG")

      ////////////////////////// Run animation sequence /////////////////////////
      getData()

    }
  }

  ///////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Data Processing ///////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function getData() {

    d3.queue() 
      .defer(d3.csv, './data/nodes_dummy.csv') // there are more nodes than links
      .defer(d3.csv, './data/links_dummy.csv')   
      .await(initialize);  

  }

  function initialize(error, entity, edges){

    var nodes = entity.map((d,i) => {
      return {
        id: +d.index,
        type: d.type,
        root: d.root
      } 
    })

    var links = edges.map((d,i) => {
      return {
        id: i,
        source: +d.start_index,
        target: +d.end_index,
        relationship_distance: +d.relationship_distance
      }
    })

    var links_nested = d3.nest()
      .key(function(d) { return d.source; })
      .rollup(function(leaves) { return leaves.length; })
      .entries(links)

    var linkStrengths = [] // create custom link strength scale based on number of connected nodes to each source
    links_nested.map(function(d,i) {
      linkStrengths.push(d.value)
    })

    var strengthScale = d3.scaleLinear()
      .domain([d3.min(linkStrengths), d3.max(linkStrengths)])
      .range([0.25, 0.7])

    var nodeRadiusScale = d3.scaleLinear()
      .domain([d3.min(linkStrengths), d3.max(linkStrengths)])
      .range([nodeRadius, nodeRadius*4])

   var opacityScale = d3.scaleLinear()
    .domain([1, 3])
    .range([1, 0.3])

    // Match relationship distance to nodes
    nodes.forEach((d,i) => {
      var e = links.find(b=>b.source == d.id) || links.find(b=>b.target == d.id)
      d.relationship_distance = e ? e.relationship_distance : 0
      d.connected = e ? 'yes' : 'no'
    })

    nodes = nodes.filter(d=>d.connected=='yes') // Match links to nodes (prevent stray nodes not connected to other entities from being rendered)

    nodes.forEach((d,i) => {
      d.color = nodeFillColor
      d.strokeColor = d.score==1 ? 'black' : nodeStrokeColor
      d.strokeWidth = d.root=='root' ? nodeStrokeWidth+3 : nodeStrokeWidth
      d.opacity = opacityScale(d.relationship_distance)
      d.radius = links_nested.find(l=>l.key==d.id) ? nodeRadiusScale(links_nested.find(l=>l.key==d.id).value) : nodeRadius
    })

    links.forEach((d,i) => {
      var conn = links_nested.find(l=>l.key==d.source).value
      //d.strength = 0.3
      //d.strength = (conn> 1 & conn>4) ? 0.8 : strengthScale(conn) 
      d.strength = strengthScale(conn) 
      d.strokeColor = linkStrokeColor
      d.strokeWidth = linkStrokeWidth
      d.opacity = opacityScale(d.relationship_distance)
    })

    simulateNetwork(nodes, links)        

    d3.select('.morph').on("click", function () { clicked==1 ? simulateNetwork(nodes, links) : morph(nodes, links) })

  }

  ///////////////////////////////////////////////////////////////////////////
  /////////// Initialize force simulation and set its params ////////////////
  ///////////////////////////////////////////////////////////////////////////

  function simulateNetwork(nodes, links) {

    let startTime = +Date.now();

    var linkDistance = function(d) { return d.source.radius*3 + d.target.radius*9 }

    simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links)
        .id(function(d) { return d.id; })
        .distance(linkDistance)
        .strength(function(d) {return d.strength})
      )
      .force("charge", d3.forceManyBody())
      .force("collide", d3.forceCollide(function(d){ return d.radius * 1.4 }))
      .force('center', d3.forceCenter(width/2, height*(2/5)))
      //.force("x", d3.forceX(function (d) { return d.x }).strength(0.2))
      //.force("y", d3.forceY(function (d) { return d.y }).strength(0.2))
      //.force("x", d3.forceX(function (d) { return width/2 }).strength(0.2))
      //.force("y", d3.forceY(function (d) { return height/2 }).strength(0.2))

    simulateStatic(nodes, links, simulation, startTime)

    clicked=2

  }
  
  ///////////////////////////////////////////////////////////////////////////
  //////////////////////////// Graph Network plot ///////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function simulateStatic(nodes, links, simulation, startTime) {

      simulation.stop();

      while (simulation.alpha() > simulation.alphaMin()) {
          simulation.tick();
      }

      // The simulation has been completed. Draw the final product and update the timer.
      drawNodes(nodes)
      if(links){
        drawLinks(links)
      }

  }

  //////////////////////// Create node and link elements ////////////////////
  function drawNodes(nodes) {

    circle = circleG.selectAll('circle').data(nodes, d=>d.id)

    circle.exit().remove()

    var entered_circles = circle
      .enter().append('circle')
      .attr('id', function(d) {return d.id}) 
      .attr('r', function(d) {return d.radius})
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .attr('stroke-width', function(d) {return d.strokeWidth})
      .attr('stroke', function(d) {return d.strokeColor})
      .attr('stroke-opacity', function(d) { return d.opacity})
      .attr('fill-opacity', function(d) { return d.opacity})
      .attr('fill', function(d) {return d.color})
      
    circle = circle.merge(entered_circles)

    circle.transition().duration(2000).ease(d3.easeQuadOut)
      .attr('r', function(d) {return d.radius})
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .attr('fill-opacity', function(d) { return d.opacity})
      .attr('fill', function(d) {return d.color})

  }

  function drawLinks(links) {

    path = pathG.selectAll('line').data(links, d=>d.id)

    path.exit().remove()

    var entered_path = path
      .enter().append('line')
      .attr('id', function(d) { return d.source.id.toString() + "-" + d.target.id.toString()})
      .attr('stroke-width', function(d) {return d.strokeWidth})
      .attr('stroke', function(d) {return d.strokeColor})
      .attr('stroke-opacity', function(d) {return d.opacity})
      .attr('x1', function(d) {return d.source.x})
      .attr('y1', function(d) {return d.source.y})
      .attr('x2', function(d) {return d.target.x})
      .attr('y2', function(d) {return d.target.y})


    path = path.merge(entered_path)

    path.transition().duration(2000).ease(d3.easeQuadOut)
      .attr('stroke-opacity', function(d) {return d.opacity})
      .attr('x1', function(d) {return d.source.x})
      .attr('y1', function(d) {return d.source.y})
      .attr('x2', function(d) {return d.target.x})
      .attr('y2', function(d) {return d.target.y})
      
  }

  function morph(nodes, links) {

    let startTime = +Date.now();

    var simulation1 = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links)
        .id(function(d) { return d.id; })
      )
      .force("charge", d3.forceManyBody())
      .force('center', d3.forceCenter(width/2, height*(2/5)))
      .force('collision', d3.forceCollide().radius(function(d) { return d.radius }))

    simulateStatic(nodes, links, simulation1, startTime)

    clicked=1

  }

}()