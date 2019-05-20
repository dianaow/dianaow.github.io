var overload = function () {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 

  var svg, children, radiusScale
  var diameter = 100
  var duration = 300;
  var circleSize = d3.scaleLinear().range([1, 100]); 
  var modal = d3.select(".modal-content2")

  ///////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// CORE  //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  return { 
    clear : function () {
      modal.select("svg").remove()
    },
    run : function () {

      //////////////////// Set up and initiate containers ///////////////////////
      svg = modal
        .append("svg")
        .attr("width", 600)
        .attr("height", 600)
        .append("g")
          .attr("transform", "translate(" + diameter*2 + " " + diameter*2 + ")");

      children = initialLayout(randomData(3));

      radiusScale = d3.scaleSqrt()
        .domain([children[0].value, children[1].value])
        .range([children[0].r, children[1].r]);
        
      pop();

      var interval = d3.interval(function(elapsed) {
        if (elapsed > 4000) {
          interval.stop(); 
          return;
        } else {
          addCircle()
          pop();
        }
        
      }, duration-5);

    }
  }


  function pop() {

    var groups = svg.selectAll("g").data(children, d=> +d.id)

    var groupsEnter = groups.enter().append("g")
      .attr("class", function(d,i) { return "node-" + d.id})

    groupsEnter.append("defs").attr("id", "imgdefs")
      .append("pattern")
        .attr("id", function(d,i) { return "image-" + d.id})
        .attr("height", d=>d.data ? d.r : d.r)
        .attr("width", d=>d.data ? d.r : d.r)
      .append('image')
        .attr("xlink:href", function(d,i) { 
          //console.log(d.data ? radiusScale(d.data.size) : d.r)
          return (d.data ? "./icons_svg/" + d.data.image.toString() + ".svg" : "./icons_svg/" + d.image.toString() + ".svg") || null
        }) 
        .attr("x", d=>d.data ? d.r/2 : d.r/2)
        .attr("y", d=>d.data ? d.r/2 : d.r/2)
        .attr("height", d=>d.data ? d.r : d.r)
        .attr("width", d=>d.data ? d.r : d.r)

    groupsEnter.merge(groups)
        .attr('transform', (d, i) =>
          `translate(${d.x},${d.y})` 
        ); 

    groups.exit().remove();

    groupsEnter.append('circle')
      .attr("fill", function(d) { return "lightyellow" })
      .style("stroke", "lightyellow")
      .style("stroke-width", "2px")
      .attr("r", 0)
      .merge(groups.select('circle'))
        .transition()
        .attr("r", d=>d.data ? d.r : d.r); 

    //groupsEnter.append('circle')
      //.attr("fill", function(d) { return "url(#" + ("image-" + d.id) + ")" || "black" })
      //.style("stroke", "lightyellow")
      //.style("stroke-width", "2px")
      //.attr("r", 0)
      //.merge(groups.select('circle'))
        //.transition()
        //.attr("r", d=>d.data ? d.r : d.r); 
  }

  function addCircle() {
    
    var newValue = circleSize(Math.random())

    var neighbor = d3.scan(children, function(a, b) {
        return Math.abs(a.value - newValue) - Math.abs(b.value - newValue)
      }),
      newNode = {
        r: radiusScale(newValue),
        id: children.length + 1,
        x: children[neighbor].x,
        y: children[neighbor].y,
        image: getRandomArbitrary(1, 12)
      },
      links = [{
        distance: newNode.r + children[neighbor].r,
        source: children.length,
        target: neighbor
      }];

    children.push(newNode);

    children.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });

    var simulation = d3.forceSimulation(children)
      .force("cx", d3.forceX().x(d => diameter / 2).strength(0.02))
      .force("cy", d3.forceY().y(d => diameter / 2).strength(0.02))
      .force("link", d3.forceLink(links).distance(d => d.distance).strength(0.5))
      .force("x", d3.forceX().x(d => d.x0).strength(0.1))
      .force("y", d3.forceY().y(d => d.y0).strength(0.1))
      .force("collide", d3.forceCollide().strength(0.8).radius(d => d.r + 5))
      .stop();

    while (simulation.alpha() > 0.001) {
      simulation.tick();
    }
  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Helper functions ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function initialLayout(data) {
    var stratify = d3.stratify()
      .id(d => d.id)
      .parentId(d => d.parent);

    var pack = d3.pack().size([diameter, diameter]);

    var root = stratify(data)
      .sum(d => d.size)
      .sort((a, b) => b.value - a.value);

    return pack(root).leaves();
  }

  function randomData(numNodes) {
    return d3.range(numNodes).map(function(d) {
      return {
        id: d,
        name: d ? "Leaf" : "Root",
        size: circleSize(Math.random()),
        parent: d ? 0 : undefined,
        image: getRandomArbitrary(1, 12),
      };
    });
  }

  function getRandomArbitrary(min, max) {
    return Math.round(Math.random() * (max - min) + min)
  }

}()