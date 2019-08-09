function curved_lines_gradient_2() {

  // 1. Create data
  // No data to import
  const NUM_SPOKES = 12
  const data = []
  d3.range(0,NUM_SPOKES).map((d,i)=>{
    data.push({
      id : i,
      value : getRandomArbitrary(1, 20) 
    })
  })

  // 2. Create chart dimensions

  const width = 300
  let dimensions = {
    width: width,
    height: width,
    radius: width / 2,
    margin: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    },
  }
  dimensions.boundedWidth = dimensions.width
    - dimensions.margin.left
    - dimensions.margin.right
  dimensions.boundedHeight = dimensions.height
    - dimensions.margin.top
    - dimensions.margin.bottom
  dimensions.boundedRadius = dimensions.radius
    - ((dimensions.margin.left + dimensions.margin.right) / 2)

  const getCoordinatesForAngle = (angle, offset=1) => [
    Math.cos(angle - Math.PI / 2) * dimensions.boundedRadius * offset,
    Math.sin(angle - Math.PI / 2) * dimensions.boundedRadius * offset,
  ]

  // 3. Draw canvas

  const wrapper = d3.select("#curve-lines-gradient-4")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)

  const bounds = wrapper.append("g")
      .style("transform", `translate(${
        dimensions.margin.left + dimensions.boundedRadius
      }px, ${
        dimensions.margin.top + dimensions.boundedRadius
      }px)`)

  const defs = bounds.append('defs')

  // 4. Create scales

  const angleScale = d3.scaleLinear()
    .domain([0, NUM_SPOKES])
    .range([0, Math.PI * 2]) // this is in radians

  // 5. Draw lines
  var arcs = bounds.selectAll('path')
    .data(data)
    .enter().append("path")
    .attr('d', function(d) {
      const angle = angleScale(d.id)
      let [x, y] = getCoordinatesForAngle(angle)
      const ang = Math.atan2(y, x)*180/Math.PI+90;
      return arc([0,0], [x,y], 'outer', 2)
    })
    .attr("class", "line")
    .attr("id", d=> 'line' + d.id)
    .style("stroke", function(d,i) {
      const angle = angleScale(d.id)
      let [x, y] = getCoordinatesForAngle(angle)
      const ang = Math.atan2(y, x)*180/Math.PI+90;
      if(ang>-90 & ang<90) {
        var stops = [                             
          {offset: '0%', color: '#45ADA8', opacity: 1 },                              
          {offset: '100%', color: '#FABF4B', opacity: 1 }      
        ]
      } else if (ang==270) {
        var stops = [                             
          {offset: '0%', color: '#45ADA8', opacity: 1 },                              
          {offset: '100%', color: '#FABF4B', opacity: 1 }     
        ]        
      } else {
        var stops = [                             
          {offset: '0%', color: '#45ADA8', opacity: 1 },                         
          {offset: '100%', color: '#FABF4B', opacity: 1 }        
        ] 
      }
      const gradientID = `gradient${d.id}` // make unique gradient ids  

      const linearGradient = defs.append('linearGradient')
          .attr('id', gradientID)
          .attr("gradientTransform", (ang==270 | ang==90) ? "rotate(0)" : "rotate(90)")

      linearGradient.selectAll('stop') 
        .data(stops)                  
        .enter().append('stop')
        .attr('offset', l => l.offset)   
        .attr('stop-color', l => l.color)
        .attr('stop-opacity', l => l.opacity)

      return `url(#${gradientID})`;
    })
    .attr('stroke-width', '5px')
    .attr('fill', 'none')

  // 6. Animate lines

  const markersGroup = bounds.append("g")
    .attr("class", "markers-group")

  d3.interval(function() {
    d3.timer(function(elapsed){
      animate(elapsed, data, arcs)
    })
  }, 3000)

}

function getRandomArbitrary(min, max) {
  return Math.round(Math.random() * (max - min) + min)
}

curved_lines_gradient_2()