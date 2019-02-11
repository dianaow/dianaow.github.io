var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
var height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
var canvasDim = { width: width, height: height*2};

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
  .duration(500)
  .ease(d3.easeLinear)

var colorScale = d3.scaleLinear()
  .domain(d3.range(1,9))
  .range(["#EFB605", "#E47D06", "#DB0131", "#AF0158", "#7F378D", "#3465A8", "#0AA174", "#7EB852"]);
 
var line = d3.line()
  .x(xAccessor)
  .y(yAccessor)
  .curve(d3.curveBundle.beta(0.7));

var svg = d3.select('svg')
  .attr('width', canvasDim.width)
  .attr('height', canvasDim.height)

var canvas = svg.append("g")
  .attr("class", "canvas")
  .attr('transform', 'translate(' + canvasDim.width/2 + "," + canvasDim.width/2 + ")")

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

  canvas_node.append('text')
    .attr('font-size', 20)
    .attr('font-weight', "bold")
    .attr('color', function(d) { return colorScale(d.group) })
    .text(function(d) { return d.group });

  canvas_node.each(function(m) {
    links = graph.links.filter(d =>d.source.toString().charAt(0)==m.group.toString() && d.target.toString().charAt(0)==m.group.toString())
    nodes = graph.nodes.filter(d => d.group == m.group.toString())
    renderOneNetwork(nodes, links, d3.select(this), m.group)
  })

  // Find xy coordinates of origin-destination paths that belong to different bus stop clusters
  links2 = graph.links.filter(d =>d.source.toString().charAt(0)!=d.target.toString().charAt(0))
  pathsBtnNodes = []
  links2.map(function (d) {
    var source = d3.select('#node-' + d.source).node().getBoundingClientRect()
    var target = d3.select('#node-' + d.target).node().getBoundingClientRect()
    pathsBtnNodes.push({
      source: d.source,
      target: d.target, 
      path: d.path,
      coordinates: [[source.x, source.y],[target.x, target.y]] })
  });
  //console.log(pathsBtnNodes)

  linksBtnNodes(pathsBtnNodes, canvas_node_no_transform)

} 

function renderOneNetwork(nodes, links, nodeElement, digit) {

  var same = [4,5,6] //modify diameter of network nodes to makes them more aesthetically pleasing
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
  //console.log(paths)

  // LINKS WITHIN NODES
  var link = nodeElement.selectAll('.link')
    .data(paths)
    .enter().append('path')
    .attr('class', 'link')
    .attr('d', function (d) { return line(d) })

  link.on('mouseover', function (l) {
    d3.select(this)
      .style('stroke', colorScale(digit))
      .style('stroke-opacity', 1);

    node.filter(function (n) { return n === l[0] || n === l[l.length - 1]; })
      .selectAll('circle')
      .style('fill', 'black')

    node.filter(function (n) { return n === l[0] || n === l[l.length - 1]; })
      .selectAll('text')
      .style("visibility","visible")
  })
  .on('mouseout', function (d) {
    link
      .style('stroke', null)
      .style('stroke-opacity', null);

    node
      .selectAll('circle')
      .style('fill', colorScale(digit))

    node.filter(function (n) { return n === d[0] || n === d[d.length - 1]; }) 
      .selectAll('text')
      .style("visibility","hidden")
  });

  // NODES
  var node = nodeElement.selectAll('.node')
    .data(tree.leaves())
    .enter().append('g')
    .attr('class', 'node')
    .attr('transform', function (d) { return 'translate(' + xAccessor(d) + ',' + yAccessor(d) + ')'; })

  node.append('circle')
    .attr('id', function (d) { return 'node-' + d.data.name })
    .attr('r', same.indexOf(digit) != -1 ? 3.5: 2.5)
    .style('fill', colorScale(digit))

  node.filter(function (d) { return interchanges.indexOf(d.data.label) != -1})
    .selectAll('circle')
    .style('r', same.indexOf(digit) != -1 ? 4: 3)
    .style('stroke-width', 1)
    .style('stroke', 'black')

  node.append('text')
    .attr('id', function (d) { return 'node-' + d.data.name })
    .attr('dy', '0.32em')
    .attr('x', function (d) { return d.x < 180 ? 6 : -6; })
    .attr('transform', function (d) { return 'rotate(' + (d.x < 180 ? d.x - 90 : d.x + 90) + ')'; })
    .style('font-size', 8)
    .style('color', 'black')
    .style('text-anchor', function (d) { return d.x < 180 ? 'start' : 'end'; })
    .style("visibility","hidden")
    .text(function (d) { return d.data.name + '-' + d.data.label })
    //.text(function (d) { return d.data.label });

  node.on('mouseover', function (d) {
    d3.select(this)
      .selectAll('circle')
      .style('fill', 'black')

    node.selectAll('text')
        .transition()
        .duration(200)
        .style("visibility","visible")

    link
      .style('stroke-opacity', function (link_d) {
        return link_d[0] === d | link_d[link_d.length - 1] === d ? 1 : null;
      })
      .style('stroke', function (link_d) {
        return link_d[0] === d | link_d[link_d.length - 1] === d ? colorScale(digit) : null;
      });
    })
  .on('mouseout', function (d) {
    link
      .style('stroke-opacity', null)
      .style('stroke', null);

    node.selectAll('circle')
      .style('fill', colorScale(digit));

    node.selectAll('text')
      .transition()
      .duration(500)
      .style("visibility","hidden")
  });

}

function linksBtnNodes (links, nodeElement) {
  console.log(links)
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

     {id: "52009/60261",x1:150,y1:-50,x2:-120,y2:-20 },
     {id: "52081/60261",x1:20,y1:20,x2:20,y2:20 },
     {id: "54009/66331",x1:100,y1:-180,x2:-400,y2:500 },
     {id: "54261/66331",x1:200,y1:-200,x2:-400,y2:500 },
     {id: "54261/66481",x1:200,y1:-200,x2:0,y2:200 },
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
     {id: "65191/59079",x1:0,y1:0, x2:0,y2:0},
     {id: "66339/54009",x1:-400,y1:500,x2:100,y2:-180 },

     {id: "61039/70059",x1:-60,y1:-40,x2:30,y2:-90 },
     {id: "65199/75009",x1:20,y1:20,x2:20,y2:20 },
     {id: "65199/76191",x1:20,y1:20,x2:20,y2:20 },
     {id: "66009/70059",x1:20,y1:20,x2:20,y2:20 },

     {id: "76199/46009",x1:50,y1:50,x2:-50,y2:-50 },

     {id: "70109/52009",x1:0,y1:0, x2:0,y2:0},
     {id: "75009/59041",x1:180,y1:250,x2:-200,y2:-200 },
     {id: "75009/59079",x1:180,y1:250,x2:-200,y2:-200 },

     {id: "75009/65191",x1:20,y1:20,x2:40,y2:40 },
     {id: "75351/65191",x1:20,y1:20,x2:40,y2:40 },

     {id: "70019/81089",x1:100,y1:-350,x2:-100,y2:-350 },
     {id: "70039/81089",x1:100,y1:-350,x2:-100,y2:-350},
     {id: "70059/81089",x1:20,y1:20,x2:0,y2:20 },
     {id: "70181/81111",x1:20,y1:20,x2:20,y2:20 },
     {id: "70279/81111",x1:20,y1:20,x2:20,y2:20 },

     {id: "80101/60121",x1:-20,y1:-80,x2:120,y2:-80 }

    ]

  //gradientAlongPath(nodeElement, links) 

  links.map((d,i) => {
    links[i].params = pathDictionary.find(p=>p.id == d.path)
  })

  // LINKS ACROSS NODES
  var linkBtnNodes = nodeElement.selectAll('.linkBtnNodes')
    .data(links)
    .enter().append('path')
    .attr('class', '.linkBtnNodes')
    .attr('id', function (d) { return d.source.toString() + '/' + d.target.toString() })
    .style('stroke-width', 0.7)
    .attr('d', function (d) { return pathGenerator(d) })

  linkBtnNodes.on('mouseover', function (l) {

    d3.select(this)
      .style('stroke', "black")
      .style('stroke-width', 1)

    d3.select("circle#node-"+l.source.toString())
      .style('color', 'black')

    d3.select("text#node-"+l.source.toString())
      .style("visibility","visible")

    d3.select("circle#node-"+l.target.toString())
      .style('color', 'black')

    d3.select("text#node-"+l.target.toString())
      .style("visibility","visible")


  })
  .on('mouseout', function (l) {
    linkBtnNodes
      .style('stroke', null)
      .style('stroke-opacity', null);

    d3.select("circle#node-"+l.source.toString()).transition(t)
      .style('color', 'black')

    d3.select("text#node-"+l.source.toString()).transition(t)
      .style("visibility","hidden")

    d3.select("circle#node-"+l.target.toString()).transition(t)
      .style('color', 'black')

    d3.select("text#node-"+l.target.toString()).transition(t)
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

function gradientAlongPath(nodeElement, links) {

  var arcLinksG = nodeElement.append("g")
    .attr("class", "arcLinksG")

  //Create a gradient definition for each path
  var grads = arcLinksG.append("defs").selectAll("linearGradient")
    .data(links)
    .enter().append("linearGradient")
    //Create a unique gradient id per chord: e.g. "chordGradient-0-4"
    .attr("id", function(d) {
        return "arcGradient-" + d.path; 
    })
    //.attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%")

  //Set the starting color (at 0%)
  grads.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", function(d){ 
        return (d.path.split("/")[0] == d.source.toString()) ? "#66FF00" : "red"
      });

  grads.append("stop")
      .attr("offset", "10%")
      .attr("stop-color", function(d){ return null });

  grads.append("stop")
      .attr("offset", "90%")
      .attr("stop-color", function(d){ return null });

  //Set the ending color (at 100%)
  grads.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", function(d){ 
        return (d.path.split("/")[0] == d.target.toString()) ? "#66FF00" : "red"
      });

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
