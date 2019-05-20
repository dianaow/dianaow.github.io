var map = function() {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 

	var w = 1250;
	var h = 600;
  var map = d3.select("#map")
  var filteredCountries = ["Singapore", "Russia", "Japan", "China", "USA"]

  return { 
    clear : function () {
      map.remove()
    },
    run : function () {

  		var svg = map
  			.append("svg")
  			.attr('width', w)
  			.attr('height', h)

			// Define map projection
			var projection = d3
			   .geoEquirectangular()
			   .center([0, 15]) // set centre to further North
			   .scale([w/(2*Math.PI)]) // scale to fit group width
			   .translate([w/2,h/2]) // ensure centred in group

      // Define map path
			var path = d3
			   .geoPath()
			   .projection(projection)
		
			// get map data
			d3.json(
			  "https://raw.githubusercontent.com/andybarefoot/andybarefoot-www/master/maps/mapdata/custom50.json",
			  function(json) {

				  countriesGroup = svg
				   .append("g")
				   .attr("id", "map")

					// add a background rectangle
					countriesGroup
					   .append("rect")
					   .attr("x", 0)
					   .attr("y", 0)
					   .attr("width", w)
					   .attr("height", h)

					// draw a path for each feature/country
					countries = countriesGroup
					   .selectAll("path")
					   .data(json.features)
					   .enter()
					   .append("path")
					   .attr("d", path)
					   .attr("id", function(d, i) {
					      return "country" + d.properties.iso_a3;
					   })
					   .attr("class", "country")

					var centroids = []
					countryLabels = countriesGroup
					   .selectAll("g")
					   .data(json.features)
					   //.filter(function(d) { return filteredCountries.indexOf(d.properties.name) != -1 })
					   .enter()
					   .append("g")
					   .attr("class", "countryLabel")
					   .attr("id", function(d) {
					      return "countryLabel" + d.properties.name;
					   })

					   .attr("transform", function(d) {
					   		centroids.push([d.properties.name, path.centroid(d)[0], path.centroid(d)[1]])
					      return (
					         "translate(" + path.centroid(d)[0] + "," + path.centroid(d)[1] + ")" // centroid of countries
					      );
					   })

					// add the text to the label group showing country name
					countryLabels
					   .append("text")
					   .attr("class", "countryName")
					   .style("text-anchor", "middle")
					   .attr("dx", 0)
					   .attr("dy", 0)
					   .text(function(d) {
					      return filteredCountries.indexOf(d.properties.name) != -1 ? d.properties.name : "";
					   })
					   .call(getTextBox)

					// add a background rectangle the same size as the text
					countryLabels
					   .insert("rect", "text")
					   .attr("class", "countryBg")
					   .attr("transform", function(d) {
					      return "translate(" + (d.bbox.x - 2) + "," + d.bbox.y + ")";
					   })
					   .attr("width", function(d) {
					      return d.bbox.width + 4;
					   })
					   .attr("height", function(d) {
					      return d.bbox.height;
					   })
					;

			  }
			)

    }
	}


	function getTextBox(selection) {
	  selection.each(function(d) {
	    d.bbox = this.getBBox();
	  });
	}

	return centroids

}();