var screenWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
var screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) * 10
var canvasDim = { width: screenWidth, height: screenHeight}

var data
var edges_new 
var xAxis
var yAxis
var axisPad = 6
var lineOpacity = 1
var lineStroke = "1px"

var margin = {top: 80, right: 40, bottom: 40, left: 150}
var width = canvasDim.width - margin.left - margin.right
var height = canvasDim.height - margin.top - margin.bottom

var svg = d3.select("#chart").append("svg")
  .attr("width", width + margin.left + margin.right)
  //.attr("height", height + margin.top + margin.bottom)
  //.attr('viewBox','0 0 '+Math.min(canvasDim.width,canvasDim.height)+' '+Math.min(canvasDim.width,canvasDim.height))
  //.attr('preserveAspectRatio','xMinYMin')
  .append('g')
    .attr("transform", "translate(" + margin.left + "," + 10 + ")")
    .style('overflow', 'auto')

var nodes = svg.append('g')
  .attr('class', 'nodes')

var lines = svg.append('g')
  .attr('class', 'lines')

// CREATE TOOLTIP
var tooltip = d3.select("#chart").append("div")
  .attr("id", "tooltip")
  .style('position', 'absolute')
  .style("background-color", "#D3D3D3")
  .style('padding', 6)
  .style('display', 'none')

var x_axis = d3.select("#xaxis")
  .append("svg")           
    .attr("width", canvasDim.width)
    .attr("height", 30)
  .append("g")
    .attr("class", "x_axis")
    .attr("transform", "translate(" + margin.left + "," + 15 + ")")

var y_axis = svg.append("g")
  .attr("class", "y_axis")
  .append('text')
    .attr('x', 0)
    .attr("y", 0)
    .attr("fill", "#A9A9A9")
    .style('font-size', 13)
    .style('font-weight', 'bold')
    .text("Officer")

var simulation = d3.forceSimulation()  
  .force('charge', d3.forceManyBody().strength(1))
  .force("collide", d3.forceCollide(4))
  .alphaDecay(0.1)
  .velocityDecay(0.4)
  .stop()

var offshoreCountries = ['Others', 'Bermuda', 'Malta', 'Cayman Islands', 'British Virgin Islands', 'Samoa']
var color = d3.scaleOrdinal()
  .domain(offshoreCountries)
  .range(["#A9A9A9", "#2D4057", "#7C8DA4", "#B7433D", "#2E7576", "#EE811D"])

init()

function init() {

  d3.queue()   
    .defer(d3.csv, './data/nodes_filt_entity.csv')  
    .defer(d3.csv, './data/nodes_officer_sea.csv')
    .defer(d3.csv, './data/nodes_edges_sea.csv')
    .await(createChart);  

}

function onlyUnique(value, index, self) { 
  return self.indexOf(value) === index;
}

function createChart(error, entity, officer, edges){
  initializeData(entity, officer, edges)
  createForm()
  clearFilters()
  clickableAxis()
}

function initializeData(entity, officer, edges){

  var parseDate = d3.timeParse("%d-%b-%Y")

  var entity_new = entity.map((d,i) => {
    return {
      node_id: +d.node_id,
      name: d.name,
      incorporation_date: d.incorporation_date ? parseDate(d.incorporation_date.toLowerCase()) : "",
      countries: d.countries.includes(";") ? d.countries.split(";")[0] : d.countries
    } 
  })

  var officer_new = officer.map((d,i) => {
    return {
      node_id: +d.node_id,
      name: d.name,
      countries: d.countries
    }
  })

  edges_new = edges.map((d,i) => {
    return {
      start_id: +d.START_ID,
      end_id: +d.END_ID,
      type: d.TYPE,
      link: d.link,
      start_date: d.start_date ? parseDate(d.start_date) : "",
      end_date: d.end_date ? parseDate(d.end_date) : "",
    }
  })

  officer_new = officer_new.filter(d=>d.countries=='Singapore')
  data = edges_new.map((d,i) => {
    return Object.assign({}, d, officer_new.find(b=>b.node_id===d.start_id) ||{});
  })

  // data cleaning: since entities that lack a corresponding officer name or date, remove them
  data = data.filter(d=> (d.start_date != null) & ( d.start_date != ""))
  data = data.filter(d=> (d.name != undefined) & (d.name != null))

  // data cleaning: remove duplicate start and end node_ids
  data = data.filter((thing, index, self) =>
    index === self.findIndex((t) => (
      t.start_id === thing.start_id && t.end_id === thing.end_id
    ))
  )

  // initally sort by end_id in ascending order
  function compare(a, b) {
    let comparison = 0;
    if (a['node_id'] > b['node_id']) {
      comparison = 1;
    } else if (a['node_id'] < b['node_id']) {
      comparison = -1;
    }
    return comparison;
  }
  data.sort(compare)
  
  data.forEach((d,i) => {
    var e = entity_new.find(b=>b.node_id == d.end_id)
    // var o = officer_new.find(b=>b.node_id == d.end_id) // there is no officer linked to another officer
    data[i].end_name = e ? e.name : ""
    data[i].entity_country = e ? (offshoreCountries.indexOf(e.countries) < 0 ? 'Others' : e.countries) : ""
  })
  //console.log(data)

  renderChart(data)
}

function renderChart(data) {
  
  var unique = data.map(d=>d.name).filter(onlyUnique)

  var height = unique.length>600 ? canvasDim.height - margin.top - margin.bottom : unique.length*40

  d3.select('#chart svg').attr('height', height+100)

  var xScale = d3.scaleTime()
    .domain(d3.extent(data, d=>d.start_date))
    .rangeRound([0, width])

  var yScale = d3.scaleBand()
    .domain(unique)
    .range([height, 0])
    .padding(10)

  data.forEach((d,i) => {
    data[i].x = xScale(d.start_date),
    data[i].y = yScale(d.name)
  })

  simulation
    .nodes(data)
    .force('x', d3.forceX().strength(0.8).x(d => d.x))
    .force('y', d3.forceY().strength(0.8).y(d => d.y))

  for (var i = 0; i < 100; ++i) simulation.tick()

  // CREATE NODES (each representing an entity)
  // JOIN new data with old elements.
  var gnodes = nodes.selectAll('.node-group').data(data) 

  var entered_nodes = gnodes.enter().append('g')
    .merge(gnodes)
    .attr("class", function(d,i) { return "node-group node-"+ d.start_id.toString()})
    .attr("transform", function(d,i) { 
      return "translate(" + d.x + "," + d.y + ")" 
    })
    .append("circle")
    .attr('id', (d,i)=> 'circle-' + d.start_id.toString() + '-' + d.end_id.toString() + "-" + d.link.replace(/[^A-Z0-9]+/ig, "_"))
    .attr('r', 3)
    .attr('fill', function(d) {
      return color(d.entity_country) || '#fff'
    })
    .attr('fill-opacity', 1)
    .attr('stroke', 'none')

  // CREATE CONNECTOR LINES
  // line generator
  var byEntity = d3.nest().key(function(d) { return d.end_name }).entries(data);

  line = d3.line()
    .curve(d3.curveMonotoneX)
    .x(d => xScale(d.start_date))
    .y(d => yScale(d.name))

  glines = lines.selectAll('.line-group').data(byEntity)

  glines.enter().append('g')
    .merge(glines)
    .attr('class', 'line-group')  
    .append('path')
    .attr('id', (d,i)=> 'line-' + d.key.replace(/[^A-Z0-9]+/ig, "_")) 
    .attr('d', d => line(d.values))
    .style('stroke', 'black')
    .style('fill', 'none')
    .style('opacity', lineOpacity)
    .style('stroke-width', lineStroke)
    .style("visibility", "hidden")

  // CREATE INTERACTIVITY
  // can't use gnodes.on() because no nodes have been created yet. 
  entered_nodes.on('mouseover', function (d,i) {
    d3.select(this).style("cursor", "pointer"); 
    d3.select('#circle-' + d.start_id.toString() + '-' + d.end_id.toString() + "-" + d.link.replace(/[^A-Z0-9]+/ig, "_"))
      .attr('r', 4.5)
    //d3.select('#text-' + d.start_id.toString() + '-' + d.end_id.toString())
      //.style("visibility","visible")
    d3.select('#line-' + d.end_name.toString().replace(/[^A-Z0-9]+/ig, "_"))
      .style("visibility","visible")
    d3.selectAll("#tooltip")
      .style('display', 'block')
  })
  .on('mousemove', function(d) {
    updateTooltipContent(d)
  })
  .on('mouseout', function (d,i) {
    d3.select(this).style("cursor", "default"); 
    d3.select('#circle-' + d.start_id.toString() + '-' + d.end_id.toString() + "-" + d.link.replace(/[^A-Z0-9]+/ig, "_"))
      .attr('r', 3)
    //d3.select('#text-' + d.start_id.toString() + '-' + d.end_id.toString())
      //.style("visibility","hidden")
    d3.select('#line-' + d.end_name.toString().replace(/[^A-Z0-9]+/ig, "_"))
      .style("visibility","hidden")
    d3.selectAll("#tooltip")
      .style('display', 'none')
  })

  // CREATE AXES // 
  xAxis = d3.axisTop(xScale).ticks(d3.timeYear.every(5)).tickSizeOuter(0).tickSizeInner(0)
  yAxis = d3.axisLeft(yScale).tickSize(-width)

  d3.select(".x_axis")
    .call(xAxis)
    .call(g => {
      g.selectAll("text").attr("transform", `translate(0, 0)`) //shift tick labels to middle of interval
        .attr("y", axisPad)
        .attr('fill', '#A9A9A9')
        .style('font-size', 16)
      g.selectAll("line")
        .attr('stroke', '#A9A9A9')

      g.select(".domain").remove()

    })

  d3.select(".y_axis")
    .call(yAxis)
    .call(g => {
      g.selectAll("text")
      .attr("x", -axisPad*2)
      .style("font-weight", "normal")
      .attr('fill', '#A9A9A9')
      .style("cursor", "pointer")

      g.selectAll("line")
        .attr('stroke', '#A9A9A9')
        .attr('stroke-width', 0.7) // make horizontal tick thinner and lighter so that line paths can stand out
        .attr('opacity', 0.3)

      g.select(".domain").remove()

     })

  d3.select(".y_axis").selectAll("text").attr("class", function(d,i){ 
    return d ? d.replace(/[^A-Z0-9]+/ig, "_") : ""})

  // Remove old
  gnodes
    .exit().remove()

  glines
    .exit().remove()

  clickableAxis()
}

function clickableAxis() {

  d3.selectAll('.y_axis .tick').on('mouseover', function(e) {

    d3.select("." + e.replace(/[^A-Z0-9]+/ig, "_"))
      .style("font-weight", "bold")
      .attr('fill', 'blue')

  }).on('mouseout', function(e) {

    d3.select("." + e.replace(/[^A-Z0-9]+/ig, "_"))
      .style("font-weight", "normal")
      .attr('fill', '#A9A9A9')

  })

  d3.selectAll('.y_axis .tick').on('click', function(e) {

    d3.select("." + e.replace(/[^A-Z0-9]+/ig, "_"))
      .style("font-weight", "bold")
      .attr('fill', 'blue')

    var tmp = data.filter(d=>d.name === e.toString().trim())
    var end_ids = tmp.map(d=>d.end_id)
    
    conn_ppl = []
    end_ids.map(ID =>{  
      var start_ids = data.filter(d=>d.end_id == ID)
      conn_ppl.push(start_ids.map(d=>d.name))
    })

    conn_ppl = conn_ppl.reduce(function(a,b){return a.concat(b);}) // flatten array

    var filtered = filterData(data, 'name', conn_ppl) 
    renderChart(filtered)

  })

}

function filterData(data, param, value) {

  if(param=='name'){
    var filtered = data.filter(function (el) {
      return value.indexOf(el[param]) >= 0; 
    })
  } 
  if (param=='end_name'){
    var filtered = data.filter(d=>d[param].includes(value))
  }
  return filtered

}

function updateTooltipContent(d) {

  var dup = edges_new.filter(b=>(b.start_id == d.start_id) && (b.end_id == d.end_id))
  var conn_type = dup.map(d=>d.link)

  tooltip.html(d.player)
    .attr('class', 'text-' + d.player.replace(/[^A-Z0-9]+/ig, "_") + "-" + d.club.replace(/[^A-Z0-9]+/ig, "_"))
    .style("left", (d3.event.pageX + 10) + "px")
    .style("top", (d3.event.pageY) + "px")
    .attr('text-anchor', 'middle')
    .attr('dy', '.35em')
    .attr('fill', '#555')
    .style('font-size', '10.5px')
    .style('font-weight', 'bold')
    .style('pointer-events', 'none')
    .append('div')
    .style('font-size', '9px')
    .html(d.club)
}

function clearFilters() {
  
  // Clear all filters either made through search box or clickable axis ticks
  d3.select(".clearAll").on('click', function(){
    d3.event.preventDefault();
    var filtered = filterData(data, 'name', data.map(d=>d.name).filter(onlyUnique))
    renderChart(filtered)
  });

}

function createForm() {

  // Run update function when text area changes
  d3.select(".form-submit").on('click', function(){
    d3.event.preventDefault();
    var value = d3.select('#inputEntity').property("value") 
    var filtered = filterData(data, 'end_name', value) 
    renderChart(filtered)
  });

}



