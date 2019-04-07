var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
var height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
var canvasDim = { width: width, height: screen.width<=1024 ? height: height*2};

var graph = []
var graphBtnNodes = []
// Create empty array if haven't already done so
if(!graph.nodes) {
  graph.nodes = []
}
if(!graph.links) {
  graph.links = []
}
if(!graphBtnNodes.links) {
  graphBtnNodes.links = []
}

var t = d3.transition()
  .duration(1000)
  .ease(d3.easeLinear)

var colorScale = d3.scaleLinear()
  .domain(d3.range(1,9))
  .range(["#EFB605", "#E47D06", "#DB0131", "#AF0158", "#7F378D", "#3465A8", "#0AA174", "#7EB852"]);

var logScale = d3.scaleLog()
  .domain([5000, 50000])

var colorScaleLog = d3.scaleSequential(d => d3.interpolateViridis(logScale(d)))   

var line = d3.line()
  .x(xAccessor)
  .y(yAccessor)
  .curve(d3.curveBundle.beta(0.7));

var svg = d3.select('svg')
  .attr('width', canvasDim.width+800)
  .attr('height', canvasDim.height+800)

var canvas = svg.append("g")
  .attr("class", "canvas")
  .attr('transform', 'translate(' + 800 + "," + 800 + ")")

var same = [4,5,6] //modify diameter of network nodes to makes them more aesthetically pleasing

init()

function init() {

  d3.queue()   
    .defer(d3.csv, './data/od_bus.csv') 
    .defer(d3.csv, './data/busstops.csv') 
    .await(createChart);  

}

function createChart(error, csv1, csv2){

  initializeData(csv1, csv2)
  networks()
  appendLegend()

}

function initializeData(csv1, csv2){

  graph.links = csv1.map((d,i) => {
    return {
      source: +d.ORIGIN_PT_CODE,
      target: +d.DESTINATION_PT_CODE,
      total: +d.TOTAL_TRIPS,
      path: d.PATH
    }
  })

  busstops = csv2.map((d,i) => {
    return {
    BusStopCode: +d.BusStopCode,
    RoadName: d.RoadName,
    Description: d.Description
    }
  })

  // Create nodes (bus stops) out of existing origin-destination links.
  // This ensures the number of nodes to plot are kept to the minumum. Only nodes with a link are plotted
  var arr = [] // store array of nodes ID
  graph.nodes = []
  graph.links.filter(function(item){
    var i = graph.nodes.findIndex(x => x.name == item.source);
    if(i <= -1){
      graph.nodes.push({name: item.source, group: item.source.toString().charAt(0)});
      arr.push(item.source)
    }
    return null;
  })

  graph.links = graph.links.filter(d =>(arr.indexOf(d.target) != -1))
  
  // For convenience in labelling nodes later
  graph.nodes.forEach((d,i) => {
    var tmp = busstops.find(b=>b.BusStopCode==d.name)
    d.label = (tmp ? tmp.RoadName : "") + " - " + (tmp ? tmp.Description : "")
  })
  
  // Filter out certain nodes that have small number of bus stops
  graph.links = graph.links.filter(d =>d.source.toString().charAt(0)!="3" && d.target.toString().charAt(0)!="3")
  graph.links = graph.links.filter(d =>d.source.toString().charAt(0)!="9" && d.target.toString().charAt(0)!="9")
  graph.nodes = graph.nodes.filter(d => d.group != "3")
  graph.nodes = graph.nodes.filter(d => d.group != "9")

  // Important to pan out bus stops radially around node
  graph.nodes.sort(function(a, b) {
    return d3.ascending(a.name, b.name);
  })
  //console.log(graph.nodes, graph.links)

}

function networks() {

  //var metaAll = []
  //for (i = 1; i < 9; i++) {
    //if(i!=3){
      //metaAll.push({group: i})
    //}
  //}
  var metaAll = [{group: 4, rotate:160}, {group: 5, rotate:0}, {group: 6, rotate:-45},
                 {group: 2, rotate:-100}, {group: 7, rotate:0}, {group: 8, rotate:0}, {group: 1, rotate:90}]

  var canvas_node_no_transform = svg.append('g').attr('class', '.no-transform')

  var canvas_node = canvas.selectAll('.canvas-node')
    .data(metaAll)
    .enter().append('g')
    .attr('class', 'canvas-node')
    .attr('id', function(d) { return 'canvas-node-' + d.group.toString() })

  // Initialize force simulation
  var simulation = d3.forceSimulation(metaAll)
      .force("charge", d3.forceCollide().radius(240))
      .force("r", d3.forceRadial(200))
      .stop()

  for (var i = 0; i < 100; ++i) simulation.tick()

  canvas_node.attr('transform', function(d) { return 'translate(' + d.x + "," + d.y + ")rotate(" + d.rotate + ")" })

  canvas_node.each(function(m) {
    links = graph.links.filter(d =>d.source.toString().charAt(0)==m.group.toString() && d.target.toString().charAt(0)==m.group.toString())
    nodes = graph.nodes.filter(d => d.group == m.group.toString())
    renderOneNetwork(nodes, links, d3.select(this), m.group)
  })

  // Find xy coordinates of origin-destination paths that belong to different bus stop clusters
  links2 = graph.links.filter(d =>d.source.toString().charAt(0)!=d.target.toString().charAt(0))
  pathsBtnNodes = []
  links2.map(function (d) {
    var source = d3.select('#circle-' + d.source).node().getBoundingClientRect()
    var target = d3.select('#circle-' + d.target).node().getBoundingClientRect()
    pathsBtnNodes.push({
      source: d.source,
      target: d.target, 
      path: d.path,
      total: d.total,
      coordinates: [[source.x, source.y],[target.x, target.y]] })
  });
  //console.log(pathsBtnNodes)

  linksBtnNodes(pathsBtnNodes, canvas_node_no_transform)

  canvas.selectAll('.canvas-node-label')
    .data(metaAll)
    .enter().append('g')
    .attr('class', 'canvas-node-label')
    .attr('transform', function(d) { return 'translate(' + d.x + "," + d.y + ")" })
    .append('text')
    .attr('font-size', 22)
    .attr('font-weight', "bold")
    .attr('fill', function(d) { return colorScale(d.group) })
    .text(function(d) { return d.group })
} 

function renderOneNetwork(nodes, links, nodeElement, digit) {

  var interchanges = nodes.filter(d => d.label.includes("Int")).map(d=>d.label) //find the bus interchanges to place specific styles to them

  var diameter = same.indexOf(digit) != -1 ? nodes.length*3.5: nodes.length*5;
  var radius = diameter / 2;
  var innerRadius = radius - 70;

  var cluster = d3.cluster()
    .size([360, innerRadius])
    .separation(function(a, b) { return (a.parent == b.parent ? 1 : a.parent.parent == b.parent.parent ? 2 : 4); });

  var tree = cluster(d3.hierarchy(createHierarchy(nodes)))
  var leaves = tree.leaves();

  paths = links.map(function (l) {
    var source = leaves.filter(function (d) { return d.data.name === l.source; })[0];
    var target = leaves.filter(function (d) { return d.data.name === l.target; })[0];
    return source.path(target);
  });

  // LINKS WITHIN NODES
  var link = nodeElement.selectAll('.link')
    .data(paths)
    .enter().append('path')
    .attr('class', 'link')
    .style("stroke", function (l) { 
      var path = l[0].data.name + "/" + l[l.length - 1].data.name
      var total = links.filter(function (d) { return d.path === path })[0]['total']
      return colorScaleLog(total)
    })
    .style('stroke-opacity', 0.7)
    .attr('d', function (d) { return line(d) })

  link.on('mouseover', function (l) {
    link
      .style('stroke', null)
      .style('stroke-opacity', 0.7);

    d3.select(this)
      .style('stroke', colorScale(digit))
      .style('stroke-opacity', 1)

    d3.select("#circle-"+l[0].data.name)
      .style('fill', '#66FF00')
      .attr('r', 6)

    d3.select("#circle-"+l[l.length - 1].data.name)
      .style('fill', 'red')
      .attr('r', 6)

    node.filter(function (n) { return n === l[0] || n === l[l.length - 1]; })
      .selectAll('text')
      .style("visibility","visible")

  })
  .on('mouseout', function (l) {
    link
      .style('stroke', function(l) {
        var path = l[0].data.name + "/" + l[l.length - 1].data.name
        var total = links.filter(function (d) { return d.path === path })[0]['total']
        return colorScaleLog(total)
      })
      .style('stroke-opacity', 0.7)

    d3.select("#circle-"+l[0].data.name)
      .style('fill', colorScale(l[0].data.name.toString().charAt(0)))
      .attr('r', same.indexOf(l[0].data.name.toString().charAt(0)) != -1 ? 3.5: 3)

    d3.select("#circle-"+l[l.length - 1].data.name)
      .style('fill', colorScale(l[l.length - 1].data.name.toString().charAt(0)))
      .attr('r', same.indexOf(l[l.length - 1].data.name.toString().charAt(0)) != -1 ? 3.5: 3)

    node.filter(function (n) { return n === l[0] || n === l[l.length - 1]; }) 
      .selectAll('text')
      .style("visibility","hidden")

  })

  // NODES
  var node = nodeElement.selectAll('.node')
    .data(tree.leaves())
    .enter().append('g')
    .attr('class', 'node')
    .attr('transform', function (d) { return 'translate(' + xAccessor(d) + ',' + yAccessor(d) + ')'; })

  node.append('circle')
    .attr('id', function (d) { return 'circle-' + d.data.name })
    .attr('r', same.indexOf(digit) != -1 ? 3.5: 3)
    .style('fill', colorScale(digit))
    .style('stroke-width', 0)

  node.filter(function (d) { return interchanges.indexOf(d.data.label) != -1})
    .selectAll('circle')
    .style('r', same.indexOf(digit) != -1 ? 4: 3.5)
    .style('stroke-width', 1)
    .style('stroke', 'white')

  node.append('text')
    .attr('id', function (d) { return 'text-' + d.data.name })
    .attr('dy', '0.32em')
    .attr('x', function (d) { return d.x < 180 ? 6 : -6; })
    .attr('transform', function (d) { return 'rotate(' + (d.x < 180 ? d.x - 90 : d.x + 90) + ')'})
    .style('font-size', 9)
    .style('fill', 'white')
    .style('text-anchor', function (d) { return d.x < 180 ? 'start' : 'end'; })
    .style("visibility","hidden")
    .text(function (d) { return d.data.name + '-' + d.data.label })
    //.text(function (d) { return d.data.label });

  node.on('mouseover', function (l) {
    d3.select(this)
      .selectAll('circle')
      .style('fill', 'white')

    node
      .selectAll('text')
      .style("visibility","visible")

    link
      .style('stroke-opacity', function (link_d) {
        return link_d[0] === l | link_d[link_d.length - 1] === l ? 1 : null;
      })
      .style('stroke', function (link_d) {
        return link_d[0] === l | link_d[link_d.length - 1] === l ? colorScale(digit) : null;
      });
    })
  .on('mouseout', function (l) {
    node.selectAll('circle')
      .style('fill', colorScale(digit));

    node.selectAll('text')
      .style("visibility","hidden")

    link
      .style('stroke', function(l) {
        var path = l[0].data.name + "/" + l[l.length - 1].data.name
        var total = links.filter(function (d) { return d.path === path })[0]['total']
        return colorScaleLog(total)
      })
      .style('stroke-opacity', 0.7)

  });

}

function linksBtnNodes (links, nodeElement) {

  pathDictionary = 
    [
     {id: "17171/20239",x1:20,y1:20,x2:-40,y2:30 },
     {id: "17171/28649",x1:20,y1:20,x2:-40,y2:30 },
     {id: "17171/28679",x1:20,y1:20,x2:-40,y2:30 },
     {id: "17171/28689",x1:20,y1:20,x2:-40,y2:30 },
     
     {id: "17171/42311",x1:20,y1:20,x2:20,y2:20 },

     {id: "20109/17009",x1:20,y1:20,x2:20,y2:20 },
     {id: "20109/17179",x1:20,y1:20,x2:20,y2:20 },
     {id: "20299/17171",x1:20,y1:20,x2:20,y2:20 },
     {id: "21019/17179",x1:20,y1:20,x2:20,y2:20 },
     {id: "28671/17179",x1:20,y1:20,x2:20,y2:20 },

     {id: "42319/17179",x1:20,y1:20,x2:20,y2:20 },
     {id: "43509/17179",x1:20,y1:20,x2:20,y2:20 },
     {id: "43619/17179",x1:20,y1:20,x2:20,y2:20 },
     
     {id: "42151/28679",x1:20,y1:20,x2:20,y2:20 },
     {id: "42151/28689",x1:20,y1:20,x2:20,y2:20 },

     {id: "46009/65069",x1:20,y1:20,x2:50,y2:50 },
     {id: "46009/65199",x1:20,y1:20,x2:50,y2:50 },
     {id: "46009/67409",x1:-300,y:-200,x2:-10,y2:-100 },
     {id: "46009/76191",x1:-80,y1:-120,x2:50,y2:50 },

     {id: "48131/54009",x1:20,y1:20,x2:20,y2:20 },

     {id: "54009/48131",x1:20,y1:20,x2:20,y2:20 },
     {id: "59079/47619",x1:20,y1:380,x2:0,y2:20 },

     {id: "52009/60261",x1:150,y1:-50,x2:-150,y2:-20 },
     {id: "52081/60261",x1:150,y1:-50,x2:-150,y2:-20 },
     {id: "54009/66331",x1:100,y1:-180,x2:-400,y2:500 },
     {id: "54261/66331",x1:200,y1:-200,x2:-400,y2:500 },
     {id: "54261/66481",x1:210,y1:-240,x2:-300,y2:550 },
     {id: "55509/64491",x1:500,y1: 100,x2:400,y2:350 },
     {id: "59049/65199",x1:-350,y1:-400,x2:0,y2:200 },
     {id: "59073/65199",x1:-350,y1:-400,x2:0,y2:200 },

     {id: "59049/75009",x1:-250,y1:-250,x2:180,y2:250},
     {id: "59073/75009",x1:-250,y1:-250,x2:180,y2:250 },
    
     {id: "65061/46009",x1:40,y1:40,x2:20,y2:20 },
     {id: "65191/46009",x1:40,y1:40,x2:20,y2:20 },
     {id: "67401/46009",x1:-50,y1:50,x2:-20,y2:0 },

     {id: "60089/52009",x1:-150,y1:-20,x2:150,y2:-50 },
     {id: "60121/52009",x1:-150,y1:-20,x2:150,y2:-50 },
     {id: "60219/52009",x1:-150,y1:-20,x2:150,y2:-50 },
     {id: "60229/52009",x1:-150,y1:-20,x2:150,y2:-50 },
     {id: "65191/59041",x1:0,y1:200, x2:-300,y2:-300},
     {id: "65191/59079",x1:0,y1:200, x2:-300,y2:-300},
     {id: "66339/54009",x1:-400,y1:500,x2:100,y2:-180 },

     {id: "61039/70059",x1:-60,y1:-40,x2:30,y2:-90 },
     {id: "65199/75009",x1:20,y1:20,x2:20,y2:20 },
     {id: "65199/76191",x1:20,y1:20,x2:20,y2:20 },
     {id: "66009/70059",x1:20,y1:20,x2:20,y2:20 },

     {id: "76199/46009",x1:50,y1:50,x2:-50,y2:-50 },

     {id: "70109/52009",x1:150,y1:100, x2:150,y2:-150},
     {id: "75009/59041",x1:180,y1:250,x2:-200,y2:-200 },
     {id: "75009/59079",x1:180,y1:250,x2:-200,y2:-200 },

     {id: "75009/65191",x1:20,y1:20,x2:0,y2:40 },
     {id: "75351/65191",x1:20,y1:20,x2:0,y2:40 },

     {id: "70019/81089",x1:100,y1:-350,x2:-100,y2:-350 },
     {id: "70039/81089",x1:100,y1:-350,x2:-100,y2:-350},
     {id: "70059/81089",x1:100,y1:-350,x2:-100,y2:-350},
     {id: "70181/81111",x1:100,y1:-400,x2:-100,y2:-400 },
     {id: "70279/81111",x1:100,y1:-400,x2:-100,y2:-400 },

     {id: "80101/60121",x1:-20,y1:-80,x2:120,y2:-80 }

    ]

  links.map((d,i) => {
    links[i].params = pathDictionary.find(p=>p.id == d.path)
  })

  // LINKS ACROSS NODES
  var linkBtnNodes = nodeElement.selectAll('.linkBtnNodes')
    .data(links)
    .enter().append('path')
    .attr('class', '.linkBtnNodes')
    .attr('id', function (d) { return d.source.toString() + '/' + d.target.toString() })
    .style('stroke-width', 1)
    .style("stroke", d=>colorScaleLog(d.total))
    .style('stroke-opacity', 0.7)
    .attr('d', function (d) { return pathGenerator(d) })

  linkBtnNodes.on('mouseover', function (l) {

    d3.select(this)
      .style('stroke', "white")
      .style('stroke-width', 1.5)

    d3.select("#circle-"+l.source.toString())
      .style('fill', '#66FF00')
      .attr('r', 6)

    d3.select("#text-"+l.source.toString())
      .style("visibility","visible")

    d3.select("#circle-"+l.target.toString())
      .style('fill', 'red')
      .attr('r', 6)

    d3.select("#text-"+l.target.toString())
      .style("visibility","visible")


  })
  .on('mouseout', function (l) {
    linkBtnNodes
      .style("stroke", d=>colorScaleLog(d.total))
      .style('stroke-opacity', 0.7)

    d3.select("#circle-"+l.source.toString())
      .style('fill', colorScale(l.source.toString().charAt(0)))
      .attr('r', same.indexOf(l.source.toString().charAt(0)) != -1 ? 3.5: 3)

    d3.select("#text-"+l.source.toString())
      .style("visibility","hidden")

    d3.select("#circle-"+l.target.toString())
      .style('fill', colorScale(l.target.toString().charAt(0)))
      .attr('r', same.indexOf(l.target.toString().charAt(0)) != -1 ? 3.5: 3)

    d3.select("#text-"+l.target.toString())
      .style("visibility","hidden")

  });


}

function createHierarchy (item) {
  var hierarchy = {
    root: {name: 'root', children: []}
  };

  item.forEach(function (c) {
    var group = c.group

    if (!hierarchy[group]) {
      hierarchy[group] = {name: group, children: [], parent: hierarchy['root']};
      hierarchy['root'].children.push(hierarchy[group]);
    }

    c.parent = hierarchy[group];
    hierarchy[group].children.push(c);
  });

  //console.log(hierarchy['root'])
  return hierarchy['root'];
}

function getTranslation(transform) {
  // Create a dummy g for calculation purposes only. This will never
  // be appended to the DOM and will be discarded once this function 
  // returns.
  var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  
  // Set the transform attribute to the provided string value.
  g.setAttributeNS(null, "transform", transform);
  
  // consolidate the SVGTransformList containing all transformations
  // to a single SVGTransform of type SVG_TRANSFORM_MATRIX and get
  // its SVGMatrix. 
  var matrix = g.transform.baseVal.consolidate().matrix;
  
  // As per definition values e and f are the ones for the translation.
  return [matrix.e, matrix.f];
}

function pathGenerator(d) {
  var xtarget = d.coordinates[1][0]
  var xsource = d.coordinates[0][0]
  var ytarget = d.coordinates[1][1]
  var ysource = d.coordinates[0][1]
  if (d.params==undefined) {
    console.log(d)
  }
  
  var path =  ["M" + xsource.toString() + " " + ysource.toString() 
  + " C " + (xsource+d.params.x1).toString() + " " + (ysource+d.params.y1).toString() + ", " + (xtarget+d.params.x2).toString() + " " + (ytarget+d.params.y2).toString()
  + " , " + xtarget.toString() + " " + ytarget.toString()]
  return path
  //r eturn ["M" + xsource.toString() + " " + ysource.toString() 
  //+ " Q " + (xsource+d.params.x1).toString() + " " + (d.params.y1).toString() + ", " + (xtarget+d.params.x2).toString() + " " + (ytarget).toString()
  //+ " T " + xtarget.toString() + " " + ytarget.toString()]
  //return ["M", xsource, ysource,"Q", xsource+d.params.x1, ysource+d.params.y1, xtarget+d.params.x2, ytarget+d.params.y2, "T", xtarget, ytarget].join(" ") 
}

function appendLegend() {

  var legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(90,450)")

  var radius = 6
  var dummy_nodes = 
  [{name:1, group:"1", label:"South-West"},
   {name:2, group:"2", label:"West"}, 
   {name:4, group:"4", label:"North"},
   {name:5, group:"5", label:"Central"}, 
   {name:6, group:"6", label:"North-East"},
   {name:7, group:"7", label:"East (Pasir Ris)"},
   {name:8, group:"8", label:"East (Bedok)"}]

  var yscale = d3.scaleLinear()
    .domain([0, dummy_nodes.length - 1])
    .range([0, 100]);

  dummy_nodes.forEach(function(d, i) {
    // d.x = xscale(i);
    // d.y = yfixed;
    d.x = 10;
    d.y = yscale(i);
  });

  dummy_links = [{target:5, source: 1, path: "1/5", total:10000},
                 {target:6, source: 1, path: "1/6", total:20000},
                 {target:7, source: 1, path: "1/7", total:30000},
                 {target:8, source: 1, path: "1/8", total:40000},
                 {target:9, source: 1, path: "1/9", total:50000}]

  dummy_links.forEach(function(d, i) {
    d.origin = d.source
    d.destination = d.target
    d.source = dummy_nodes.find(x => (x.name === d.source)).y
    d.target = dummy_nodes.find(x => (x.name === d.target)) ? dummy_nodes.find(x => (x.name === d.target)).y : d.source
  });

  legend.selectAll(".legend-node")
    .data(dummy_nodes)
    .enter()
    .append("circle")
    .attr("class", "legend-node")
    .attr("id", d=>d.name)
    .attr("cx", d=>d.x)
    .attr("cy", d=>d.y)
    .attr("r", radius)
    .style("fill", d=>colorScale(d.group))

  legend.selectAll(".legend-text")
    .data(dummy_nodes)
    .enter()
    .append("text")
    .attr("class", "legend-text")
    .attr("id", d=>d.name)
    .attr("x", d=>d.x + (2*radius))
    .attr("y", d=>d.y + radius)
    .style("fill", "white")
    .style("font-size", 9)
    .text(d=>d.group)

  legend.selectAll(".legend-label")
    .data(dummy_nodes)
    .enter()
    .append("text")
    .attr("class", "legend-label")
    .attr("id", d=>d.name)
    .attr("x", d=>d.x + (4*radius))
    .attr("y", d=>d.y + radius)
    .style("fill", "white")
    .style("font-size", 9)
    .text(d=>d.label)

  legend
    .append("text")   
    .attr("x", dummy_nodes[0].x/2)
    .attr("y", dummy_nodes[0].y - 30)
    .style("fill", "white")
    .style("font-size", 11)
    .style('font-weight', 'bold')
    .text("Bus Stop Codes starting with:")

  legend
    .append("text")
    .attr("x", dummy_nodes[0].x/2)
    .attr("y", dummy_nodes[0].y - 20)
    .style("fill", "white")
    .style("font-size", 10)
    .text("(Hover over nodes to show bus stop names)")

  legend
    .append("circle")
    .attr("cx", dummy_nodes[0].x/2 + 6)
    .attr("cy", 130)
    .attr("r", 6)
    .style("fill", "transparent")
    .style("stroke", "white")
    .style("stroke-width", 1)

  legend
    .append("text")
    .attr("x", dummy_nodes[0].x/2 + 6 + 12)
    .attr("y", 130+ 6/2)
    .style("fill", "white")
    .style("font-size", 11)
    .text("Bus Interchange")

  legend
    .append("text")   
    .attr("x", dummy_nodes[0].x/2)
    .attr("y", 160)
    .style("fill", "white")
    .style("font-size", 11)
    .style('font-weight', 'bold')
    .text("Hover over a link for path details:")

  legend
    .append("circle")
    .attr("class", "legend-origin")
    .attr("cx", dummy_nodes[0].x/2 + 6)
    .attr("cy", 180)
    .attr("r", 6)
    .style("fill", "green")

  legend
    .append("circle")
    .attr("class", "legend-dest")
    .attr("cx", dummy_nodes[0].x/2 + 6 + 80)
    .attr("cy", 180)
    .attr("r", 6)
    .style("fill", "red")

  legend
    .append("text")
    .attr("class", "legend-origin")
    .attr("x", dummy_nodes[0].x/2 + 6 + 12)
    .attr("y", 180 + 6/2)
    .style("fill", "white")
    .style("font-size", 11)
    .text("origin")

  legend
    .append("text")
    .attr("class", "legend-dest")
    .attr("x", dummy_nodes[0].x/2 + 6 + 80 + 12)
    .attr("y", 180 + 6/2)
    .style("fill", "white")
    .style("font-size", 11)
    .text("destination")
  
  const barHeight = 20;
  const barWidth = 20;
  const points = d3.range(10000, 50001, 5000)

  var legend_scale = legend.append('g')
      .attr('class', 'scale')
      .attr('transform', 'translate(5,200)')

  legend_scale.selectAll('.legend-bars')
    .data(points)
    .enter()
    .append('rect')
      .attr("class", "legend-bars")
      .attr('y', 20)
      .attr('x', (d, i) => i * barWidth)
      .attr('width', barWidth)
      .attr('height', barHeight)
      .attr('fill', d=>colorScaleLog(d))
  
  legend_scale
    .append('text')
      .attr('y', 10)
      .attr('x', 0)
      .attr('fill', 'white') 
      .style("font-size", 11)
      .style('font-weight', 'bold')
      .text('Passenger Volume')

  legend_scale.selectAll('.legend-text')
    .data(points)
    .enter()
    .append('text')
      .attr('y', 50)
      .attr('x', (d, i) => i * barWidth)
      .attr('fill', 'white') 
      .style("font-size", 11)
      .text((d, i) => i%3 === 0 ? d : "") 

}

function xAccessor (d) {
  var angle = (d.x - 90) / 180 * Math.PI, radius = d.y;
  return radius * Math.cos(angle);
}

function yAccessor (d) {
  var angle = (d.x - 90) / 180 * Math.PI, radius = d.y;
  return radius * Math.sin(angle);
}

function gridX(i) {
  if (i % 3 === 0) {
    return canvasDim.width
  } else if (i % 2 === 0) {
    return canvasDim.width * (2/3)
  } else {
    return canvasDim.width * (1/3)
  }
}

function gridY(i) {
  if (i <= 3) {
    return canvasDim.width * (1/3)
  } else if (i > 3 && i <= 6) {
    return canvasDim.width * (2/3)
  } else if (i > 6 && i <= 9) {
    return canvasDim.width
  }
}

function linspace(start, end, n) {
    var out = [];
    var delta = (end - start) / (n - 1);

    var i = 0;
    while(i < (n - 1)) {
        out.push(start + (i * delta));
        i++;
    }

    out.push(end);
    return out;
    }