var graph = function () {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 

  var canvasDim = { width: 1250, height: screen.height}
  var margin = {top: 50, right: 50, bottom: 50, left: 500}
  var width = canvasDim.width - margin.left - margin.right 
  var height = canvasDim.height - margin.top - margin.bottom 
  var modal = d3.select("#chart")
  var canvas = modal.append('canvas').attr('class', 'canvas')
  var context = canvas.node().getContext('2d')

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

      countriesGroup = svg
       .append("g")
       .attr("id", "map")

      var sf = Math.min(2, getPixelRatio(context)) //no more than 2
      if(screen.width < 500) sf = 1 //for small devices, 1 is enough

      canvas
        .attr('width', sf * canvasDim.width)
        .attr('height', sf * canvasDim.height)
        .style('width', canvasDim.width + "px")
        .style('height', canvasDim.height + "px")

      context.scale(sf,sf);
      context.translate(margin.left, margin.top);

      ///////////////////////////////////////////////////////////////////////////
      ////////////////////////////// Generate data //////////////////////////////
      ///////////////////////////////////////////////////////////////////////////

      var associationScoreRange = [0, 0.25, 0.5, 0.75]
      var filteredCountries = ["Mexico", "China", "Japan", "Singapore", "Russia", 'Italy', "Canada"]
      var crimeList = ["Unlawful Money Lending", "Cybercrime", "Organised Crime",  "Terrorism", 'Money Laundering', "Sanctions1", "Sanctions2"]
      var nodes = [ 
      "Spaceship", "Unlawful Money Lending", "Cybercrime", "Organised Crime",  "Terrorism", 'Money Laundering',  
      "Sanctions", "Sanctions1", "Sanctions2",
      "Mexico", "China", "Japan", "Singapore", "Russia", 'Italy', "Canada"]

      //var colors = [['black'], d3.schemeYlGnBu[9], Array(5).fill("slategrey")]
      var crimeColors = ['#FDE725FF', '#73D055FF', '#29AF7FFF', '#238A8DFF', '#33638DFF', '#404788FF', '#482677FF', '#440154FF']
      var colors = [['black'], crimeColors, Array(7).fill("slategrey")]
      colors = [].concat.apply([], colors)

      var colorScale = d3.scaleOrdinal()
        .domain(nodes)
        .range(colors)

      graph = {"nodes" : [], "links" : []};

      nodes.forEach(function (d,i) {
        graph.nodes.push({"id": i, "name": d });
       });

      graph.links = [
        {"source":"Spaceship","target":"Money Laundering","value":10}, 
        {"source":"Spaceship","target":"Unlawful Money Lending","value":10},
        {"source":"Spaceship","target":"Cybercrime","value":10},
        {"source":"Spaceship","target":"Organised Crime","value":10},
        {"source":"Spaceship","target":"Terrorism","value":10},
        {"source":"Spaceship","target":"Sanctions","value":24},
        {"source":"Sanctions","target":"Sanctions1","value":16},
        {"source":"Sanctions","target":"Sanctions2","value":8},
        {"source":"Money Laundering","target":"China","value":3},   
        {"source":"Money Laundering","target":"Russia","value":3},
        {"source":"Money Laundering","target":"Mexico","value":4},   
        {"source":"Unlawful Money Lending","target":"Russia","value":10}, 
        {"source":"Organised Crime","target":"Japan","value":10},  
        {"source":"Cybercrime","target":"Singapore","value":10},   
        {"source":"Terrorism","target":"Mexico","value":10},
        {"source":"Sanctions1","target":"Russia","value":15},  
        {"source":"Sanctions1","target":"Italy","value":1},  
        {"source":"Sanctions2","target":"China","value":8}                     
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

      console.log(graph.nodes, graph.links)

      ///////////////////////////////////////////////////////////////////////////
      /////////////////////////// Initialize Sankey /////////////////////////////
      ///////////////////////////////////////////////////////////////////////////

      var sankeyWidth = 350
      var sankeyHeight = 650
      var sankey = d3.sankey()
            .nodeWidth(10)
            .nodePadding(10)
            .size([sankeyWidth, sankeyHeight]);

      var curve = sankey.link()

      sankey
        .nodes(graph.nodes)
        .links(graph.links)
        .layout(12);

      execute(function() {
        drawMap()
        execute(function() {
          drawSankey()
        })
      })

      ///////////////////////////////////////////////////////////////////////////
      //////////////////////////////// Render map ///////////////////////////////
      ///////////////////////////////////////////////////////////////////////////
      var sel_centroids = []
      
      // Define map projection
      var projection = d3
         .geoEquirectangular()
         .center([0, 0]) // set centre to further North
         .scale([width/2.9]) // scale to fit group width
         .translate([width/4,height*(3/4)]) // ensure centred in group

      // Define map path
      var path = d3.geoPath()
         .projection(projection)
      
      function drawMap() {
        // get map data
        d3.json(
          "https://raw.githubusercontent.com/andybarefoot/andybarefoot-www/master/maps/mapdata/custom50.json",
          function(json) {

            // add a background rectangle
            countriesGroup
               .append("rect")
               .attr("x", 0)
               .attr("y", 0)
               .attr("width", width)
               .attr("height", height)

            // draw a path for each feature/country
            countries = countriesGroup
               .selectAll("path")
               .data(json.features)
               .enter()
               .append("path")
               .attr("d", path)
               .attr("id", function(d, i) {
                  return "country" + d.properties.name;
               })
               .attr("class", "country")

            var centroids = []
            json.features.map(d=> {
              centroids.push([d.properties.name, path.centroid(d)[0], path.centroid(d)[1]])
            })
            sel_centroids = centroids.filter(function(d){ return filteredCountries.indexOf(d[0]) != -1 })

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
                  return (
                     "translate(" + path.centroid(d)[0] + "," + path.centroid(d)[1] + ")" // centroid of countries
                  );
               })
          
          }
        )
      }

      ///////////////////////////////////////////////////////////////////////////
      //////////////////////// Render links (with gradient) /////////////////////
      ///////////////////////////////////////////////////////////////////////////
      function drawSankey() {

        // append a defs (for definition) element to your SVG
        const defs = svg.append('defs');

        sankey  
          .nodes(graph.nodes, d=>d.node)
          .links(graph.links, d=>"link link-" + d.source.name + "-" + d.target.name)
          .layout(13);

        // add in the links
        var link = svg.append("g").selectAll(".link")
            .data(graph.links)
            .enter().append("path")
            .attr("class", "link")
            .attr("d", curve)
            .style("fill", "none")
            .style("stroke-width", function (d) {
              return d.dy;
            })
            .style("stroke", "black")
            //.style("stroke-opacity", 0.2)
            .sort(function (a, b) {
                return b.dy - a.dy;
            })
          
        createGradient()

        function createGradient() {
          link.style("stroke", function(d,i) {
            // make unique gradient ids  
            const gradientID = `gradient${i}`;

            const startColor = colorScale(d.source.name);
            const stopColor = colorScale(d.target.name);

            const linearGradient = defs.append('linearGradient')
                .attr('id', gradientID)
                .attr("gradientTransform", "rotate(90)");

            var stops1 = [   
              {offset: '0%', color: startColor, opacity: 1 },                           
              {offset: '50%', color: startColor, opacity: 0.75 },      
              {offset: '75%', color: stopColor, opacity: 0.5 },  
            ]

            var stops2 = [   
              {offset: '0%', color: startColor, opacity:  0.5 },                           
              {offset: '50%', color: startColor, opacity: 0.4 },      
              {offset: '75%', color: stopColor, opacity: 0.2 }    
            ]

            linearGradient.selectAll('stop') 
              .data(['Spaceship'].indexOf(d.source.name) != -1 ? stops1 : stops2)                  
              .enter().append('stop')
              .attr('offset', d => {
                return d.offset; 
              })   
              .attr('stop-color', d => {
                return d.color;
              })
              .attr('stop-opacity', d => {
                return d.opacity;
              });

            return `url(#${gradientID})`;

          })
        }

        ///////////////////////////////////////////////////////////////////////////
        //////////////////////// Manually customize node position /////////////////
        ///////////////////////////////////////////////////////////////////////////

        function manualLayout() {

          for (j=0; j < sel_centroids.length; j++) {
            //pickNode = foo.nodes()[j]; // do not select node based on index
            pickNode = d3.select('.node-' + sel_centroids[j][0]) // select the node based on class name
            d = graph.nodes.find(function(d) {  return d.name == sel_centroids[j][0] }); // get the properties of that node
            pickNode.attr("transform", 
                  "translate(" + (
                         d.x = sel_centroids[j][1]
                ) + "," + (
                         d.y = sel_centroids[j][2] //Math.max(0, Math.min(height - d.dy, d3.event.y))
                  ) + ")");
         
          }

          categories =[["Sanctions", 10, 0], ["Sanctions1", 100, -80], ["Sanctions2", 60, -100]]

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
          link.attr("d", curve);
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

        // add the circles for the nodes
        node
          .filter(function(d) { return d.name == 'Spaceship'})
          .append("circle")
            .attr("class", function(d) { return "circle-" + d.name })
            .attr("cy",  sankey.nodeWidth()/2-200)
            .attr("cx", function (d) { return d.dy/2 })
            .attr("r", 300)
            .style("fill", 'black')
            .style("fill-opacity", 2)
            .style("shape-rendering", "crispEdges")

        // add rectangles (stacked bar chart to be overlayed) 
        var widthsStorage = []
        node
          .append("rect")
            .attr('class', function(d) { return "rect-" + d.name })
            .attr("height", sankey.nodeWidth())
            .attr("width", function(d) { 
              widthsStorage.push({"name": d.name, "width": d.dy })
              return d.dy })
            .style("fill", function(d) { return colorScale(d.name) })
            .style("stroke", "none")
            .style("fill-opacity", function(d) { return filteredCountries.indexOf(d.name) != -1 ? 0.2 : 0.5 })
          .append("title")
            .text(function(d) { return d.name })

        ///////////////////////////////////////////////////////////////////////////
        //////////////////// Create stacked horizontal bar chart  /////////////////
        ///////////////////////////////////////////////////////////////////////////
        stack() 

        function stack() {
          // prepare data for stacked bar chart
          var nested = d3.nest()
            .key(d => d.target.name) // need to nest data with country set as key (currently a mix of crime and country labels)
            .entries(graph.links)

          nested = nested.filter(d=>filteredCountries.indexOf(d.key) != -1) // only select country labels

          // Ensure that all countries have the same sort arrangement of crimes
          //console.log(nested.map(d => console.log(d.values)))
          //nested= nested.map(d => d.values.sort(sortOn("name")))

          //var crimeList = ["Unlawful Money Lending", "Cybercrime", "Organised Crime",  "Terrorism", 'Money Laundering', "Sanctions1", "Sanctions2"]
          var dataNew = []
          nested.map((D,I) => {
            console.log(D)
            var oneCountryCrime = Array.from(Array(crimeList.length), () => 0)
            D.values.map((d,i) => {
              oneCountryCrime[crimeList.indexOf(d.source.name)] = d.value
            })
            dataNew.push(oneCountryCrime)
          })

          // Fix the order arrangement of crime (most granular crime)
          var order = d3.range(nested.length).sort((i, j) => crimeList[j] - crimeList[i])

          // Constructs a stack layout based on data 
          // d3's permute ensures each individual array is sorted in the same order. Important to ensure sort arrangement is aligned for all parameters before stack layout)
          var stackedData = Object.assign(d3.stack().keys(d3.range(crimeList.length))(d3.permute(dataNew, order)), {
            keys: crimeList,
            ids: crimeList.map(R => filteredCountries.map(P => `${R}_${P}`)),
            country: filteredCountries
          })

          var xScale = d3.scaleLinear()
            //.range([0, sankeyWidth])

          stackedData.forEach((d,i) => {
            stackedData.country.forEach((D,I) => {
              if(stackedData[i][I]){
                customWidth = widthsStorage.find(b=>b.name == D).width
                xScale
                  .range([0, customWidth])
                  .domain([0, d3.max(stackedData[i][I].data, b=>b)])
                stackedData[i][I].x = xScale(d[I][0])
                stackedData[i][I].x1 = xScale(d[I][1])
                stackedData[i][I].color = colorScale(stackedData.keys[i]) 
                stackedData[i][I].width = ( d[I][1] ? xScale(d[I][1]) : xScale(0) ) - ( d[I][0] ? xScale(d[I][0]) : xScale(0) )
                stackedData[i][I].height = sankey.nodeWidth()
              }
            })
          })
          console.log(stackedData)
        
          // create stacked horizontal stacked bar chart (only for countries)
          var countryNodes = node.filter(function(d) { return filteredCountries.indexOf(d.name) != -1})
          var bars = countryNodes.selectAll("g.bar") 
            .data(stackedData)
            .enter().append("g")
            .attr('class', 'bar')
            .selectAll("rect")
            .data(d=>d)
            .enter().append("rect")
                .attr("fill", d=>d.color)
                .attr("x", d => d.x)
                .attr("width", d=>d.width)
                .attr("height", d => d.height)   
          
        }

        ///////////////////////////////////////////////////////////////////////////
        ////////////////////// Marker moving along path ///////////////////////////
        ///////////////////////////////////////////////////////////////////////////
        trickling()

        function trickling() {
          var FREQ = 150
          var SPEED = 7500

          var freqCounter = 1;
          var linkExtent = d3.extent(graph.links, function (d) {return d.value});
          var frequencyScale = d3.scaleLinear().domain(linkExtent).range([1,FREQ]);
          var particleSize = d3.scaleLinear().domain(linkExtent).range([0.2,2]);

          graph.links.forEach(function (link) {
            link.freq = link.value;
            link.particleSize = 2;
            //link.particleSize = particleSize(link.value);
            link.particleColorTime = d3.scaleLinear().domain([SPEED/2,SPEED]).range(["black", colorScale(link.target.name)])
            link.particleColor = colorScale(link.source.name)
            //link.particleColor = d3.scaleLinear().domain([1,SPEED]).range([colorScale(link.source.name), colorScale(link.target.name)]); // don't transition color of nodes
          })

          var t = d3.timer(tick, SPEED);
          var particles = [];

          function tick(elapsed) {

            particles = particles.filter(function (d,i) {return d.time > (elapsed - SPEED)});
            if (freqCounter > FREQ) {
              freqCounter = 1;
            }

            d3.selectAll("path.link")
            .each(
              function (d) {
                if (d.freq >= freqCounter) {
                  var offsetX = (Math.random() - .5) * sankey.nodeWidth();
                  var offsetY = (Math.random() - .5) * d.dy;
                  particles.push({link: d, time: elapsed, offsetX: offsetX, offsetY: offsetY, path: this})
                }
              });

            particleEdgeCanvasPath(elapsed);
            freqCounter++;
            if (elapsed > 20000) t.stop();

          }
          
          function particleEdgeCanvasPath(elapsed) {

            d3.timer()
            context.clearRect(-margin.left, -margin.top, canvasDim.width, canvasDim.height);

            context.fillStyle = "grey";
            context.lineWidth = "1px";
            for (var x in particles) {
                //console.log(filteredCountries.indexOf(particles[x].link.target.name) != -1 ? particles[x].link.particleColor : particles[x].link.particleColorTime(currentTime))
                var currentTime = elapsed - particles[x].time;
                var currentPercent = currentTime / SPEED * particles[x].path.getTotalLength();
                var currentPos = particles[x].path.getPointAtLength(currentPercent)
                context.beginPath();
                context.fillStyle = filteredCountries.indexOf(particles[x].link.target.name) != -1 ? particles[x].link.particleColor : "black"
                context.arc(currentPos.x+ particles[x].offsetX, currentPos.y + particles[x].offsetY, particles[x].link.particleSize, 0, 2*Math.PI);
                context.fill();
            }
          }

        }

      }

    }
  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Helper functions ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  function execute(callback) {
    setTimeout(function() {
      callback();
    }, 1000);
  }

  function getTextBox(selection) {
    selection.each(function(d) {
      d.bbox = this.getBBox();
    });
  }

  //Find the device pixel ratio
  function getPixelRatio(ctx) {
      //From https://www.html5rocks.com/en/tutorials/canvas/hidpi/
      let devicePixelRatio = window.devicePixelRatio || 1
      let backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
          ctx.mozBackingStorePixelRatio ||
          ctx.msBackingStorePixelRatio ||
          ctx.oBackingStorePixelRatio ||
          ctx.backingStorePixelRatio || 1
      let ratio = devicePixelRatio / backingStoreRatio
      return ratio
  }

  function sortOn(property) {
    return function(a, b){
      if(a[property] < b[property]){
          return -1;
      }else if(a[property] > b[property]){
          return 1;
      }else{
          return 0;   
      }
    }
  }


}()