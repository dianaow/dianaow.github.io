var merge = function () {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 
  var simulation, circles, g
  var canvasDim = { width: 1200, height: 600}
  var margin = {top: 0, right: 0, bottom: 0, left: 0}
  var width = canvasDim.width - margin.left - margin.right;
  var height = canvasDim.height - margin.top - margin.bottom;
  var modal = d3.select(".content-merge")

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Create scales ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  var color = ['#f0f0f0','#d9d9d9','#bdbdbd','#969696','#737373','#525252','#252525','#000000']
  var colorScale = d3.scaleOrdinal()
    .domain(["1", "2", "3", "4", "5", "6", "7", "8"])
    .range(color)

  var radiusScale = d3.scaleLinear()
  .domain(d3.range(1,5))
  .range(d3.range(3, 15, 3))

  var xScale = d3.scaleLinear()
    .range([0, width])
    
  var yScale = d3.scaleLinear()
    .range([0, height])

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

      ////////////////////////// Run animation sequence /////////////////////////
      execute1000(function() {
        scatter(); // kick off simulation
        execute(function() {
          cluster()
          execute(function() {
          inject()
          execute(function() {
            infect()
            execute(function() {
              migrate()
            })
          })
         })
       })
      })

    }
  }

  ///////////////////////////////////////////////////////////////////////////
  /////////////////////// Modify simulation params //////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function scatter() {

    var dummyData = []
    d3.range(1,4).map((d,i) => {
      dummyData.push({"outcome": 1, 'color': 'red', 'radius': 15, 'label':i})
    })
    d3.range(1,201).map((d,i) => {
      dummyData.push({"outcome": 0, 'color': colorScale(getRandomArbitrary(1, 8).toString()), 'radius': radiusScale(getRandomArbitrary(1, 5))})
    })

    nodes = dummyData.map(function (d, i) {
      return {
          id: i,
          outcome: d.outcome,
          x: +Math.random(),
          y: +Math.random(),
          color: d.color,
          radius: d.radius
      }
    })

    let xMax = d3.max(nodes, d=> +d.x) * 1.1
    let xMin = d3.min(nodes, d=> + d.x) - xMax/15
    let yMax = d3.max(nodes, d=> +d.y) * 1.1
    let yMin = d3.min(nodes, d=> + d.y) - yMax/15

    xScale.domain([xMin, xMax])
    yScale.domain([yMin, yMax])

    // change some nodes to red color
    var nodesToRed = [10, 20, 30, 40, 60, 70, 80, 90, 110, 120, 130, 140, 160, 170, 180, 190]
    // hide all nodes except for three random nodes
    var nodesToHighlight = [50, 100, 150]
    nodes.forEach(d=>{
      d.infect = (nodesToRed.indexOf(d.id)!=-1 && d.radius > 9) ? 1 : 0,
      d.fadeOut = nodesToHighlight.indexOf(d.id) == -1 ? true : false,
      d.x = xScale(d.x),
      d.y = yScale(d.y)
    })

    circles = g.selectAll('circle').data(nodes)

    var entered_circles = circles
        .enter()
        .append('circle')
          .attr('class', d=> 'infected-' + d.infect)
          .attr('id', d=> 'fadeOut-' + d.fadeOut)
          .style('opacity', 1)
          .attr('cx', (d) => d.x)
          .attr('cy', (d) => d.y)

    circles = circles.merge(entered_circles)

    circles.transition()
      .duration(1500)
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .style('fill', function (d) { return d.color })
      .attr('r', function (d) { return d.radius })
    
    simulation = d3.forceSimulation(nodes)
      .alpha(.02)
      .force('charge', d3.forceManyBody().strength(-30))
        .force("x", d3.forceX(function (d) { return d.x }))
        .force("y", d3.forceY(function (d) { return d.y }))
        .force("collide", d3.forceCollide(function(d,i) { return d.radius + 5}))

    simulation.on('tick', ticked);

    function ticked() {
      circles
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y)
    }

  } 

  function cluster() {

    simulation.stop();

    simulation
      .force('charge', d3.forceManyBody().strength(-30))
      .force('x', d3.forceX(function(d) { return d.outcome === 0 ? width * 0.35 : width * 0.85; }) )
      .force('y', d3.forceY(height/2))
      .force("collide", d3.forceCollide(function(d,i) { return d.radius + 5}))
      
    simulation.alpha(0.5);

    simulation.restart();

  }

  function inject() {

    simulation.stop();

    simulation
      .force('charge', d3.forceManyBody().strength(-30))
      // to weaken pull towards fixed width and create a nice aesthetic circle
      // leave it at default strength and ensure forceX is not simply 'width/2'
      .force('x', d3.forceX(function(d) { return d.outcome === 0 ? width * 0.5 : width * 0.3; })) 
      .force('y', d3.forceY(height/2))
      .force("collide", d3.forceCollide(function(d,i) { return d.radius + 5}))
      
    simulation.alpha(0.5);

    simulation.restart();

  }

  function infect() {

    d3.selectAll('.infected-1')
      .transition().ease(d3.easeLinear).duration(1500)
      .style("fill", 'red') 

  }

  function migrate() {

    d3.selectAll('#fadeOut-true')
      .transition().ease(d3.easeLinear).duration(1500)
      .style('opacity', 0)

    var nodesToHighlight = [50, 100, 150]
    var nodesThree = nodes.filter(d=>(nodesToHighlight.indexOf(d.id) != -1))
    gCircle1 = g.selectAll('.threeleft').data(nodesThree)

    var entered_circles = gCircle1
      .enter().append('circle')
        .attr('class', "threeleft")
        .attr("fill", d=> d.color) 
        .attr("fill-opacity", 1)
        .attr('r', d=>d.radius)
        .attr("cx", d=> d.x)
        .attr("cy", d=> d.y)
        
    gCircle1 = gCircle1.merge(entered_circles)

    d3.selectAll('#fadeOut-false')
    .transition().ease(d3.easeLinear).duration(500)
    .style('opacity', 0)

    setTimeout(function(d) {

      gText = g.selectAll('text').data(nodesThree)

      entered_text = gText
        .enter().append('text')
          .attr("font-family", "Helvetica")
          .attr("font-size", "18px")
          .attr("text-anchor", "middle")
          .attr("fill", "black")
          .attr("fill-opacity", 0)
          .attr("x", d=>d.x)
          .attr("y", d=>d.y)


      simulation.nodes(nodesThree)
        .alphaDecay(.005)
        .velocityDecay(0.2)
        .force('charge', d3.forceManyBody().strength(-30))
        .force("collide", d3.forceCollide(function(d,i) { return d.radius + 50}))
        .force('x', d3.forceX(function(d) { return width/2 }))
        .force('y', d3.forceY(function(d) { return height/2 }))
        .on('tick', toMigrate)

      simulation.alpha(0.1);

      simulation.restart();

      function toMigrate() {

        gCircle1
          .attr("cx", d=> d.x)
          .attr("cy", d=> d.y)
      }

    }, 2000)

    var labels = ['Shareholder X', 'Company A', 'Company B']

    setTimeout(function() {

      gCircle1
          .transition().ease(d3.easeLinear).duration(1000)
          .attr("fill", "white")
          .attr("stroke", "black")
          .attr('stroke-width', "4px")

      entered_text
          .merge(gText)
          .transition().ease(d3.easeLinear).duration(1000)
          .text((d,i)=> labels[i])
          .attr("x", d=>d.x)
          .attr("y", d=>d.y-30)
          .attr("fill-opacity", 1)

      gText.exit().remove()

     }, 3500)
  }


  function distribute() {

    var dummyData = []
    d3.range(1,4).map((d,i) => {
      dummyData.push({"outcome": 1, 'color': 'red', 'radius': 22, 'label':crime[i], 'band': "9", "id": "9-" + i.toString()})
    })
    d3.range(1,400).map((d,i) => {
      var rand = Math.round(randn_bm(1, 8, 0.7))
      dummyData.push({
        "outcome": 0, 
        'color': colorScale(rand),
        'band': rand, 
        'radius': radiusScale(getRandomArbitrary(1, 8)),
        'label': crime[getRandomArbitrary(0, 3)],
        "id": rand + '-' + i.toString()
      })
    })

    nodes = dummyData.map(function (d, i) {
      return {
          id: i,
          outcome: d.outcome,
          x: +Math.random(),
          y: +Math.random(),
          color: d.color,
          radius: d.radius,
          label: d.label ? d.label : "Money Laundering",
          band : d.band
      }
    })

    var tilesPerRow = 10
    var tileSize = 22
    var barWidth = 220

    // find count within each category 
    var counts = nodes.reduce((p, c) => {
      var name = c.band;
      if (!p.hasOwnProperty(name)) {
        p[name] = 0;
      }
      p[name]++;
      return p;
    }, {});

    countsExtended = Object.keys(counts).map(k => {
      var circles_arr = nodes.filter(d=>d.band==k)
      console.log(circles_arr)
      return {name: k, count: counts[k]}; circles_arr:  circles_arr});

    var u = g.selectAll("g").data(countsExtended.map(d=>d.count))

    u.enter()
      .append("g")
      .merge(u)
      .each(updateBar)

    function updateBar(num, i) {
      var tiles = getTiles(num, color[i], num)

      var u = d3.select(this)
        .attr("transform", "translate(" + i * barWidth + ", 500)")
        .selectAll("rect")
        .data(tiles);
   
       u.enter()
        .append("circle")
        .attr('class', 'distributed-' + d.id)
        .style("stroke", "white")
        .style("stroke-width", "1")
        .style("shape-rendering", "crispEdges")
        .merge(u)
        .attr('fill', d=>d.color)
        .attr("cx", function(d) {
          return d.x;
        })
        .attr("cy", function(d) {
          return d.y;
        })
        .attr("r", tileSize/2)
       
      u.exit().remove();

    }

    function getTiles(num, color) {
      var tiles = [];
       
      for(var i = 0; i < num; i++) {
        var rowNumber = Math.floor(i / tilesPerRow);
        tiles.push({
          x: (i % tilesPerRow) * tileSize,
          y: -(rowNumber + 1) * tileSize, 
          color: color
        });
      }
       
      return tiles
    }

    // get an array of x-coord and y-coord of all nodes
    var xycoord = []
    g.selectAll('circle.distributed').each(function(d) {
      xycoord.push({x:d3.select(this).attr('cx'), y:d3.select(this).attr('cy'), i:d3.select(this).attr('class')})
    })}

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

  function getRandomArbitrary(min, max) {
    return Math.round(Math.random() * (max - min) + min)
  }

  function execute(callback) {
    setTimeout(function() {
      callback();
    }, 3000);
  }

  function execute1000(callback) {
    setTimeout(function() {
      callback();
    }, 2000);
  }

  //Find the device pixel ratio
  function getPixelRatio(ctx) {
      //From https://www.html5rocks.com/en/tutorials/canvas/hidpi/
      let devicePixelRatio = window.devicePixelRatio || 1
      let backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
          ctx.mozBackingStorePixelRatio ||
          ctx.msBackingStorePixelRatio ||
          ctx.oBackingStorePixelRatio ||
          ctx.backingStorePixelRatio || 1
      let ratio = devicePixelRatio / backingStoreRatio
      return ratio
  }//function getPixelRatio


}()
    