    loadData()

    function loop(error, data, data1) {
      disperseBlob(data);
      setTimeout(backToCenter, 5000);
      setTimeout(clusterProvince(data1), 10000);
      //setTimeout(disappearBlob, 15000);
    }

    function loadData() {

      d3.queue()   // queue function loads all external data files asynchronously 
        .defer(d3.csv, './data/VietnamConflict1.csv') 
        .defer(d3.csv, './data/deathPercentages_byProvince.csv')
        .await(loop);   // once all files are loaded, call the processData function passing
                               // the loaded objects as arguments
    }

    // set the dimensions and margins of the graph
    var margin = {top: 60, right: 30, bottom: 20, left:110},
        width = 960 - margin.left - margin.right,
        height = 800 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#my_dataviz")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    //SVG filter for the gooey effect
    //Code taken from http://tympanus.net/codrops/2015/03/10/creative-gooey-effects/
    var defs = svg.append("defs");
    var filter = defs.append("filter").attr("id","gooeyCodeFilter");
    filter.append("feGaussianBlur")
      .attr("in","SourceGraphic")
      .attr("stdDeviation","10")
      //to fix safari: http://stackoverflow.com/questions/24295043/svg-gaussian-blur-in-safari-unexpectedly-lightens-image
      .attr("color-interpolation-filters","sRGB") 
      .attr("result","blur");
    filter.append("feColorMatrix")
      .attr("class", "blurValues")
      .attr("in","blur")
      .attr("mode","matrix")
      .attr("values","1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -5")
      .attr("result","gooey");
    filter.append("feBlend")
      .attr("in","SourceGraphic")
      .attr("in2","gooey")
      .attr("operator","atop");

    //Mimick splitting the large blood pool from the center to individual locations of bubbles on scatterplot
    function disperseBlob (data) {

      //Parse the date / time
      var parseMonth = d3.timeParse("%b");
      var parseYear = d3.timeParse("%Y");

      //Format the data
      data.forEach(function(d) {
        d.FATALITY_MONTH = parseMonth(d.FATALITY_MONTH);
        d.FATALITY_YEAR = parseYear(d.FATALITY_YEAR);
      });

      // Calculate the total number of deaths
      var totalCount = d3.sum(data, function(d){return d.count})

      //Create X axis for months
      var xScale = d3.scaleTime()
        .domain(d3.extent(data, function(d){return d.FATALITY_MONTH}))
        .rangeRound([20, width])

      svg.append("g")
        .attr('class', 'xaxis')
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b")))

      //Create Y axis for years
      var yScale = d3.scaleTime()
        .domain(d3.extent(data, function(d){return d.FATALITY_YEAR}))
        .range([0, height-20])

      svg.append("g")
        .attr('class', 'yaxis')
        .call(d3.axisLeft(yScale));

      //Create square root scale for death count
      var radius = d3.scaleSqrt()
        .domain(d3.extent(data, function(d){return d.count}))
        .range([0, 16]);

      var deathWrapper = svg.append("g")
        .attr("class", "deathWrapper")
        .style("filter", "url(#gooeyCodeFilter)");

      //Draw the big blob of blood
      deathWrapper.append("circle")
        .attr("class", "bloodspatter1")
        .attr("r", 150)
        .attr("cx", width/2)
        .attr("cy", height/2)
        .attr("fill", "red")

      //To give the blood pool effect, I overlap ellipses over the original circles
      deathWrapper.append("ellipse")
        .attr("class", "bloodspatter2")
        .attr("rx", 200)
        .attr("ry", 100)
        .attr("cx", width/2-80)
        .attr("cy", height/2-50)
        .attr("fill", "red")

      deathWrapper.append("ellipse")
        .attr("class", "bloodspatter2")
        .attr("rx", 200)
        .attr("ry", 100)
        .attr("cx", width/2-80)
        .attr("cy", height/2-50)
        .attr("fill", "red")

      //Draw the scatterplot's bubbles. But first place it in the middle of canvas.
      deathWrapper.selectAll(".bubbles")
        .data(data)
        .enter()
        .append("circle")
          .attr('class', 'bubbles')
          .attr('cx', width/2)
          .attr('cy', height/2)
          .attr('r', function(d){ return radius(d.count); })
          .attr("fill", "red")

      //Append total death count statistics
      deathWrapper.append('text')
        .attr("class", "totalCount")
        .attr("x", width/2-80)
        .attr('y', height/2)
        .attr("font-size", "20px")
        .text("Total Deaths: " + totalCount)
        .transition().delay(1000)
        .style("opacity", 0);

      //Make the blood pool shrink
      d3.selectAll(".bloodspatter1")
          .transition().duration(3000)
          .attr("r", 0);

      d3.selectAll(".bloodspatter2")
          .transition().duration(3000)
          .attr("cx", width/2)
          .attr("cy", height/2)
          .attr("rx", 0)
          .attr("ry", 0);

      //From the center of canvas, disperse the bubbles to their location on scatterplot
      d3.selectAll(".bubbles")
        .transition("move").duration(1000)
        .delay(function(d,i) { return i*20; })
        .attr("r", function(d) {
          return d.radius = radius(d.count);
        })
        .attr("cx", function(d) {
          return d.x = xScale(d.FATALITY_MONTH);
        })
        .attr("cy", function(d) {
          return d.y = yScale(d.FATALITY_YEAR);
        });
    
      //"Remove" gooey filter from bubbles during the transition
      //So at the end they do not appear to melt together anymore
      d3.selectAll(".blurValues")
        .transition().duration(4000)
        .attrTween("values", function() { 
          return d3.interpolateString("1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -5", 
                        "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 6 -5"); 
        });

    }
  
    function clusterProvince(data1) {

      //Calculate the centers for each province with the top 10 death count based on d3's pack layout
      var pack = d3.pack()
        .size([width, height])
        .padding(60);

      //data1.sort(function(a, b){ return d3.descending(a.count, b.count); })
      var top10 = data1.slice(0, 11)
      var nest = d3.nest()
      var root = d3.hierarchy({data:nest.entries(top10)},function(d){return d.data;}).sum(function(d) {return d.count; })
      var nodes = pack(root)

      var provincesWrapper = svg.append("g")
        .attr("class", "provincesWrapper")
        .style("filter", "url(#gooeyCodeFilter)");

      //Draw the pack layout
      provincesWrapper.selectAll('.provinces')
          .data(nodes.children)
          .enter()
          .append("circle")
            .attr('class', 'provinces')
            .attr('cx', width/2)
            .attr('cy', height/2)
            .attr('r', 0)
            .attr("fill", "red")

      //To give the blood droplet effect, I overlap ellipses over the original circles
      provincesWrapper.selectAll('.provinces2')
          .data(nodes.children)
          .enter()
          .append("ellipse")
            .attr('class', 'provinces2')
            .attr('cx', width/2)
            .attr('cy', height/2)
            .attr('rx', 0)
            .attr('ry', 0)
            .attr("fill", "red")

      //From the center of canvas, disperse the blood droplets to their location on scatterplot
      provincesWrapper.selectAll('.provinces')
          .transition("move").duration(3000).delay(8500).ease(d3.easeCircle)
          .attr('cx', function (d) { return d.x; })
          .attr('cy', function (d) { return d.y; })
          .attr('r', function (d) { return d.r/1.5; })

      provincesWrapper.selectAll('.provinces2')
          .transition("move").duration(3000).delay(8500).ease(d3.easeCircle)
          .attr('cx', function (d) { return d.x + d3.randomUniform(-10, 30)(); })
          .attr('cy', function (d) { return d.y + d3.randomUniform(-10, 30)(); })
          .attr('rx', function (d) { return d.r/1.2; })
          .attr('ry', function (d) { return d.r/1.8; })

      var labelWrapper = svg.append("g")
        .attr("class", "labelWrapper");

      //Append the province labels
      labelWrapper.selectAll(".provinceLabel")
          .data(nodes.children)
          .enter().append("text")
          .attr("class", "provinceLabel")
          .attr("transform", function (d) { return "translate(" + (d.x-d.r/2) + ", " + (d.y) + ")"; })
          .attr('opacity', 0)
          .transition()
          .delay(9500)
          .attr('opacity', 1)
          .text(function (d) { return d.data.DEPLOYMENT_PROVINCE });

      //Append the death count labels
      labelWrapper.selectAll(".countlabel")
          .data(nodes.children)
          .enter().append("text")
          .attr("class", "countLabel")
          .attr("transform", function (d) { return "translate(" + (d.x-d.r/2) + ", " + (d.y+20) + ")"; })
          .attr('opacity', 0)
          .transition()
          .delay(9500)
          .attr('opacity', 1)
          .text(function (d) { return Math.round(d.data.count) });

      //Append the chart description
      labelWrapper.selectAll(".description")
          .data(nodes.children)
          .enter().append("text")
          .attr("class", "description")
          .attr("transform", function (d) { return "translate(" + 50 + ", " + 50 + ")"; })
          .attr("font-size", "20px")
          .attr('opacity', 0)
          .transition()
          .delay(9500)
          .attr('opacity', 1)
          .text('Vietnamese provinces with the top 10 highest death count');
    }  

      function backToCenter () {
      
        //Make the x and y axis invisible
        svg.selectAll('.xaxis')
            .transition().duration(2000)
            .attr("opacity", 0)

        svg.selectAll('.yaxis')
            .transition().duration(2000)
            .attr("opacity", 0)

        //Move the bubbles back to the middle of svg
        d3.selectAll(".bubbles")
          .transition()
          .duration(2000).delay(function(d,i) { return i*10; })
          .attr("cx", width/2)
          .attr("cy", height/2)
          .style("opacity", 0);

        //Expand the blood pool
        d3.selectAll(".bloodspatter1")
            .transition().duration(3000).delay(1200)
            .attr("cx", width/2)
            .attr("cy", height/2)
            .attr("r", 150);

        d3.selectAll(".bloodspatter2")
            .transition().duration(3000).delay(1200)
            .attr("cx", width/2-80)
            .attr("cy", height/2-50)
            .attr("rx", 200)
            .attr("ry", 100);
        
        //"Add" gooey filter
        d3.selectAll(".blurValues")
          .transition().duration(3000).delay(1500)
          .attrTween("values", function() {
            return d3.interpolateString("1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 35 -6",
                          "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -5");
          });

        //Make the blood pool shrink
        d3.selectAll(".bloodspatter1")
            .transition().duration(2000).delay(3000)
            .attr("r", 0)

        d3.selectAll(".bloodspatter2")
            .transition().duration(2000).delay(3000)
            .attr("cx", width/2)
            .attr("cy", height/2)
            .attr("rx", 0)
            .attr("ry", 0)

      }
