var graph = function () {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 
  var countries, colorScale
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

      function loadData() {

        d3.csv("./js/funnel/scifi_movie.csv", function(data) {
          res = data.map((d,i) => {
            return {
              movie_title : d.movie_title,
              title_year : +d.title_year,
              director_name: d.director_name,
              country: d.country,
              imdb_score : +d.imdb_score,
              binned: d.binned,
              num_voted_users: d.num_voted_users
            }
          })
          //draw()
        })

        d3.csv("./js/funnel/scifi_movie_grp.csv", function(data) {
          res = data.map((d,i) => {
            return {
              country: d.country,
              binned: d.binned,
              count: +d.imdb_score
            }
          })
          processData()
        })

      }

      function processData() {

        var binLabels   = ['0-2', '2-4', '4-6', '6-7', '7-8', '8-9']
        countries = res.map(d=>d.country).filter(onlyUnique)
        var nodes = [ "Spaceship", binLabels, countries]
        nodes = [].concat.apply([], nodes)

        var binColors = ['#73D055FF', '#29AF7FFF', '#238A8DFF', '#33638DFF', '#440154FF']
        var colors = [['black'], binColors, Array(countries.length).fill("slategrey")]
        colors = [].concat.apply([], colors)

        colorScale = d3.scaleOrdinal()
          .domain(nodes)
          .range(colors)

        graph = {"nodes" : [], "links" : []};

        nodes.forEach(function (d,i) {
          graph.nodes.push({"id": i, "name": d });
        });

        res.map(function (a) {
          graph.links.push({ "source": a.binned,
                             "target": a.country,
                             "value": a.count});
        })

        binLabels.map(function (a) {
          var tmp = graph.links.filter(d=>d.source == a)
          var sum = tmp.reduce(function(r,o) {
            (r[o.source])? r[o.source] += o.value : r[o.source] = o.value;
            return r
          }, {})
          graph.links.push({ "source": "Spaceship",
                             "target": a,
                             "value": Object.values(sum)[0] })
        })

        var nodeMap = {};
        graph.nodes.forEach(function(x) { nodeMap[x.name] = x; });
        graph.links = graph.links.map(function(x,i) {
          return {
            index: i,
            source: nodeMap[x.source],
            target: nodeMap[x.target],
            value: x.value
          };
        });
        //console.log(graph.nodes, graph.links)
      }

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

      execute(function() {
        loadData()
        execute(function() {
          drawMap()
          execute(function() {
            drawSankey()
          })
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
         .scale([width/3.2]) // scale to fit group width
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
            countriesPaths = countriesGroup
               .selectAll("path")
               .data(json.features)
               .enter()
               .append("path")
               .attr("d", path)
               .attr("id", function(d, i) {
                  return "country" + d.properties.name;
               })
               .attr("class", "country")

            // hexagons
            var hexbin = d3.hexbin().extent([[0, 0], [width, height]]).radius(10) 
            console.log(json.features)
            var hexData = Object.assign(
              hexbin(json.features)
                .map(d=> d.value = graph.links.find(b=>b.target.name == d.properties.name).value)
            )
            console.log(hexData)
            countryHex = countriesGroup
               .selectAll("g")
               .data(hexData)
               .enter()
               .append("path")
               .attr("class", "countryHex")
               .attr("d", function(d) { return hexbin.hexagon(4)})
               .attr("fill", "black")
               .attr("transform", function(d) {
                  return (
                     "translate(" + path.centroid(d)[0] + "," + path.centroid(d)[1] + ")" // centroid of countries
                  );
               })

            var centroids = []
            json.features.map(d=> {
              centroids.push([d.properties.name, path.centroid(d)[0], path.centroid(d)[1]])
            })

            sel_centroids = centroids.filter(function(d){ return countries.indexOf(d[0]) != -1 })

            countryLabels = countriesGroup
               .selectAll("g")
               .data(json.features)
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
          .nodes(graph.nodes, d=>d.name)
          .links(graph.links, d=>"link-" + d.source.name + "-" + d.target.name)
          .layout(13);

        // add in the links
        var link = svg.append("g").selectAll(".link")
            .data(graph.links)
            .enter().append("path")
            .attr("class", d=>"link link-" + d.source.name + "-" + d.target.name)
            .attr("d", curve)
            .style("fill", "none")
            .style("stroke-width", function (d) { return d.dy; })
            .style("stroke", "black")
            .sort(function (a, b) { return b.dy - a.dy; })
          
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
              .attr('offset', d => d.offset)   
              .attr('stop-color', d => d.color)
              .attr('stop-opacity', d => d.opacity)

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

          categories =[['0-2', 10, -100], ['2-4', 0, -100], ['4-6', 0, -100], ['6-7', 0, -100], ['7-8', 0, -100], ['8-9', 0, -100]]

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
            .style("fill-opacity", function(d) { return countries.indexOf(d.name) != -1 ? 0.2 : 0.5 })
          .append("title")
            .text(function(d) { return d.name })


        ///////////////////////////////////////////////////////////////////////////
        ////////////////////// Marker moving along path ///////////////////////////
        ///////////////////////////////////////////////////////////////////////////
        trickling()

        function trickling() {
          var FREQ = 100
          var SPEED = 10 * 1000
          var n = 3
          var freqCounter = 0;
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

          var t = d3.interval(tick, SPEED);
          var particles = [];

          function tick(elapsed) {

            particles = []
            d3.selectAll("path[class*=" + "link-Spaceship-4-6" + "]")
            .each(
              function (d) {
                var num = d.target.value/3
                for(var i = num*freqCounter; i < (num*(freqCounter+1)); i++){
                  var offsetX = (Math.random() - 0.5) * sankey.nodeWidth();
                  var offsetY = (Math.random() - 0.5) * d.dy;
                  particles.push({link: d, time: elapsed, offsetX: offsetX, offsetY: offsetY, path: this})
                }
              });

            particleEdgeCanvasPath(elapsed)
            freqCounter++;
            console.log(freqCounter)
            if (freqCounter==3) t.stop()

          }
          
          function particleEdgeCanvasPath(elapsed) {

            context.clearRect(-margin.left, -margin.top, canvasDim.width, canvasDim.height);

            context.fillStyle = "grey";
            context.lineWidth = "1px";
            for (var x in particles) {
                //console.log(particles[x])
                var currentTime = elapsed;
                var currentPercent = currentTime / SPEED * particles[x].path.getTotalLength();
                var currentPos = particles[x].path.getPointAtLength(currentPercent)
                context.beginPath();
                context.fillStyle = countries.indexOf(particles[x].link.target.name) != -1 ? particles[x].link.particleColor : "black"
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

  function onlyUnique(value, index, self) { 
      return self.indexOf(value) === index;
  }

  function sumFunction (accumulator, currentItem, currentIndex) {
      // look up if the current item is of a category that is already in our end result.
      index = accumulator.findIndex(function(item) { return (item.value === currentItem.value);});
      if (index < 0) {
          accumulator.push(currentItem); // now item added to the array
      } else {
          accumulator[index].sum += currenItem.sum // update the sum of already existing item
      }
      return accumulator;
  }

}()