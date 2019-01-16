var circlesCreated = 0;

var width = 1400,
    height = 230,
    data = [];

var x = d3.scaleLinear()
  .domain([0, 1])
  .range([0, width]);

var y = d3.scaleLinear()
  .domain([0, 1])
  .range([150, height - 150]);

var r = d3.scaleSqrt()
  .domain([0, 1])
  .range([0, 30]);

var colorScale = d3.scaleLinear()
  .domain(d3.range(8))
  .range(["#EFB605", "#E47D06", "#DB0131", "#AF0158", "#7F378D", "#3465A8", "#0AA174", "#7EB852"]);

var circleWrapper = d3.select(".container-animation")
   .append("div")
   .classed("svg-container", true) //container class to make it responsive
   .append("svg")
   //responsive SVG needs these 2 attributes and no width and height attr
   .attr("preserveAspectRatio", "xMinYMin meet")
   .attr("viewBox", "0 0 1400 250")
   //class to make it responsive
   .classed("svg-content-responsive", true); 

add()

function renderCircles() {

  var item = circleWrapper.selectAll('.item')
  .data(data, function(d) { return d.key; })

  item.enter().append('circle')
  	  .attr('class', 'item')
  	  .attr('r', function(d) { return r(d.r); })
  	  .attr('cx', function(d) { return x(d.x); })
  	  .attr('cy', 0)
      .style("mix-blend-mode", "multiply")
      .style("opacity", function(d) { return Math.min(1, 0.2+Math.random()*2); })
  	  .style('fill', function(d) { return colorScale(Math.floor(Math.random()*8)); })
    .transition().duration(1000)
      .attr('cy', function(d) { return y(d.y); })
      .style('fill', function(d) { return colorScale(Math.floor(Math.random()*8)); })

  item.exit().filter(':not(.exiting)') // Don't select already exiting nodes
    .classed('exiting', true)
  .transition().duration(1000)
    .attr('cy', height)
    .style('fill', function(d) { return colorScale(Math.floor(Math.random()*8)); })
    .remove()
}

function add() {
  data.push({key: Date.now(), x: Math.random(), y: Math.random(), r: Math.random()})
  renderCircles()
  setTimeout(data.length < 100 ? add : remove, 5)
}

function remove() {
  data = data.slice(1)
  renderCircles()
  setTimeout(data.length > 0 ? remove : add, 5)
}