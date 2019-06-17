var flying = function () {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 
  var simulation, circles, g, DURATION, DELAY, nodes
  var canvasDim = { width: screen.width*0.9, height: screen.height*0.9}
  var margin = {top: 50, right: 50, bottom: 50, left: 50}
  var width = canvasDim.width - margin.left - margin.right;
  var height = canvasDim.height - margin.top - margin.bottom;
  var simulation = d3.forceSimulation()
  var modal = d3.select(".content-forces")
  var modalDiv = modal.append('div')
    .attr('id', "div-content2-1")
    .attr('width', width)
    .attr('height', height)
    .attr('transform', 'translate(' + margin.left + ',' + height + ')')
    .attr('float', 'left')

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Create scales ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  var color = ["#E47D06", "#DB0131", "#AF0158", "#7F378D", "#3465A8", "#0AA174", "#7EB852"]
  var category = ["1", "2", "3", "4", "5", "6", "7"]
  var colorScale = d3.scaleOrdinal()
    .domain(category)
    .range(color)

  var xScaleCluster = d3.scaleBand()
    .domain(category)
    .range([width*(1/6), width])

  ///////////////////////////////////////////////////////////////////////////
  /////////////////////////////////// CORE //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  
  return { 
    clear : function () {
      modal.select("svg").remove()
    },
    run : function () {

      //////////////////// Set up and initiate containers ///////////////////////
      var svg = modalDiv.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)

      g = svg.append("g")
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

      ///////////////// Run animation sequence based on chosen parameters ///////////////////
      nodes = getData()
      nodes = createNodes(nodes)
      getParameters()
      cluster_align(nodes) 

      function getParameters() {
        d3.select('.run_move').on("click", function () { move_node(nodes) });
        d3.select('.run_add').on("click", function () { add_node(nodes) });
        d3.select('.reset_button').on("click", function () { reset() });
      }

      function reset() {
        simulation.stop()
        nodes = getData()
        nodes = createNodes(nodes)
        cluster_align(nodes) 
      }

    }

  }

  ///////////////////////////////////////////////////////////////////////////
  //////////////////////////// Data Processing //////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function getData() {

    var nodes = []
    d3.range(1,50).map((d,i) => {
      var rand = Math.round(randn_bm(1, 8, 1))
      nodes.push({
        'band': rand,
        'radius': 4,
        'color': color[rand-1]
      })
    })

    return nodes
  }

  function createNodes(nodes) {

    var beyondWidth = [canvasDim.width+150+Math.random(), -150+Math.random()]
    var beyondHeight = [canvasDim.height+150+Math.random(), -150+Math.random()]
    var newNodes = []
    d3.range(0, 100).map(d=> {
      var new_band = getRandomArbitrary(1,7)
      newNodes.push({
        band: new_band,
        color: color[new_band-1],
        x: beyondWidth[getRandomArbitrary(0,1)],
        y: beyondHeight[getRandomArbitrary(0,1)],
        radius: 4,
        class: 'new'
      })
    })

    nodes.push(newNodes)
    nodes = [].concat.apply([], nodes)
    nodes.forEach((d,i)=>{
      d.id = i
    })

    return nodes
  }


  ///////////////////////////////////////////////////////////////////////////
  //////////////////////////////// Cluster plot /////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  //4) Nodes are aligned along x-axis
  function cluster_align(nodes) {

    nodes.forEach(function(d) {
      d.x = d.class=='new' ? d.x : xScaleCluster(d.band)
      d.y = d.class=='new' ? d.y : height/2-100
    })

    var responsiveCharge = screen.width < 420 ? -5 : -15 // modify the force charge based on screen size
    simulation.nodes(nodes, d=>d.id)
      .force('charge', d3.forceManyBody().strength(responsiveCharge))
      .force("collide", d3.forceCollide(function(d,i) { return d.radius + 3}))
      .force("x", d3.forceX(d=>d.x).strength(0.2))
      .force("y", d3.forceY(d=>d.y).strength(0.25))
      .stop()

    for (var i = 0; i < 100; ++i) simulation.tick()

    updateCircles(nodes)

  }

  // 6) Append a mass of new nodes
  function add_node(nodes) {

    simulation.velocityDecay(0.3).alpha(0.5).restart()

    nodes.forEach(d=>{
      //d.x = d.class=='new' ? xScaleCluster(d.band) : d.x
      d.x = d.class=='new' ? xScaleCluster(d.band) : xScaleCluster(d.band) 
      //d.y = d.class=='new' ? height/2-100 : d.y
    })

    simulation.nodes(nodes, d=>d.id)
      .force('charge', d3.forceManyBody().strength(function(d) { return d.class=='new' ? -15 : 0}))
      .force("x", d3.forceX(d=>d.x).strength(0.25))
      .force('y', d3.forceY(height/2-100).strength(0.25))
      //.force('y', d3.forceY(d=>d.y).strength(0.3))
      .on("tick", onSimulationTick)


    simulation.velocityDecay(0.3).alpha(0.5).restart()

  }

  ///////////////////////////////////////////////////////////////////////////
  //////////////////////////// Updated node positions ///////////////////////
  ///////////////////////////////////////////////////////////////////////////
  function onSimulationTick() {
      g.selectAll("circle")
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);
  }

  function updateCircles(dat) {
      circles = g.selectAll("circle").data(dat);

      // For existing circles, remove the "enter" class and
      // add the "update" class.
      circles.classed("enter", false)
          .classed("update", true);

      // Add new circles to the graph.
      circles.enter()
          .append("circle")
          .classed("node", true)
          .classed("enter", true)
          .attr("id", d => d.id)
          .attr("r", d => d.radius)
          .attr("fill", d => d.color)
          .attr("cx", d => d.x)
          .attr("cy", d => d.y)
          .merge(circles)
          .attr("fill", d => d.color)
          .attr("cx", d => d.x)
          .attr("cy", d => d.y)


      circles.exit().remove();
  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Helper functions ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  function getRandomArbitrary(min, max) {
    return Math.round(Math.random() * (max - min) + min)
  }

  function randn_bm(min, max, skew) {
      var u = 0, v = 0;
      while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
      while(v === 0) v = Math.random();
      let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );

      num = num / 10.0 + 0.5; // Translate to 0 -> 1
      if (num > 1 || num < 0) num = randn_bm(min, max, skew); // resample between 0 and 1 if out of range
      num = Math.pow(num, skew); // Skew
      num *= max - min; // Stretch to fill range
      num += min; // offset to min
      return num;
  }

}()
