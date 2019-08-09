function profile() {

	const svg = d3.select("#venn_one")
	const margin = {
	    top: 0,
	    right: 0,
	    bottom: 0,
	    left: 0
	}
	const width = +svg.attr("width") - margin.left - margin.right
	const height = +svg.attr("height") - margin.top - margin.bottom

	const g = svg.append("g")
	    .attr("transform",
	        "translate(" +
	        margin.left + "," +
	        margin.top + ")");

	const circleRad = 80
	const xCenter = 120
	const yCenter = 100
	const offsetFactor = 1.5
	const xCenter2 = xCenter + offsetFactor*circleRad
	const offset = offsetFactor*circleRad
	const xCenter3 = xCenter + offset / 2
	const yCenter3 = yCenter + Math.sqrt(3)*offset / 2

	var venn1 = g.append('g')
		.attr('class', 'venn1')
		.attr('transform', "translate(" + xCenter + "," + yCenter + ")")
		
	venn1.append("circle")
	    .attr("r", circleRad)
	    .attr('fill', "#0a2756")
	    .attr('opacity', 0.7)
	    .attr('stroke',  "#0a2756")
		
	venn1.append("text")
	 		.text('Analyst')
	 		.attr('text-anchor', 'middle')
	 		.attr('fill', 'white')

	var venn2 =  g.append('g')
		.attr('class', 'venn2')
		.attr('transform', "translate(" + xCenter2 + "," + yCenter + ")")
		
	venn2.append("circle")
	    .attr("r", circleRad)
	    .attr('fill', "#e60024")
	   	.attr('opacity', 0.7)
	    .attr('stroke',  "#e60024")

	venn2.append("text")
	 	.text('Data Visualizer')
	 	.attr('text-anchor', 'middle')
	 	.attr('fill', 'white')

	var venn3 = g.append('g')
		.attr('class', 'venn3')
		.attr('transform', "translate(" + xCenter3 + "," + yCenter3 + ")")
		
	venn3.append("circle")
	    .attr("r", circleRad)
	    .attr('fill', "#45CFD7")
	   	.attr('opacity', 0.7)
	    .attr('stroke',  "#45CFD7")

	venn3.append("text")
	 	.text('Programmer')
	 	.attr('text-anchor', 'middle')
	 	.attr('fill', 'white')

}

profile()