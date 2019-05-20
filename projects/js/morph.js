var morph = function () {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 

  var screenWidth = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
  var screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
  var canvasDim = { width: 600, height: 600}

  var margin = {top: -20, right: 5, bottom: 5, left: 5}
  var width = canvasDim.width - margin.left - margin.right 
  var height = canvasDim.width - margin.top - margin.bottom 
  var radius = canvasDim.width * 0.4

  var nodes = []
  var links = []
  var textG, circleG, pathG, gcircle, gpath, circle, path
  var clicked = 1
  var nodeRadius = 10
  var modal = d3.select(".modal-content6")

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Create scales ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  var colorScale = d3.scaleOrdinal()
    .range(["#081EFF", "#081EFF", "#081EFF"])
    .domain(["1 step", "2 step", 'random'])

  ///////////////////////////////////////////////////////////////////////////
  //////////////////// Update node and link positions ///////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function update(nodes, links) {
    console.log(nodes, links)
    circle = circleG.selectAll('circle').data(nodes, d=>d.id)

    circle.exit().remove()

    entered_circle = circle
      .enter()
      .append('circle')
      .attr('r', nodeRadius)
      .attr('stroke-width', 2)
      .attr('stroke', '#081EFF')
      .attr('fill', '#081EFF')
      .attr('cx', function(d) {return d.x})
      .attr('cy', function(d) {return d.y})
      
    circle = circle.merge(entered_circle)

    path = pathG.selectAll('path').data(links, d=>d.index)

    path.exit().remove()

    entered_path = path
      .enter()
      .append('path')
      .attr('opacity', 1)
      .attr('stroke-linecap', 'round')
      .attr('stroke-width', '2px')
      .attr('fill', 'transparent')

    path = path.merge(entered_path)

    circle
      .transition().duration(1000)
      .attr('cx', function(d) {return d.x})
      .attr('cy', function(d) {return d.y})
      .attr('id', function(d) {return "node-" + d.id.toString() + "-"})
      
    path
      .transition().duration(1000)
      .attr('id', function(d) { return "link" + "-source-" + d.source.id.toString() + "-target-" + d.target.id.toString() + "-" })
      .attr('stroke', function(d){ return colorScale(d.type) })
      .attr("d", function(d) {
          var dx = d.target.x - d.source.x,
              dy = d.target.y - d.source.y,
              dr = Math.sqrt(dx * dx + dy * dy);

        if(d.type=='2 step') {
          return "M" + 
              d.source.x + "," + 
              d.source.y + "A" + 
              dr + "," + dr + " 0 0,0 " + 
              d.target.x + "," + 
              d.target.y
        } else if (d.type=='1 step' || d.type=='random') {
          return "M" + 
              d.source.x + "," + 
              d.source.y + "L" + 
              d.target.x + "," + 
              d.target.y
        }
      })
      
  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Render Layout 1 /////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function Graph1(){

    d3.json("./data/dummy_data.json", function(error, data) {
      if (error) throw error;

      nodes = []
      data.nodes.map(function(d,i) {
        var radian = (2 * Math.PI) / data.nodes.length * i - (Math.PI / 2);
        nodes.push({
          id: d.id,
          fx: radius * Math.cos(radian) + (width / 2),
          fy: radius * Math.sin(radian) + (height / 2)
        })
      })

      links = Object.assign([], data.links) 

      var simulation1 = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; }))

      simulation1.nodes(nodes)
      simulation1.force("link").links(links);
      for (var i = 0; i < 100; ++i) simulation1.tick()

      update(nodes, links)
    })
    clicked=1
  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Render Layout 2 /////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function Graph2(){

    d3.json("./data/dummy_data.json", function(error, data) {
      if (error) throw error;
      
      nodes = Object.assign([], data.nodes)
      links = Object.assign([], data.links)

      var simulation2 = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(300).strength(0.1))
        .force('charge', d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2))

      simulation2.nodes(nodes)
      simulation2.force("link").links(links)
      for (var i = 0; i < 100; ++i) simulation2.tick()

      update(nodes, links)
    })

    clicked=2
  }

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

      textG = svg.append("g")
        .attr("class", "textG")

      Graph1() // initial render of layout 1
      d3.select("#clicker")
        .on("click", function(e) { clicked==1 ? Graph2() : Graph1()}) // toggle between the 2 layouts on click

    }
  }

}()