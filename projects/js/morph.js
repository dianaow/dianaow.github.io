var morph = function () {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 

  var canvasDim = { width: 600, height: 600}
  var margin = {top: -20, right: 5, bottom: 5, left: 5}
  var width = canvasDim.width - margin.left - margin.right 
  var height = canvasDim.height - margin.top - margin.bottom 
  var radius = canvasDim.width * 0.4

  var circleG, pathG, circle, path
  var clicked = 1
  var nodeRadius = 10
  var modal = d3.select(".content-morph")

  ///////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// MORPH //////////////////////////////////
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
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      pathG = svg.append("g")
        .attr("class", "pathG")
       
      circleG = svg.append("g")
        .attr("class", "circleG")

      var data = createData()
      Graph1(data.nodes, data.links) // initial render of layout 1

      d3.select(".mutate")
        .on("click", function(e) { clicked==1 ? Graph2(data.nodes, data.links) : Graph1(data.nodes, data.links)}) // toggle between the 2 layouts on click

      d3.select(".reset")
        .on("click", function(e) { 
          data = createData()
          Graph1(data.nodes, data.links)
        })

    }
  }

  ///////////////////////////////////////////////////////////////////////////
  /////////////////////// Generate random data /////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function createData() {
    
    var nodes = []
    d3.range(0,20).map(function(d,i) {
      nodes.push({
        id: d
      })
    })

    var links = []
    d3.range(0,25).map(function(d,i) {
      links.push({
        id: i,
        source: getRandomInt(0, 19),
        target: getRandomInt(0, 19)
      })
    })

    return {nodes: nodes, links: links}
  }

  ///////////////////////////////////////////////////////////////////////////
  //////////////////// Update node and link positions ///////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function update(nodes, links) {

    circle = circleG.selectAll('circle').data(nodes, d=>d.id)

    circle.exit().remove()

    entered_circle = circle
      .enter().append('circle')
      .attr('r', nodeRadius)
      .attr('stroke-width', 2)
      .attr('stroke', 'mediumblue')
      .attr('fill', 'mediumblue')
      .attr('cx', function(d) {return d.x})
      .attr('cy', function(d) {return d.y})
      
    circle = circle.merge(entered_circle)

    circle.transition().duration(1000)
      .attr('cx', function(d) {return d.x})
      .attr('cy', function(d) {return d.y})
      .attr('id', function(d) {return "node-" + d.id.toString() + "-"})

    path = pathG.selectAll('path').data(links, d=>d.id)

    path.exit().remove()

    entered_path = path
      .enter().append('path')
      .attr('opacity', 1)
      .attr('stroke-linecap', 'round')
      .attr('stroke-width', '2px')
      .attr('fill', 'transparent')

    path = path.merge(entered_path)

    path.transition().duration(1000)
      .attr('id', function(d) { return "link" + "-source-" + d.source.id.toString() + "-target-" + d.target.id.toString() + "-" })
      .attr('stroke', 'mediumblue')
      .attr("d", function(d) {
          var dx = d.target.x - d.source.x,
              dy = d.target.y - d.source.y,
              dr = Math.sqrt(dx * dx + dy * dy);

          return "M" + 
              d.source.x + "," + 
              d.source.y + "L" + 
              d.target.x + "," + 
              d.target.y
      })
      
  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Render Layout 1 /////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function Graph1(nodes, links){

    nodes.forEach((d,i) => {
      var radian = (2 * Math.PI) / 20 * i - (Math.PI / 2);
      d.fx = radius * Math.cos(radian) + (width / 2)
      d.fy = radius * Math.sin(radian) + (height / 2)

    })

    var simulation1 = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(function(d) { return d.id; }))

    for (var i = 0; i < 100; ++i) simulation1.tick()

    update(nodes, links)

    clicked=1

  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Render Layout 2 /////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function Graph2(nodes, links){

    nodes.forEach((d,i) => {
      d.fx = null
      d.fy = null

    })

    var simulation2 = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(function(d) { return d.id; }).strength(0.1))
      .force('charge', d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2))

    for (var i = 0; i < 100; ++i) simulation2.tick()

    update(nodes, links)

    clicked=2

  }

  ///////////////////////////////////////////////////////////////////////////
  //////////////////////////// Helper functions /////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min;
  }

}()
