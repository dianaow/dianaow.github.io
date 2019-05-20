var graph = function () {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 

  var canvasDim = { width: screen.width, height: screen.height}
  var margin = {top: 50, right: 50, bottom: 50, left: 50}
  var width = canvasDim.width - margin.left - margin.right 
  var height = canvasDim.height - margin.top - margin.bottom 
  var modal = d3.select("#chart")

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Initialize //////////////////////////////
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
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var associationScoreRange = [0, 0.25, 0.5, 0.75]
      var crime =  ['Money Laundering', 'Unlawful Money Lending', "Cybercrime", "Organised Crime", "Terrorism",  "Sanctions"]
      var nodes = ["Spaceship",'Money Laundering', 'Unlawful Money Lending', "Cybercrime", "Organised Crime", "Terrorism",
      "Sanctions", "Sanctions1", "Sanctions2",
      "Singapore", "Russia", "Japan", "China", "USA"]

      var colorScale = d3.scaleOrdinal()
        .domain(nodes)
        .range(["black","#E47D06", "#DB0131", "#AF0158", "#7F378D", "#3465A8",
        "#0AA174","#6cc6ab", "#ceece3",
        "#D3D3D3", "#D3D3D3", "#D3D3D3", "#D3D3D3", "#D3D3D3", "#D3D3D3"])

      ///////////////////////////////////////////////////////////////////////////
      ////////////////////////////// Generate sankey ////////////////////////////
      ///////////////////////////////////////////////////////////////////////////

      graph = {"nodes" : [], "links" : []};

      nodes.forEach(function (d,i) {
        graph.nodes.push({"id": i, "name": d });
       });

      graph.links = [
        {"source":"Spaceship","target":"Money Laundering","value":100}, 
        {"source":"Spaceship","target":"Tax & Customs Violation","value":21},
        {"source":"Spaceship","target":"Crime","value":291},
        {"source":"Spaceship","target":"Sanctions","value":313},
        // middle nodes - crime
        {"source":"Crime","target":"Cybercrime","value":223},
        {"source":"Crime","target":"Organised Crime","value":61},
        {"source":"Crime","target":"Terrorism","value":1},
        {"source":"Crime","target":"Unlawful Money Lending","value":6},
        // middle nodes - sanctions
        {"source":"Sanctions","target":"Other Sanctions","value":267},
        {"source":"Sanctions","target":"Sectoral Sanctions","value":19},
        {"source":"Sanctions","target":"Formerly Sanctioned","value":11},
        {"source":"Sanctions","target":"Narrative Sanctions","value":9},
        {"source":"Sanctions","target":"Formerly Sanctioned - Iran","value":7},
        // to country
        {"source":"Money Laundering","target":"China","value":30},   
        {"source":"Money Laundering","target":"Russia","value":40},
        {"source":"Money Laundering","target":"USA","value":20}, 
        {"source":"Money Laundering","target":"USA","value":10}, 
        {"source":"Tax & Customs Violation","target":"Singapore","value":20},   
        {"source":"Tax & Customs Violation","target":"Japan","value":1},
        {"source":"Unlawful Money Lending","target":"Russia","value":6}, 
        {"source":"Organised Crime","target":"Russia","value":11},  
        {"source":"Organised Crime","target":"Japan","value":50},  
        {"source":"Cybercrime","target":"Singapore","value":20},
        {"source":"Cybercrime","target":"Japan","value":3},   
        {"source":"Cybercrime","target":"Russia","value":200},   
        {"source":"Terrorism","target":"USA","value":1},
        {"source":"Other Sanctions","target":"Russia","value":200}, 
        {"source":"Other Sanctions","target":"China","value":60}, 
        {"source":"Other Sanctions","target":"USA","value":7}, 
        {"source":"Sectoral Sanctions","target":"China","value":19},  
        {"source":"Formerly Sanctioned","target":"China","value":11},
        {"source":"Narrative Sanctions","target":"China","value":9},
        {"source":"Formerly Sanctioned","target":"China","value":7}                 
      ]

      var nodeMap = {};
      graph.nodes.forEach(function(x) { nodeMap[x.name] = x; });
      graph.links = graph.links.map(function(x) {
        return {
          source: nodeMap[x.source],
          target: nodeMap[x.target],
          value: x.value
        };
      });

      ///////////////////////////////////////////////////////////////////////////
      /////////////////////////// Initialize Sankey /////////////////////////////
      ///////////////////////////////////////////////////////////////////////////

      var sankey = d3.sankey()
            .nodeWidth(10)
            .nodePadding(40)
            .size([1000, 600]);

      var path = sankey.link()

      sankey.nodes(graph.nodes)
          .links(graph.links)
          .layout(1);

      ///////////////////////////////////////////////////////////////////////////
      //////////////////////// Render links (with gradient) /////////////////////
      ///////////////////////////////////////////////////////////////////////////

      // append a defs (for definition) element to your SVG
      const defs = svg.append('defs');

      // add in the links
      var link = svg.append("g").selectAll(".link")
          .data(graph.links)
          .enter().append("path")
          .attr("class", "link")
          .attr("d", path)
          .style("fill", "none")
          .style("stroke-width", function (d) { return Math.max(1, d.dy) })
          .style("stroke-opacity", 1)
          .sort(function (a, b) { return b.dy - a.dy })

      link.style("stroke", function(d,i) {
            // make unique gradient ids  
            const gradientID = `gradient${i}`;

            const startColor = colorScale(d.source.name);
            const stopColor = colorScale(d.target.name);

            const linearGradient = defs.append('linearGradient')
                .attr('id', gradientID);

            linearGradient.selectAll('stop') 
              .data([                             
                  {offset: '50%', color: startColor },      
                  {offset: '75%', color: stopColor }    
                ])                  
              .enter().append('stop')
              .attr('offset', d => {
                return d.offset; 
              })   
              .attr('stop-color', d => {
                return d.color;
              });

            return `url(#${gradientID})`;
      })

      ///////////////////////////////////////////////////////////////////////////
      //////////////////////// Manually customize node position /////////////////
      ///////////////////////////////////////////////////////////////////////////

      function manualLayout() {

        categories =[["Sanctions", 80, 0], ["Sanctions1",20, -200], ["Sanctions2", 60, -160], ["Terrorism", 0, 20]]

        for (j=0; j < categories.length; j++) {
          //pickNode = foo.nodes()[j]; // do not select node based on index
          pickNode = d3.select('.node-' + categories[j][0]) // select the node based on class name
          d = graph.nodes.find(function(d) {  return d.name == categories[j][0] }); // get the properties of that node

          pickNode.attr("transform", 
                "translate(" + (
                       d.x = d.x + categories[j][1]
              ) + "," + (
                       d.y = d.y + categories[j][2] //Math.max(0, Math.min(height - d.dy, d3.event.y))
                ) + ")");

        }

        sankey.relayout();
        link.attr("d", path);
      }

      ///////////////////////////////////////////////////////////////////////////
      ////////////////////////////////// Render nodes ///////////////////////////
      ///////////////////////////////////////////////////////////////////////////

      // add in the nodes
      var node = svg.append("g").selectAll(".node")
          .data(graph.nodes)
          .enter().append("g")
          .attr("class", function(d) { return "node node-" + d.name })
          .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")" })
          .call(function () {
           manualLayout();
          });

      appendRects()

      function appendCircles() {
        // add the circles for the nodes
        node.append("circle")
            .attr("cx", sankey.nodeWidth()/2)
            .attr("cy", function (d) { return d.dy/2 })
            .attr("r", function (d) { return d.name == 'Spaceship' ? 200 : d.dy/2 })
            .style("fill", function (d) { return colorScale(d.name) })
            .style("fill-opacity", 1)
            .style("shape-rendering", "crispEdges")

        // add in the title for the nodes
        node.append("text")
            .attr("x", function (d) { return - 6 + sankey.nodeWidth() / 2 - Math.sqrt(d.dy) })
            .attr("y", function (d) { return d.dy / 2 })
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .text(function (d) { return d.name })
            .filter(function (d) { return d.x < width / 2 })
            .attr("x", function (d) { return 6 + sankey.nodeWidth() / 2 + Math.sqrt(d.dy) })
            .attr("text-anchor", "start")

        // white arc around nodes
        var arc = d3.arc()
            .innerRadius(0)
            .outerRadius(function (d) { return d.dy/2 + 2})
            .startAngle(0)
            .endAngle(Math.PI);

        //node.append("path")
            //.attr("d", arc)
            //.style("stroke-width", "2px")
            //.style("stroke", "white")
            //.style("fill", "none")
            //.attr("transform", function (d) { 
                //return "translate(" + 0 + "," + d.dy/2 + ")"
            //})
      }

      function appendRects() {

        // add the rectangles for the nodes
        node.append("rect")
            .attr("height", function(d) { return d.dy; })
            .attr("width", sankey.nodeWidth())
            .style("fill", function (d) { return colorScale(d.name) })

        // add in the title for the nodes
          node.append("text")
              .attr("x", -6)
              .attr("y", function(d) { return d.dy / 2; })
              .attr("dy", ".35em")
              .attr("text-anchor", "end")
              .attr("transform", null)
              .text(function(d) { return d.name; })
            .filter(function(d) { return d.x < width / 2; })
              .attr("x", 6 + sankey.nodeWidth())
              .attr("text-anchor", "start");

      }

    }
  }

}()