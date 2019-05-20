var distribute = function () {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 
  var simulation, circles, g, DURATION, DELAY, nodes, distributed, scattered
  var canvasDim = { width: screen.width*0.9, height: screen.height*0.8}
  var margin = {top: 50, right: 50, bottom: 50, left: 50}
  var width = canvasDim.width - margin.left - margin.right;
  var height = canvasDim.height - margin.top - margin.bottom;
  var simulation = d3.forceSimulation()
  var modal = d3.select(".modal-content2")
  var modalDiv = modal.append('div')
    .attr('id', "div-content2")
    .attr('width', width)
    .attr('height', height)
    .attr('float', 'left')

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Create scales ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  var color = ["#E47D06", "#DB0131", "#AF0158", "#7F378D", "#3465A8", "#0AA174", "#7EB852"]
  var category = ["1", "2", "3", "4", "5", "6", "7"]
  var colorScale = d3.scaleOrdinal()
    .domain(category)
    .range(color)

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Create sliders //////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  // Step slide from 1000 to 2000 for transition duration in steps of 100
  var sliderStepDuration = d3.sliderBottom()
    .min(1000)
    .max(2000)
    .width(300)
    .tickFormat(d3.format(''))
    .ticks(10)
    .step(100)
    .default(2000)
    .on('onchange', val => {
      d3.select('p#value-step-duration').text(d3.format('.2%')(val))
    });

  // Step slide from 5 to 50 for transition duration in steps of 5
  var sliderStepDelay = d3.sliderBottom()
    .min(5)
    .max(50)
    .width(300)
    .tickFormat(d3.format(''))
    .ticks(10)
    .step(5)
    .default(10)
    .on('onchange', val => {
      d3.select('p#value-step-delay').text(d3.format('.2%')(val));
    });

  var gStep1 = d3.select('div#slider-step1')
    .append('svg')
    .attr('width', 500)
    .attr('height', 90)
    .append('g')
    .attr('transform', 'translate(20, 20)')

  var gStep2 = d3.select('div#slider-step2')
    .append('svg')
    .attr('width', 500)
    .attr('height', 90)
    .append('g')
    .attr('transform', 'translate(20, 20)')

  gStep1.call(sliderStepDuration)
  gStep2.call(sliderStepDelay)

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
      initAllData()
      getParameters()
      run_scatter()

      function initAllData() {

        nodes = getData()
        distributed = distributedData(nodes) // run this function first to get IDs of nodes
        scattered = scatteredData(distributed) // modify x-y coordinates only

      }

      function getParameters() {

        DURATION = sliderStepDuration.value() // get current slider value
        DELAY = sliderStepDelay.value()
        d3.select('p#value-step-duration').text(d3.format('')(DURATION)); 
        d3.select('p#value-step-delay').text(d3.format('')(DELAY));
        TRANSITION_TYPE = d3.select("input[name='transition_type']:checked").property('value');

        d3.select('.run_cluster_sorted').on("click", function () { run_cluster_sorted() });
        d3.select('.run_cluster_bubbles').on("click", function () { run_cluster_bubbles() });
        d3.select('.reset_button').on("click", function () { reset() });
        d3.select('.submit_button').on("click", function () { to_distributed() });
        //console.log(TRANSITION_TYPE, DURATION, DELAY)
      }

      function run_scatter() {

        update(scattered, 'transition_by_default', DURATION, '') // transition nodes to new positions
        scatter(scattered) // run force simulation to prevent collision of nodes
        distributed.forEach((d,i) => {
          d.length = getPathLength(scattered, d)
        })

      } 

      function run_cluster_sorted() {

        cluster_sorted(scattered) // modify x-y coordinates
        distributed.forEach((d,i) => {
          d.length = getPathLength(scattered, d) // recalculate shortest distance between clustered and distributed layout for each node
        })

      } 

      function run_cluster_bubbles() {
        
        cluster_bubbles(scattered) // modify x-y coordinates
        distributed.forEach((d,i) => {
          d.length = getPathLength(scattered, d)
        })

      } 

      function to_distributed() {

        getParameters()
        simulation.stop()
        update(distributed, TRANSITION_TYPE, DURATION, DELAY)

      }

      function reset() {

        simulation.stop()
        initAllData()
        run_scatter()

      }

    }

  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////// Find length of trajectory ///////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function getPathLength(other, d) {
    var d2 = other.find(b=>b.id==d.id)
    var len = Math.sqrt((Math.pow(d.x-d2.x,2))+(Math.pow(d.y-d2.y,2)))
    return len
  } 

  ///////////////////////////////////////////////////////////////////////////
  //////////////////////////// Data Processing //////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function getData() {

    var nodes = []
    d3.range(1,201).map((d,i) => {
      var rand = Math.round(randn_bm(1, 8, 1))
      nodes.push({
        'band': rand
      })
    })

    return nodes
  }

  ///////////////////////////////////////////////////////////////////////////
  //////////////////////////////// Scatter plot /////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function scatteredData(data) {

    var xScale = d3.scaleLinear()
      .range([width/4, width])

    var yScale = d3.scaleLinear()
      .range([0, height*(1/2)])

    // modify x-y coordinates of nodes to form a scattered distribution
    var nodes = data.map(function(d, i) {
      return {
          id: d.id,
          x: xScale(+Math.random()),
          y: yScale(+Math.random()),
          color: d.color,
          band: d.band,
          radius: d.radius
      }
    })

    let xMax = d3.max(nodes, d=> +d.x) * 1.1
    let xMin = d3.min(nodes, d=> + d.x) - xMax/15
    let yMax = d3.max(nodes, d=> +d.y) * 1.1
    let yMin = d3.min(nodes, d=> + d.y) - yMax/15


    xScale.domain([xMin, xMax])
    yScale.domain([yMin, yMax])

    return nodes

  } 

  function scatter(data) {
    
    simulation = simulation.nodes(data, d=>d.id)
      .force('charge', d3.forceManyBody().strength(-20))
      .force("collide", d3.forceCollide(function(d,i) { return d.radius + 3}))
      .force("cluster", forceCluster())
      .force("x", d3.forceX(function (d) { return d.x }))
      .force("y", d3.forceY(function (d) { return d.y }))
      
    simulation.force("cluster").strength(0)

    simulation.on('tick', ticked);
    simulation.alpha(0.02).restart()

    function ticked() {
      circles
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y)
    }

  }

  ///////////////////////////////////////////////////////////////////////////
  //////////////////////////////// Cluster plot /////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  // 1) Nodes are  clustered in the middle, but not sorted
  function cluster_default() {

    simulation.stop();

    simulation
      .force('x', d3.forceX(width/2))
      .force('y', d3.forceY(height/2))
 
    simulation.alpha(0.5).restart()

  }

  // 2) Nodes are  clustered in the middle, and sorted horizontally
  function cluster_sorted(nodes) {

    var xScaleCluster = d3.scaleBand()
      .range([width*(1/4), width*(3/4)])
      .domain(category)

    simulation.stop();

    nodes.forEach(d=>{
      d.x = xScaleCluster(d.band)
    })

    simulation.nodes(nodes)
      .force('charge', d3.forceManyBody().strength(-20))
      .force("cluster", forceCluster())
      //.force('center', d3.forceCenter(width/2, height/2))
      //.force('x', d3.forceX(function (d) { return xScaleCluster(d.band) }).strength(0.3)) 
      .force('x', d3.forceX((width/4) + (width*(3/4))/2))
      .force('y', d3.forceY(height/2-100))

    simulation.force("cluster").strength(0)
    simulation.velocityDecay(0.1).alpha(0.5).restart()
 
  }

  // 3) Nodes are  clustered in the middle, but clusters pulled separately from other clusters based on their centroid
  //https://bl.ocks.org/mbostock/7881887
  function cluster_bubbles() {

    simulation.stop();

    simulation
      .force('charge', d3.forceManyBody().strength(-50))
      .force("cluster", forceCluster())
      .force('x', d3.forceX((width/4) + (width*(3/4))/2))
      .force('y', d3.forceY(height/2-100))

    simulation.force("cluster").strength(0.8)
    simulation.velocityDecay(0.5).alpha(0.5).restart()

  }

  function forceCluster() {
    var strength = 0.8;
    let nodes;

    function force(alpha) {
      const centroids = d3.rollup(nodes, centroid, d => d.band);

      const l = alpha * strength;
      for (const d of nodes) {
        const {x: cx, y: cy} = centroids.get(d.band);
        d.vx -= (d.x - cx) * l;
        d.vy -= (d.y - cy) * l;
      }
    }

    force.initialize = _ => nodes = _;
    force.strength = function(_) {
      return arguments.length ? (strength = +_, force) : strength;
    };
    return force;
  }

  function centroid(nodes) {
    let x = 0;
    let y = 0;
    let z = 0;
    for (const d of nodes) {
      let k = d.radius ** 2;
      x += d.x * k;
      y += d.y * k;
      z += k;
    }
    return {x: x / z, y: y / z};
  }

  // Drag functions used for interactivity
  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Distribution plot ///////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function distributedData(nodes) {

    var nodeRadius = 8
    var tilesPerRow = 8
    var tileSize = nodeRadius * 1.5
    var barWidth = 200

    // find count of nodes within each category 
    var counts = nodes.reduce((p, c) => {
      var name = c.band; // key property
      if (!p.hasOwnProperty(name)) {
        p[name] = 0;
      }
      p[name]++;
      return p;
    }, {});

    countsExtended = Object.keys(counts).map(k => {
      var circles_arr = nodes.filter(d=>d.band==k)
      return {name: k, count: counts[k]}; circles_arr:  circles_arr});

    // get x-y coordinates of all tiles first without rendering the dotted bar chart
    var dataAll = countsExtended.map(d=>d.count)
    var arrays = []
    dataAll.map((d,i) => {
      var tiles = getTiles(d, i)
      arrays.push(tiles)
    })
    var distributed = [].concat.apply([], arrays)

    return distributed

    function getTiles(num, counter) {
      var tiles = [];
      for(var i = 0; i < num; i++) {
        var rowNumber = Math.floor(i / tilesPerRow)
        tiles.push({
          x: ((i % tilesPerRow) * tileSize) + (counter * barWidth) + tileSize + (width/4),
          y: -(rowNumber + 1) * tileSize + height - 50, 
          color: color[counter],
          band: (counter+1).toString(),
          id: counter + '-' + i, // index each node
          radius: (tileSize/1.5)/2
        });
      }
      return tiles
    }

  }

  ///////////////////////////////////////////////////////////////////////////
  //////////////////////////// Updated node positions ///////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function update(data, type, DURATION, DELAY) {

    circles = g.selectAll('circle').data(data, d=>d.id)
    
    circles.exit().remove()

    var entered_circles = circles
      .enter()
      .append('circle')
        .style('opacity', 1)
        .attr('id', d => d.id)
        .attr('cx', function(d) {
         //console.log(d.id, d.x)
         return d.x })
        .attr('cy', d => d.y)
        .style('fill', d => d.color)
        .attr('r', d => d.radius)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))

    circles = circles.merge(entered_circles)

    var t = d3.transition()
      .duration(DURATION)
      .ease(d3.easeQuadOut)
      
    if(type=='transition_by_default'){  

      circles.transition(t)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)

    } else if(type=='transition_by_index'){

      // transition each node one by one within each group at the same time
      category.map((d,i)=> {
        circles.filter("circle[id^='" + i.toString() + "']")
          .transition(t)
          .delay(function(d,i){ return DELAY*i }) // transition each node one by one based on index
          .attr('cx', d => d.x)
          .attr('cy', d => d.y)
      })
     
    } else if(type=='transition_by_length'){

      // transition each node one by one within each group at the same time
      category.map((d,i)=> {
        circles.filter("circle[id^='" + i.toString() + "']")
          .transition(t)
          .delay(function(d,i){ return d.length*DELAY }) // transition each node one by one based on length of trajectory
          .attr('cx', d => d.x)
          .attr('cy', d => d.y)
      })

    }

  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Helper functions ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
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
