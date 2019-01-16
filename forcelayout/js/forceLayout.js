// set the dimensions and margins of the graph
var mainFullWidth = 1600,
    mainFullHeight = 1500

var margin = {top: 40, right: 40, bottom: 40, left:40},
    width = mainFullWidth - margin.left - margin.right,
    height = mainFullHeight - margin.top - margin.bottom;

var legendFullWidth = 1400,
    legendFullHeight = 300;

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
    .defer(d3.json, './data/results.json') 
    .defer(d3.json, './data/races.json')
    .defer(d3.json, './data/laptimes.json')
    .defer(d3.csv, './data/tyres.csv')
    .await(dataFormatting);  

}

function dataFormatting(error, graph, races, laptimes, tyres) {

  var graph = {data:graph}
  var races = {data:races}

  graph.data = graph.data.filter(d => d.season == 2016)

  // Format JSON structure of race results to make it suitable for drawing nodes
  var res = []
  graph.data.forEach((d,i) => {
    res = laptimes.filter((x,idx) => (x.driverRef == d.driverRef) & (x.raceName == d.raceName) & (x.season == d.season))
    graph.data[i].pieChart = res
    d.id = d.id + 10
    d.roundId = d.roundId + 200
    d.value = 300 / d.position
    d.label = formatDriverNames(d.driverRef)
    d.laps = d.laps ? d.laps : 0
  })
  
  // Create nodes for each raceName and title
  var mainTitle = {'roundId': 200, 'id': 200, 'raceName': 'FORMULA 1', 'value': '', 'label': 'FORMULA 1'}
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
  //tyres.forEach((t,i) => {
    //t.driverRef = t.driverRef.toLowerCase().split(' ')[1]
    //t.season = parseInt(t.season,10)
    //t['Stint 1'] = parseInt(t['Stint 1'],10)
    //t['Stint 2'] = t['Stint 1'] + parseInt(t['Stint 2'],10)
    //t['Stint 3'] = t['Stint 2'] + parseInt(t['Stint 3'],10)
    //t['Stint 4'] = t['Stint 3'] + parseInt(t['Stint 4'],10)
    //t['Stint 5'] = t['Stint 4'] + parseInt(t['Stint 5'],10)
    //t['Stint 6'] = t['Stint 5'] + parseInt(t['Stint 6'],10)
    //var a = ['First Set', 'Second Set', 'Third Set', 'Fourth Set', 'Fifth Set', 'Sixth Set']
    //var b = ['Stint 1', 'Stint 2', 'Stint 3', 'Stint 4', 'Stint 5', 'Stint 6']
    //t.tyresUsed = a.map(function(e,i){ return [ t[e], t[b[i]] ] })
    //t.label = t.season.toString() + "_" + t.raceName + '_' + t.driverRef
  //}) 

  // Format JSON structure of race results to make it suitable for drawing links 
  graph.links = []
  graph.data.forEach((d,i) => {
    graph.links[i] = {'source': d.roundId, 'target': d.id, key:i, raceName: d.raceName}
    //res = tyres.filter((x,idx) => (x.driverRef == d.driverRef) & (x.raceName == d.raceName) & (x.season == d.season))
    //graph.links[i].pathSegment = res
  })
  //console.log(graph.links)

  graph.data = graph.data.slice(0, -3)
  graph.links = graph.links.slice(0, -3)

  // Find the maximum number of laps ran (Note: This may be different from the total number of laps run by each driver) 
  var maxLaps = d3.nest()
    .key(function(d) { return d.roundId; })
    .rollup(function(v) { return d3.max(v, function(d) { return d.laps? d.laps : 0 })})
    .entries(graph.data)
  //console.log(maxLaps)

  graph.data.map(function(d,i){ 
    tmp = maxLaps.filter((x,idx) => (x.key == d.roundId))
    d.maxLaps = tmp[0].value
  })
  //console.log(graph.data)

  // Segment links
  //var pieces_all = []
  //graph.links.map(function(d,i){ 
    //var linkDistance = radius(d.source*2) + radius(d.target*2)
    //var pieces = splitPath(d.pathSegment,i, linkDistance)
    //pieces_all.push(pieces)
  //})
  //pieces_all = pieces_all.flat()
  //console.log(pieces_all)
  
  renderLegend()
  renderForceLayout(graph)

}

function renderLegend() {
  //Draw a circle
  timings = d3.range(85,106,1)
  pies = d3.range(1,21,1)
  var legendData = []
  pies.map(function(d,i){
    legendData.push({id:1, label:'Driver', laps:"No. of laps", lap: i, time: timings[i], vx:0, vy:0, value:300/1})
  })
  //console.log(legendData)

  var circlesWrapper = svg.append("g")
                        .attr("class", "legendGrp")
                        .attr('transform', "translate(" + radius(300/1)*1.5 + "," + radius(300/1)*1.5 + ")")

  var acircle = circlesWrapper.append("g")
      .attr("class", "legend")
    .selectAll("g")
    .data(legendData)
    .enter()
      .append("g")

  NodePieBuilder.drawNodePie(acircle, legendData, {
    radius: radius(300),
    parentNodeColor: '#AF0158',
    maxLaps: 20,
    data: legendData,
    showPieLabels: true
  })

  // append line indicator for start label
  circlesWrapper.append("g")
      .attr('class', 'start-line-wrap')
      .append('line')
        .attr('x1', 0)
        .attr('x2', 200)
        .attr('y1', 120-radius(300/1))
        .attr('y2', 120-radius(300/1))
        .style('stroke', 'black')
        //.style('stroke-dasharray', ('2,2'))

  // append start label
  circlesWrapper.append("g")
      .attr('class', 'start-labels-wrap')
      .append('text')
        .attr('x', 200)
        .attr('y', 110-radius(300/1))
        .attr('shape-rendering', 'crispEdges')
        .style('text-anchor', 'end')
        .style('fill', 'black')
        .style('font-size', 10)
        .text('First Lap')

  // append line indicator for laptimes
  circlesWrapper.append("g")
      .attr('class', 'start-line-wrap')
      .append('line')
        .attr('x1', 78)
        .attr('x2', 200)
        .attr('y1', 40-radius(300/1))
        .attr('y2', 40-radius(300/1))
        .style('stroke', 'black')
        //.style('stroke-dasharray', ('2,2'))

  // append pie label legend
  circlesWrapper.append("g")
      .attr('class', 'start-labels-wrap')
      .append('text')
        .attr('x', 200)
        .attr('y', 30-radius(300/1))
        .attr('shape-rendering', 'crispEdges')
        .style('text-anchor', 'end')
        .style('fill', 'black')
        .style('font-size', 10)
        .text('Time to complete a lap')

  var jsonCircles = [
     { "x_axis": 0, "y_axis": 400-radius(300/1), "radius": radius(300/1), 'value': 1},
     { "x_axis": 0, "y_axis": 400-radius(300/2), "radius": radius(300/2), 'value': 2},
     { "x_axis": 0, "y_axis": 400-radius(300/3), "radius": radius(300/3), 'value': 3},
     { "x_axis": 0, "y_axis": 400-radius(300/5), "radius": radius(300/5), 'value': 5},
     { "x_axis": 0, "y_axis": 400-radius(300/10), "radius": radius(300/10), 'value': 10},
     { "x_axis": 0, "y_axis": 400-radius(300/15), "radius": radius(300/15), 'value': 15},
     { "x_axis": 0, "y_axis": 400-radius(300/22), "radius": radius(300/22), 'value': 22}];

  // Append the values for circles
  var circles = circlesWrapper.append("g")
                  .attr("class", "values-wrap")
                  .selectAll("circle")
                  .data(jsonCircles)
                  .enter()
                  .append("circle");

  var circleAttributes = circles
                          .attr("cx", function (d) { return d.x_axis; })
                          .attr("cy", function (d) { return d.y_axis; })
                          .attr("r", function (d) { return d.radius; })
                          .attr('stroke-width', 1)
                          .attr('stroke', 'black')
                          .style("fill", 'transparent')
  
  // append dotted line indicator for values
  circlesWrapper.append('g')
      .attr('class', 'values-line-wrap')
      .selectAll('.values-labels')
      .data(jsonCircles)
      .enter().append('line')
      .attr('x1', d => d.x_axis)
      .attr('x2', 150)
      .attr('y1', d => d.y_axis-d.radius)
      .attr('y2', d => d.y_axis-d.radius)
      .style('stroke', 'black')
      .style('stroke-dasharray', ('2,2'))

  // append some labels from values
  circlesWrapper.append('g')
      .attr('class', 'values-labels-wrap')
      .selectAll('.values-labels')
      .data(jsonCircles)
      .enter().append('text')
      .attr('x', 150 + 10)
      .attr('y', d => (d.y_axis - d.radius + 5))
      .attr('shape-rendering', 'crispEdges')
      .style('text-anchor', 'end')
      .style('fill', 'black')
      .style('font-size', 10)
      .text(d => d.value)

  //append title
  circlesWrapper.append('text')
      .attr('x', 0)
      .attr('y', 400-2*radius(300/1)-10)
      .style('text-anchor', 'middle')
      .style('fill', 'black')
      .style('font-size', 12)
      .text('Race Winning Position')    

}

function renderForceLayout(graph) {

  // Segment links
  //var pieces_all = []
  //graph.links.map(function(d,i){ 
    //var linkDistance = radius(d.source*2) + radius(d.target*2)
    //var pieces = splitPath(d.pathSegment,i, linkDistance)
    //pieces_all.push(pieces)
  //})
  //pieces_all = pieces_all.flat()
  //console.log(pieces_all)

  // Draw links
  var link = svg.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
      .attr("stroke-width", 2)
      .style('stroke', function(d){ return color(d.raceName)})

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

  // Initialize force simulation
  var simulation = d3.forceSimulation()
      .force("link", 
             d3.forceLink().id(function(d) { return d.id; })
              .distance(function(d) { return radius(d.source.value*2) + radius(d.target.value*2); })
            .strength(function(d) {return 0.75; })
            )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("collide", d3.forceCollide().radius(function(d) { return radius(d.value*1.5); }))
      .force("center", d3.forceCenter(width/2+250, height /2-50));

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
      maxLaps: d.maxLaps,
      data: d
    });
  });
  
    // Only select nodes of raceNames to have text placed in circle center
  node.append("text")
      .filter(function(d) { return d.id > 200 })
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .style('fill', 'white')
      .text(function(d) { return d.label; });

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

function formatDriverNames(e) {
  if(e.includes("_")){
    return e.split("_")[1]
  } else {
    return e
  }
}
