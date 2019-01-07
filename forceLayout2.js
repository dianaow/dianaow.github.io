// set the dimensions and margins of the graph
var mainFullWidth = 1400,
    mainFullHeight = 1400

var margin = {top: 40, right: 40, bottom: 40, left:40},
    width = mainFullWidth - margin.left - margin.right,
    height = mainFullHeight - margin.top - margin.bottom;

var legendFullWidth = 1400,
    legendFullHeight = 100;

var legendMargin = { top: 20, right: 40, bottom: 20, left:40}; // leave room for legend axis
var legendWidth = legendFullWidth - legendMargin.left - legendMargin.right;
var legendHeight = legendFullHeight - legendMargin.top - legendMargin.bottom;

// append the svg object to the body of the page
var svg = d3.select(".wrapper")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

// Initialize scales
var color = d3.scaleOrdinal()
  .range(["#EFB605", "#E47D06", "#DB0131", "#AF0158", "#7F378D", "#3465A8", "#0AA174", "#7EB852"])
  .domain(function(d){return d.raceName})

var colorWithinNode = d3.scaleSequential(d3.interpolateGreys).domain([85, 105])

var colorOfPath =  d3.scaleOrdinal()
  .domain(['Ultra soft', 'Super soft', 'Soft', 'Medium', 'Hard', 'Intermediate', 'Wet'])
  .range(['#BA4DAA', '#F50701', '#FFDD00', '#5D5D5D', '#EA6517', '#3AC82C', '#4491D2'])

var radius = d3.scaleSqrt()
    .range([0, 7]);

var xScale = d3.scaleLinear()
                .domain([0,60])

init()

function init() {

  d3.queue()  
    .defer(d3.json, 'results.json') 
    .defer(d3.json, 'races.json')
    .defer(d3.json, 'laptimes.json')
    .defer(d3.csv, 'tyres.csv')
    .await(renderForceLayout);  
}

function renderForceLayout(error, graph, races, laptimes, tyres) {
  if (error) throw error;

  var graph = {data:graph}
  var races = {data:races}
  graph.data = graph.data.filter(d => d.season == 2016)

  graph.data.forEach((d,i) => {
    res = laptimes.filter((x,idx) => (x.driverRef == d.driverRef) & (x.raceName == d.raceName) & (x.season == d.season))
    graph.data[i].pieChart = res
    d.id = d.id + 10
    d.roundId = d.roundId + 200
    d.value = 300 / d.position
    d.label = formatDriverNames(d.driverRef)
    d.laps = d.laps ? d.laps : 0
  })
  //console.log(graph.data)

  // Create nodes for each raceName and title
  mainTitle = {'roundId': 200, 'id': 200, 'raceName': 'FORMULA 1', 'value': '', 'label': 'FORMULA 1'}
  graph.data.push(mainTitle)
  races.data.forEach((d,i) => {
    d.position = 1
    d.roundId = 200
    d.id = d.id + 200
    d.value = 280 / d.position
    d.label = d.raceName
    graph.data.push(races.data[i])
  })

  // Formatting tyre stints data
  tyres.forEach((t,i) => {
    t.driverRef = t.driverRef.toLowerCase().split(' ')[1]
    t.season = parseInt(t.season,10)
    t['Stint 1'] = parseInt(t['Stint 1'],10)
    t['Stint 2'] = t['Stint 1'] + parseInt(t['Stint 2'],10)
    t['Stint 3'] = t['Stint 2'] + parseInt(t['Stint 3'],10)
    t['Stint 4'] = t['Stint 3'] + parseInt(t['Stint 4'],10)
    t['Stint 5'] = t['Stint 4'] + parseInt(t['Stint 5'],10)
    t['Stint 6'] = t['Stint 5'] + parseInt(t['Stint 6'],10)
    var a = ['First Set', 'Second Set', 'Third Set', 'Fourth Set', 'Fifth Set', 'Sixth Set']
    var b = ['Stint 1', 'Stint 2', 'Stint 3', 'Stint 4', 'Stint 5', 'Stint 6']
    t.tyresUsed = a.map(function(e,i){ return [ t[e], t[b[i]] ] })
    t.label = t.season.toString() + "_" + t.raceName + '_' + t.driverRef
  }) 

  // Create JSON structure of links
  graph.links = []
  graph.data.forEach((d,i) => {
    graph.links[i] = {'source': d.roundId, 'target': d.id, key:i}
    res = tyres.filter((x,idx) => (x.driverRef == d.driverRef) & (x.raceName == d.raceName) & (x.season == d.season))
    graph.links[i].pathSegment = res
  })
  console.log(graph.links)

  graph.data = graph.data.slice(0, -3)
  graph.links = graph.links.slice(0, -3)

  // Find total number of laps 
  var maxLaps = d3.nest()
  .key(function(d) { return d.roundId; })
  .rollup(function(v) { return d3.max(v, function(d) { return d.laps? d.laps : 0 })})
  .entries(graph.data)
  //console.log(maxLaps)

  graph.data.map(function(d,i){ 
    tmp = maxLaps.filter((x,idx) => (x.key == d.roundId))
    d.maxLaps = tmp[0].value
  })

  // Segment links
  var pieces_all = []
  graph.links.map(function(d,i){ 
    var linkDistance = radius(d.source*2) + radius(d.target*2)
    var pieces = splitPath(d.pathSegment,i, linkDistance)
    pieces_all.push(pieces)
  })
  pieces_all = pieces_all.flat()
  console.log(pieces_all)

  // Draw links
  var link = svg.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
      .attr("stroke-width", 1)
      .style('stroke', 'black')

  // Segment links
  //var linkSegment = svg.append("g")
      //.attr("class", "linkSegments")
    //.selectAll("line")
    //.data(pieces_all)
    //.enter().append("line")
      //.attr('class', function(d,i) { return  d.labels })
      //.attr("stroke-width", function(d) { return 10 })
      //.style('stroke', function(d) { return d.colors })

  // Create nodes
  var node = svg.append("g")
      .attr("class", "nodes")
    .selectAll("g")
    .data(graph.data)
    .enter()
      .append("g")
    .style('transform-origin', '50% 50%')
      .attr('class', function(d) { return "node_"+d.label })
      .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));


  var simulation = d3.forceSimulation()
      .force("link", 
             d3.forceLink().id(function(d) { return d.id; })
              .distance(function(d) { return radius(d.source.value*2) + radius(d.target.value*2); })
            .strength(function(d) {return 0.75; })
            )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("collide", d3.forceCollide().radius(function(d) { return radius(d.value*1.5); }))
      .force("center", d3.forceCenter(width / 2, height / 2));

  simulation
      .nodes(graph.data)
      .on("tick", ticked);

  simulation.force("link")
      .links(graph.links);

  /* Draw the respective pie chart for each node */
  node.each(function (d) {
    NodePieBuilder.drawNodePie(d3.select(this), d.pieChart, {
      radius: radius(d.value),
      parentNodeColor: color(d.raceName),
      maxLaps: d.maxLaps
    });
  });
  
  // Draw arcs of nodes
  var arcs =  node.append("path")
    .attr("id", function(d) { return "s"+d.id; }) //Unique id of the path
    .attr("d", function(d) { return describeArc(d.vx, d.vy, radius(d.value), -160, 160); }) //SVG path
    .style("fill", "none")

  // Append text to arcs of nodes
  var arcPaths = node.append("text")
    .append('textPath')
      .filter(function(d) { return d.id <= 200 })
      .attr("fill", function(d) { return color(d.raceName); })
      .attr("xlink:href", function(d) { return "#s"+d.id; }) //place the ID of the path here
      .attr("text-anchor", "middle") //place the text halfway on the arc
      .attr("startOffset", "50%")
      .text(function(d) { return d.label; })

  // Only select nodes of raceNames to have text placed in circle center
  node.append("text")
      .filter(function(d) { return d.id > 200 })
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .style('fill', 'white')
      .text(function(d) { return d.label; });

  var startAngle = []
  var pieArc =  node.append("path")
    .attr("id", function(d) { return "lastLap"+d.id; }) //Unique id of the path
    .attr("d", function(d) { return describeArc(d.vx, d.vy, radius(d.value)-12, -160, 160) }) //SVG path
    //.attr("d", function(d) { return describeArc(d.vx, d.vy, radius(d.value)-12, -(d.maxLaps-d.laps+1)/d.maxLaps * 360, -(d.maxLaps-d.laps)/d.maxLaps * 360, true) }) //SVG path
    .style("fill", "none")

  // Append lap number to arcs of piechart
  var pieArcText = node.append("text")
    .append('textPath')
      .attr("fill", 'white')
      .attr("xlink:href", function(d) { return "#lastLap"+d.id; }) //place the ID of the path here
      .attr("text-anchor", "middle") //place the text halfway on the arc
      .attr("startOffset", "50%")      .style("font-weight", 'bold')
      .style("font-size", 8)
      .text(function(d) { return d.laps; })

  function ticked() {

    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    //linkSegment
        //.attr("x1", function(d) { return d.segsX1; })
        //.attr("y1", function(d) { return d.segsY1; })
        //.attr("x2", function(d) { return d.segsX2; })
        //.attr("y2", function(d) { return d.segsY2; });

    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

  }

  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians)) -5
    };
}

function describeArc(x, y, radius, startAngle, endAngle, modifyArc) {
  
  if (modifyArc == true) {
    startAngle = startAngle
  } 

  var start = polarToCartesian(x, y, radius, startAngle);
  var end = polarToCartesian(x, y, radius, endAngle);
  var arcLength = endAngle - startAngle;
  if (arcLength < 0) arcLength += 360;
  var longArc = arcLength >= 180 ? 1 : 0;

  var d = [
    "M", start.x, start.y,
    "A", radius, radius, 0, longArc, 1, end.x, end.y
  ].join(" ");

  return d;
}

function formatDriverNames(e) {
  if(e.includes("_")){
    return e.split("_")[1]
  } else {
    return e
  }
}

// PIE CHART WITHIN NODES
var DEFAULT_OPTIONS = {
    radius: 20,
    outerStrokeWidth: 0,
    parentNodeColor: 'blue',
    showPieChartBorder: true,
    pieChartBorderColor: 'white',
    pieChartBorderWidth: '2',
    pathUniqueId: '',
    pathStrokeWidth: 0,
    pathFill: 'black',
    pathStrokeColor: 'white'
};

function getOptionOrDefault(key, options, defaultOptions) {
    defaultOptions = defaultOptions || DEFAULT_OPTIONS;
    if (options && key in options) {
        return options[key];
    }
    return defaultOptions[key];
}

function drawParentCircle(nodeElement, options) {
    var outerStrokeWidth = getOptionOrDefault('outerStrokeWidth', options);
    var radius = getOptionOrDefault('radius', options);
    var parentNodeColor = getOptionOrDefault('parentNodeColor', options);

    nodeElement.insert("circle")
        .attr("id", "parent-pie")
        .attr("r", radius)
        .attr("fill", function (d) {
            return parentNodeColor;
        })
        .attr("stroke", function (d) {
            return parentNodeColor;
        })
        .attr("stroke-width", outerStrokeWidth);
}

function drawPieChartBorder(nodeElement, options) {
    var radius = getOptionOrDefault('radius', options);
    var radius = radius - 10
    var pieChartBorderColor = getOptionOrDefault('pieChartBorderColor', options);
    var pieChartBorderWidth = getOptionOrDefault('pieChartBorderWidth', options);

    nodeElement.insert("circle")
        .attr("r", radius)
        .attr("fill", 'transparent')
        .attr("stroke", pieChartBorderColor)
        .attr("stroke-width", pieChartBorderWidth);
}

function drawPieChart(nodeElement, percentages, options) {
    var radius = getOptionOrDefault('radius', options);
    var parentNodeColor = getOptionOrDefault('parentNodeColor', options);
    var radius = radius-10
    var halfRadius = radius / 2;
    var halfCircumference = 2 * Math.PI * halfRadius;
    var maxLaps = options['maxLaps']

    var percentToDraw = 0
    percentages.forEach(function(p,i){
      percentToDraw += (1/maxLaps);

      nodeElement.insert('circle', '#parent-pie + *')
        .attr("r", halfRadius)
        .attr("fill", 'transparent')
        .style('stroke', (((percentages[i].time <= 105) && (percentages[i].time >= 85)) ? colorWithinNode(percentages[i].time) : parentNodeColor))
        .style('stroke-width', radius)
        .style('stroke-dasharray',
                halfCircumference * percentToDraw
                + ' '
                + halfCircumference)
    })
}

function drawStartMarker(nodeElement, percentages, options) {
    var radius = getOptionOrDefault('radius', options);
    var halfRadius = radius / 2;
    var halfCircumference = 2 * Math.PI * halfRadius;
    var maxLaps = options['maxLaps']

    nodeElement.insert('circle', '#parent-pie + *')
        .attr("r", halfRadius)
        .attr("fill", 'transparent')
        .style('stroke', 'green')
        .style('stroke-width', radius)
        .style('stroke-dasharray',
                halfCircumference * 1/maxLaps
                + ' '
                + halfCircumference)
}


var NodePieBuilder = {
    drawNodePie: function (nodeElement, percentages, options) {
        drawParentCircle(nodeElement, options);

        if (!percentages) return;
        drawStartMarker(nodeElement, percentages, options);
        drawPieChart(nodeElement, percentages, options);
        
        var showPieChartBorder = getOptionOrDefault('showPieChartBorder', options);
        if (showPieChartBorder) {
            drawPieChartBorder(nodeElement, options);
        }
    }
}

// Input a single path and segment it
function splitPath(data, index, linkDistance) {

  var numLapsOnTyre = data.map(function(d){return d.tyresUsed})
  var label =  data.map(function(d){return d.label})[0]
  var pieces = []

  xScale.range([0, linkDistance])
  //console.log(numPieces, pLength, numLapsOnTyre, pieceSize)

  var segsX1 = [], segsX2 = []
  numLapsOnTyre.forEach(function(row, idx) {
    row.forEach(function(t,i){
      if (!t[1]) return;
      if (row[i-1]) {
        segsX1 = row[i-1][1]
      } else {
        segsX1 = 0
      }
      segsX2 = row[i][1]
      scaledDist = xScale(segsX2) - xScale(segsX1)
      x = Math.sqrt((scaledDist*scaledDist)/2)
      pieces.push({index:index, labels:label, segsX1:xScale(segsX1), segsX2:xScale(segsX1)+x, segsY1: xScale(segsX1), segsY2:xScale(segsX1)+x, colors:colorOfPath(t[0])})
    })
  });

  return pieces;
}
