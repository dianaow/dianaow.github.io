var people = []

function animate(elapsed, data, arcs) {

  const xProgressAccessor = d => (elapsed - d.startTime) / 3000
  arcs.each(function(d,i) {
    if(people.length <= d3.sum(data, d=>d.value)) {
      var path = arcs.filter(e=>e.id == d.id).node()
      people = [
        ...people,
        ...d3.range(d.value).map(function(p){ return generatePerson(elapsed, d, p, path) }),
      ]
    }
  })
  console.log(people)
  //particleCanvas(elapsed, people)
  particleSVG(elapsed, people)
  
  //if (elapsed > 10000) timer.stop();
  
}

function particleSVG(elapsed, people) {

  const xProgressAccessor = d => (elapsed - d.startTime) / 3000

  const m1 = d3.select('.markers-group').selectAll(".marker-circle")
    .data(people.filter(function(d){ return xProgressAccessor(d) < 1 }), d => d.id)

  m1.enter().append("circle")
    .attr("class", "marker marker-circle")
    .attr("r", 2)
    .attr('fill', 'white')
    //.attr("fill", d=>fillCategory(d))

  m1.exit().remove()

  const markers = d3.selectAll(".marker")

  markers.style("transform", (d,i) => {
    var xScale = d3.scaleLinear()
      .domain([0, 1])
      .range([0, d.path.getTotalLength()])
      .clamp(true)

    var currentPos = d.path.getPointAtLength(xScale(xProgressAccessor(d) * (1 + d.id/d.total))) 

    return `translate(${ currentPos.x}px, ${ currentPos.y }px)`
  })
  .attr('opacity', 1)

}

function particleCanvas(elapsed, particles) {

  const xProgressAccessor = d => (elapsed - d.startTime) / (d.path.getTotalLength() * 5)

  context.clearRect(-margin.left, -margin.top, canvasDim.width, canvasDim.height);
  context.fillStyle = 'white'
  for (var x in particles) {
      var currentTime = elapsed - particles[x].startTime;

      var xScale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, particles[x].path.getTotalLength()])
        .clamp(true)

      var currentPos = particles[x].path.getPointAtLength(xScale(xProgressAccessor(particles[x]) * (1 + particles[x].id/particles[x].total)))
      context.beginPath();
      context.arc(currentPos.x, currentPos.y, 1, 0, 2*Math.PI);
      context.fill();
  }

}

function generatePerson(elapsed, e, p, path) {
  return {
    id: p,
    path: path,
    startTime: elapsed,
    total: e.value
  }
}