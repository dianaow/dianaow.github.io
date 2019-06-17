var radialChart = function () {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 
  var fociRadius, radial
  var canvasDim = { width: 800, height: 800}
  var margin = {top:320, right: 20, bottom: 20, left: 400}
  var width = canvasDim.width - margin.left - margin.right;
  var height = canvasDim.height - margin.top - margin.bottom;
  var modal = d3.select(".content-radial")

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Create scales ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  var scoreScale = d3.scaleLinear()
    .domain([0, 1])

  var rScale = d3.scaleLinear()
    .range([0, 2 * Math.PI])

  var fociRadius = d3.scaleLinear()
    .range([150, 300])
    .domain([0, 1])

  var subgraphColor = d3.scaleLinear()
    .range(['powderblue', 'darkorange', 'red'])

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

      radialG = g.append("g")
        .attr("class", "radialG")

      pointsG = g.append("g")
        .attr("class", "pointsG")

      ////////////////////////// Run animation sequence /////////////////////////
      var data = getData()
      radialChart(data.subgraphs, data.subgraph_nested)
      donutChart(data.subgraph_nested)

      d3.select('#update').on("click", function () {
        data.subgraphs.forEach((d) => {
          d.scores = randBetween(0.2, 1) 
        })
        updatePoints(data.subgraphs)
      })

    }
  }

  ///////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Data Processing ///////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function getData(){

    var subgraphs = []
    d3.range(1,100).forEach((d,i) => {
      subgraphs.push({
        scores : randBetween(0.2, 1),
        index : i,
        subgraph : getRandomInt(0, 4).toString()
      })
    })

    subgraphs.sort(function(x, y){
      return d3.ascending(x.subgraph, y.subgraph); //sort by subgraph number
    })

    var subgraph_nested = d3.nest()
      .key(function(d) { return +d.subgraph; })
      .rollup(function(leaves) { return leaves.length; })
      .entries(subgraphs)
    console.log(subgraph_nested)
    var subgraph_lists = subgraph_nested.map(d=>d.key)

    subgraphColor.domain([0, subgraph_lists.length, 1])
    
    return {subgraphs: subgraphs, subgraph_nested: subgraph_nested}

  }

  function donutChart(subgraph_nested) {

    var pie = d3.pie()
      .sort(null)
      .value(function(d) { return d.value; });

    var path = d3.arc()
        .outerRadius(fociRadius.range()[0] - 15)
        .innerRadius(fociRadius.range()[0] - 35)

    var label = d3.arc()
        .outerRadius(fociRadius.range()[0] - 15)
        .innerRadius(fociRadius.range()[0] - 35)

    var arc = radialG.selectAll(".arc")
      .data(pie(subgraph_nested))
      .enter().append("g")
        .attr("class", "arc");

    arc.append("path")
        .attr("d", path)
        .attr("fill", function(d,i) { return subgraphColor(d.data.key) })
        .each(function(d,i) {
          var firstArcSection = /(^.+?)L/; 
          var newArc = firstArcSection.exec( d3.select(this).attr("d") )[1];
          newArc = newArc.replace(/,/g , " ");

          //Create a new invisible arc that the text can flow along
          arc.append("path")
            .attr("class", "hiddenDonutArcs")
            .attr("id", "donutArc"+i)
            .attr("d", newArc)
            .style("fill", "none");
        })

    arc.append("text")
      .attr("dy", "1em")
      .attr('fill', 'white')
      .append("textPath")
      .attr("xlink:href",function(d,i){return "#donutArc"+i;})
      .attr("transform", function(d) { return "translate(" + label.centroid(d) + ")"; })
      .style("text-anchor","middle")
      .attr("startOffset", "50%")
      .text(function(d) { return d.data.key; });
    
  }

  /////////////////////// Create radial chart for subgraph scores //////////////////
  function radialChart(subgraphs) {

    var ticks = fociRadius.ticks(5).slice(1)
    ticks.unshift(0)
    
    // create concentric lines 
    radial = radialG.selectAll('g').data(ticks, d=>d)

    var gr = radial.enter().append('g')
      .attr('class', 'r axis')

    gr.append('circle')
      .attr('r', fociRadius)
      .attr('stroke', function(d) {return 'darkgray'})
      .attr('fill', function(d) {return 'none'})

    gr.append("text")
      .attr("y", fociRadius)
      .attr("dy", "0.35em")
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("stroke-linejoin", "round")
      .text(function(d) { return d })

    // create polar scatter plot
    scoreScale.range([fociRadius.range()[0], fociRadius.range()[1]])
    rScale.domain([0, subgraphs.length])
    subgraphs.map((d,i)=>{
      d.index = i
    })
    
    updatePoints(subgraphs)
  }

  function updatePoints(data) {

    var line = d3.lineRadial()
      .radius(function(d) { return scoreScale(d.scores) })
      .angle(function(d,i) { return rScale(d.index) })

    radialPoint = pointsG.selectAll('circle').data(data, d=>d.index)

    radialPoint.exit().remove()

    var entered_radialPoint = radialPoint
      .enter().append('circle')
        .attr('class', function(d) { return 'point-' + d.index })
        .attr('transform', function(d) {
          var coors = line([d]).slice(1).slice(0, -1); // removes 'M' and 'Z' from string
          return 'translate(' + coors + ')'
        })
        .attr('r', function(d) { return 4 })
        .attr('fill',function(d,i){ return subgraphColor(d.subgraph) })

    radialPoint = radialPoint.merge(entered_radialPoint)

    radialPoint.transition().duration(1000).ease(d3.easeQuadOut)
      .attr('transform', function(d) {
        var coors = line([d]).slice(1).slice(0, -1); // removes 'M' and 'Z' from string
        return 'translate(' + coors + ')'
      })

  }

  function randBetween(min, max) {
    return min + (max - min) * Math.random();
  }

  function getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min;
  }

}()