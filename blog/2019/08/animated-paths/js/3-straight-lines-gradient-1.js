function straight_lines_gradient_1() {

  // 1. Create data
  // No data to import
  const NUM_SPOKES = 12
  const data = d3.range(0,NUM_SPOKES)
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

  const wrapper = d3.select("#straight-lines-gradient-1")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)

  const bounds = wrapper.append("g")
      .style("transform", `translate(${
        dimensions.margin.left + dimensions.boundedRadius
      }px, ${
        dimensions.margin.top + dimensions.boundedRadius
      }px)`)

  // 4. Create scales

  const angleScale = d3.scaleLinear()
    .domain([0, NUM_SPOKES])
    .range([0, Math.PI * 2]) // this is in radians

  // 5. Draw lines

  data.forEach(el => {
    const angle = angleScale(el)
    const [x, y] = getCoordinatesForAngle(angle)

    bounds.append("line")
      .attr("x2", x)
      .attr("y2", y)
      .attr("class", "line")
      .attr("id", 'line' + el)
      .style("stroke", function(d,i) {
         return 'url(#LinkStroke1)'
      })
      .attr('stroke-width', '5px')
  })

}

straight_lines_gradient_1()