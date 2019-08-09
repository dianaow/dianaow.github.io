var people = []
var currentId = 0

function animate(elapsed, data, arcs) {

  const xProgressAccessor = d => ((elapsed - d.startTime) * d.total) / (d.path.getTotalLength())

  people = people.filter(function(d){ return xProgressAccessor(d) < 1 })

  if(currentId < 1000){
    arcs.each(function(d,i) {
      var path = arcs.filter(e=>e.id == d.id).node()
      people = [
        ...people,
        ...d3.range(1).map(function(p){ return generatePerson(elapsed, d, p, path) }),
      ]
    })
    currentId++
  }

  particleSVG(elapsed, people)

}

function particleSVG(elapsed, people) {

  const xProgressAccessor = d => ((elapsed - d.startTime) * d.total) / (d.path.getTotalLength())

  const m1 = d3.select('.markers-group').selectAll(".marker-circle")
    .data(people, d => d.id)

  m1.enter().append("circle")
    .attr("class", "marker marker-circle")
    .attr("r", 1)
    .attr('fill', 'white')

  m1.exit().remove()

  const markers = d3.selectAll(".marker")

  markers.style("transform", (d,i) => {
    var xScale = d3.scaleLinear()
      .domain([0, 1])
      .range([0, d.path.getTotalLength()])
      .clamp(true)

    var currentPos = d.path.getPointAtLength(xScale(xProgressAccessor(d))) 
    return `translate(${ currentPos.x}px, ${ currentPos.y }px)`
  })
  .attr('opacity', 0.4)

}

var currentPersonId = 0
function generatePerson(elapsed, e, p, path) {
  currentPersonId++
  return {
    id: currentPersonId,
    path: path,
    startTime: elapsed,
    total: e.value
  }
}
