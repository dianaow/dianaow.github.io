var circlepack = function () {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 
  var svg, nodes
  var canvasDim = { width: 800, height: 600}
  var margin = {top: 100, right: 0, bottom: 0, left: 0}
  var width = canvasDim.width - margin.left - margin.right
  var height = canvasDim.height - margin.top - margin.bottom
  var crime = ["Money Laundering", "Sanctioned transaction", "Terrorist financing"]
  var modal = d3.select(".modal-content4")

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Create scales ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  var colorScale = d3.scaleOrdinal()
    .domain(["1", "2", "3", "4", "5", "6", "7", "8"])
    .range(['#f0f0f0','#d9d9d9','#bdbdbd','#969696','#737373','#525252','#252525','#000000'])

  var radiusScale = d3.scaleLinear()
    .domain(d3.range(1,9))
    .range(d3.range(6, 30, 3))

  ///////////////////////////////////////////////////////////////////////////
  //////////////////////////////////// CORE /////////////////////////////////
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

      /////////////////////// Repeat circle packing ////////////////////////////
      for(i=0; i<3; i++) {
        render(i)
      }

    }
  }

  ///////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Data processing ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function render(iteration) {

    var data = d3.range(30).map(function (d,i) {
      return {
          id: i,
          parentId: crime[iteration],
          score: getRndBias(0, 1, 0.5, 1),
          color: colorScale(getRandomArbitrary(1, 8).toString()),
          size: radiusScale(getRandomArbitrary(1, 8))
      }
    })
    data.push({id: crime[iteration], color: "red", score:1})
    vData = d3.stratify()(data);
    drawCirclePack(vData, (iteration+1)*450);

  }

  ///////////////////////////////////////////////////////////////////////////
  /////////////////////////// Create circle pack ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function drawCirclePack(vData, w) {

      var vLayout = d3.pack().size([w, height/2.3]).padding(5)

      // Layout + Data
      var vRoot = d3.hierarchy(vData).sum(function (d) { return d.data.size; });
      var vNodes = vRoot.descendants();

      vLayout(vRoot);
      var groups = nodes.selectAll('.pack'+Math.round(w).toString()).data(vNodes)

      var vSlices = groups.enter().append("g")
        .attr('class', 'pack'+Math.round(w).toString())

      vSlices.append('circle')
          .attr('fill-opacity', 1)
          .attr("fill", function(d) { return d.height==0 ? d.data.data.color: "white"})
          .attr("stroke", function(d) { return d.height==0 ? d.data.data.color: "red"})
          .attr('stroke-width', function(d) { return d.height==0 ? "0px" : "5px"})
          .attr('r', function (d) { return d.r })
          .attr('cx', function (d) { return d.x; })
          .attr('cy', function (d) { return d.y; })

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

}()