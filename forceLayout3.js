// set the dimensions and margins of the graph
var mainFullWidth = 1400,
    mainFullHeight = 1400

var margin = {top: 40, right: 40, bottom: 40, left:40},
    width = mainFullWidth - margin.left - margin.right,
    height = mainFullHeight - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select(".wrapper")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

var colorOfPath =  d3.scaleOrdinal()
  .domain(['Ultra soft', 'Super soft', 'Soft', 'Medium', 'Hard', 'Intermediate', 'Wet'])
  .range(['#BA4DAA', '#F50701', '#FFDD00', '#5D5D5D', '#EA6517', '#3AC82C', '#4491D2'])

var xScale = d3.scaleLinear()
                .range([0, width])
                .domain([0,60])

var yScale = d3.scaleBand()
                .range([0, height])

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
  })
  //console.log(graph.data)

  // Modify identification of each result
  graph.data.forEach((d,i) => {
    d.driverRef = formatDriverNames(d.driverRef)
    d.id = d.id + 10

    d.roundId = d.roundId + 200
    d.value = 150 / d.position
    d.label = d.driverRef
  })

  // Create nodes for each race and title
  mainTitle = {'roundId': 200, 'id': 200, 'raceName': 'FORMULA 1', 'value': '', 'label': 'FORMULA 1'}
  graph.data.push(mainTitle)

  races.data.forEach((d,i) => {
    d.position = 0.8
    d.roundId = 200
    d.id = d.id + 200
    d.value = 150 / d.position
    d.label = d.raceName
    graph.data.push(races.data[i])
  })

  // Create JSON structure of links
  graph.links = []
  graph.data.forEach((d,i) => {
    graph.links[i] = {'source': d.roundId, 'target': d.id}
  })

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

  graph.data.forEach((d,i) => {
    res = tyres.filter((x,idx) => (x.driverRef == d.driverRef) & (x.raceName == d.raceName) & (x.season == d.season))
    graph.links[i].pathSegment = res
  })
  //console.log(graph.links)

  graph.data = graph.data.slice(0, -3)
  graph.links = graph.links.slice(0, -3)

  labelsList = tyres.map(function(d){ return d.label})

  var pieces_all = []
  graph.links.map(function(d,i){
    var pieces = splitPath(d.pathSegment,i)
    pieces_all.push(pieces)
  })
  //console.log(pieces_all.flat())
  pieces_all = pieces_all.flat()

  yScale.domain(d3.range(0, 70, 1))

  pieces_all.forEach(function(e,i) {
    console.log(yScale(e.index))
  })

  svg.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(pieces_all)
    .enter().append("line")
      .attr('class', function(d,i) { return d.labels })
      .attr("stroke-width", function(d) { return 10 })
      .style('stroke', function(d) { return d.colors })
      .attr('x1', function(d) { return xScale(d.segsX1) })
      .attr('x2', function(d) { return xScale(d.segsX2) })
      .attr('y1', function(d,i) { return yScale(d.index) })
      .attr('y2', function(d,i) { return yScale(d.index) })
      
}

function formatDriverNames(e) {
  if(e.includes("_")){
    return e.split("_")[1]
  } else {
    return e
  }
}

function splitPath(data, index) {
  var numPieces = 57
  var pLength = width
  var numLapsOnTyre = data.map(function(d){return d.tyresUsed})
  var pieceSize = pLength / numPieces
  var label =  data.map(function(d){return d.label})[0]
  var pieces = []
  //console.log(numPieces, pLength, numLapsOnTyre, pieceSize)

  var labels = [], segsX1 = [], segsX2 = [], colors = []
  numLapsOnTyre.forEach(function(row, idx) {
    row.forEach(function(t,i){
      if (!t[1]) return;
      if (row[i-1]) {
        segsX1 = row[i-1][1]
      } else {
        segsX1 = 0
      }
      segsX2 = row[i][1]
      colors = colorOfPath(t[0])
      pieces.push({index:index, labels:label, segsX1: segsX1, segsX2: segsX2, colors:colors})
    })
  });

  return pieces;
}
