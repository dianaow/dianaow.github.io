var graph = function () {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 

  var canvasDim = { width: 1000, height: 1500}
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

      // grouping 'Unlawful Money Lending', "Tax & Customs Violation",  "Trafficking in Arms, Ammunition, Stolen Goods", "Violent Crime" into "Others"
      var crime =  ['Money Laundering', 'Unlawful Money Lending', "Cybercrime", "Organised Crime", "Terrorism",  "Sanctions"]
      //var nodes = ["0", "0.25", "0.5", "0.75", 'Money Laundering', 'Unlawful Money Lending', "Cybercrime", "Organised Crime", "Terrorism",  "Sanctions"]
      var nodes = ["Spaceship",'Money Laundering', 'Unlawful Money Lending', "Cybercrime", "Organised Crime", "Terrorism",  "Sanctions", 
      "Singapore", "Russia", "Japan", "China", "USA"]

      var colorScale = d3.scaleOrdinal()
        .domain(nodes)
        .range(["black","#E47D06", "#DB0131", "#AF0158", "#7F378D", "#3465A8", "#0AA174", "#D3D3D3", "#D3D3D3", "#D3D3D3", "#D3D3D3", "#D3D3D3", "#D3D3D3"])

      ///////////////////////////////////////////////////////////////////////////
      ////////////////////////////// Generate sankey ////////////////////////////
      ///////////////////////////////////////////////////////////////////////////

      graph = {"nodes" : [], "links" : []};

      nodes.forEach(function (d,i) {
        graph.nodes.push({"id": i, "name": d });
       });

      graph.links = [
        {"source":"Spaceship","target":"Money Laundering","value":100}, 
        {"source":"Spaceship","target":"Unlawful Money Lending","value":100},
        {"source":"Spaceship","target":"Cybercrime","value":100},
        {"source":"Spaceship","target":"Organised Crime","value":100},
        {"source":"Spaceship","target":"Terrorism","value":100},
        {"source":"Spaceship","target":"Sanctions","value":100},
        {"source":"Money Laundering","target":"China","value":30},   
        {"source":"Money Laundering","target":"Russia","value":30},
        {"source":"Money Laundering","target":"Singapore","value":40},   
        {"source":"Unlawful Money Lending","target":"Russia","value":100}, 
        {"source":"Organised Crime","target":"Japan","value":100},  
        {"source":"Cybercrime","target":"Japan","value":100},   
        {"source":"Terrorism","target":"USA","value":100},
        {"source":"Sanctions","target":"Russia","value":50},  
        {"source":"Sanctions","target":"USA","value":50},                   
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

      //associationScoreRange.map(function (a) {
        //graph.links.push({ "source": nodes.indexOf(a),
                           //"target": nodes.indexOf(c),
                           //"value": 5 });
      //})

      var sankey = d3sankey()
            .nodeWidth(10)
            .nodePadding(10)
            .size([900, 600]);

      //var path = d3.linkHorizontal()
        //.source(function(d) { return [d.source.x + sankey.nodeWidth()/2, d.source.y + d.source.dy / 2] })
        //.target(function(d) { return [d.target.x + sankey.nodeWidth()/2, d.target.y + d.target.dy / 2]})

      var path = sankey.link()

      sankey.nodes(graph.nodes)
          .links(graph.links)
          .layout(13);

      // append a defs (for definition) element to your SVG
      const defs = svg.append('defs');

      sankey  
        .nodes(graph.nodes, d=>d.node)
        .links(graph.links,d=>"link link-" + d.source.name + "-" + d.target.name)
        .layout(32);

      // add in the links
      var link = svg.append("g").selectAll(".link")
          .data(graph.links)
          .enter().append("path")
          .attr("class", "link")
          .attr("d", path)
          .style("fill", "none")
          .style("stroke-width", function (d) {
            console.log(d)
            return Math.max(1, Math.sqrt(d.value));
          })
          .style("stroke-opacity", 1)
          .sort(function (a, b) {
              return b.dy - a.dy;
          });

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

      // add in the nodes
      var node = svg.append("g").selectAll(".node")
          .data(graph.nodes)
          .enter().append("g")
          .attr("class", "node")
          .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")" })

      node.append("rect")
          .attr("height", function(d) { return Math.sqrt(d.value) })
          .attr("width", sankey.nodeWidth())

      // add the circles for the nodes
      node.append("circle")
          .attr("cx", sankey.nodeWidth()/2)
          .attr("cy", function (d) {
              return d.dy/2;
          })
          .attr("r", function (d) {
            console.log(d)
              return d.name == 'Spaceship' ? 200 : Math.sqrt(d.value);
          })
          .style("fill", function (d) {
              return colorScale(d.name)
          })

          .style("fill-opacity", 1)
          .style("shape-rendering", "crispEdges")
          .style("stroke", "2px")
          .append("title")
          .text(function (d) {
              return d.name + "\n" + d.value
          });

      // add in the title for the nodes
      node.append("text")
          .attr("x", function (d) {
              return - 6 + sankey.nodeWidth() / 2 - Math.sqrt(d.dy);
          })
          .attr("y", function (d) {
              return d.dy / 2;
          })
          .attr("dy", ".35em")
          .attr("text-anchor", "end")
          .attr("text-shadow", "0 1px 0 #fff")
          .attr("transform", null)
          .text(function (d) {
              return d.name;
          })
          .filter(function (d) {
              return d.x < width / 2;
          })
          .attr("x", function (d) {
              return 6 + sankey.nodeWidth() / 2 + Math.sqrt(d.dy);
          })
          .attr("text-anchor", "start");


      ///////////////////////////////////////////////////////////////////////////
      ////////////////////// Marker moving along path //////////////////////////
      ///////////////////////////////////////////////////////////////////////////

      var paths = assoc_to_crimeG.selectAll('path')

      paths.each(function(d,i){
        let path = d3.select(this)
        var startPoint = {x: entryPoints[i].x,  y: entryPoints[i].y}
        var marker = svg.append("circle");
        marker.attr("r", 7)
          .attr("transform", "translate(" + startPoint.x +  "," + startPoint.y + ")");

        var interval = d3.interval(function(elapsed) {
          if (elapsed > 16000) {
            interval.stop(); 
            return;
          } else {
            transition()
          }
          
        }, 2000);

        function transition() {
          marker.transition()
              .duration(2000)
              .attrTween("transform", translateAlong(path.node()))
        }
        
        function translateAlong(path) {
          var l = path.getTotalLength();
          return function(i) {
            return function(t) {
              var p = path.getPointAtLength(t * l);
              return "translate(" + p.x + "," + p.y + ")";//Move marker
            }
          }
        }

      })

    }
  }

}()