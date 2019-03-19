var width = 500,
    height = 500;

var dataset = {
    "nodes":[
      {"id":0,"name":""},
      {"id":1,"name":"Shanghai SIPG", 'type': 'team', 'points': 6},
      {"id":2,"name":"Beijing Guoan", 'type': 'team', 'points': 6},
      {"id":3,"name":"Guangzhou Evergrande", 'type': 'team', 'points': 6},
      {"id":4,"name":"Shenzhen FC", 'type': 'team', 'points': 6},
      {"id":5,"name":"Shandong Luneng", 'type': 'team', 'points': 4},
      {"id":6,"name":"Jiangsu Suning", 'type': 'team', 'points': 3},
      {"id":7,"name":"Wuhan Zall", 'type': 'team', 'points': 3},
      {"id":8,"name":"Hebei China", 'type': 'team', 'points': 3},
      {"id":9,"name":"Dalian Yifang", 'type': 'team', 'points': 2},
      {"id":10,"name":"Guangzhou R&F", 'type': 'team', 'points': 2},
      {"id":11,"name":"Henan Jianye", 'type': 'team', 'points': 2},
      {"id":12,"name":"Chongqing Lifan", 'type': 'team', 'points': 1},
      {"id":13,"name":"Tianjin Teda", 'type': 'team', 'points': 0},
      {"id":14,"name":"Beijing Teda", 'type': 'team', 'points': 0},
      {"id":15,"name":"Tianjin Tianhai", 'type': 'team', 'points': 0},
      {"id":16,"name":"Shanghai Shenhua", 'type': 'team', 'points': 0},
      {"id":17,"name":"CQ-BJS", 'type': 'connection', 'points': '0-4'},
      {"id":18,"name":"CQ-GZF", 'type': 'connection', 'points': '2-2'},
      {"id":19,"name":"GZF-DLY", 'type': 'connection', 'points': '3-3'}
    ],
    "links":[
      {"id":1,"source":12,"target":17},
      {"id":2,"source":12,"target":17},
      {"id":3,"source":17,"target":14},
      {"id":4,"source":17,"target":13},
      {"id":5,"source":10,"target":19},
      {"id":6,"source":19,"target":9},
      {"id":7,"source":11,"target":4},
      {"id":8,"source":14,"target":4},
      {"id":9,"source":15,"target":0},
      {"id":10,"source":16,"target":3}
    ]
};


var nodes = dataset.nodes
var links = dataset.links


createChart()

function createChart(){

  // evenly spaces nodes along arc
  var circleCoord = function(circle, node, index, num_nodes){
      var circumference = circle.node().getTotalLength();
      var pointAtLength = function(l){return circle.node().getPointAtLength(l)};
      var sectionLength = (circumference)/num_nodes;
      var position = sectionLength*index+sectionLength/2;
      return pointAtLength(circumference-position)
  }

  // fades out lines that aren't connected to node d
  var is_connected = function(d, opacity) {
      lines.transition().style("stroke-opacity", function(o) {
          return o.source === d || o.target === d ? 1 : opacity;
      });
  }

  // Initialize force simulation
  simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }).strength(0.5))
    .force("charge", d3.forceManyBody().strength(function(d,i) { return d.type=='connection' ? 10*-500 : -500 }))

  simulation
      .nodes(nodes)

  simulation.force("link")
      .links(links);

  for (var i = nodes.length * nodes.length; i > 0; --i) simulation.tick();

  var svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height);

  // invisible circle for placing nodes
  // it's actually two arcs so we can use the getPointAtLength() and getTotalLength() methods
  var dim = width-80
  var circle = svg.append("path")
      .attr("d", "M 40, "+(dim/2+40)+" a "+dim/2+","+dim/2+" 0 1,0 "+dim+",0 a "+dim/2+","+dim/2+" 0 1,0 "+dim*-1+",0")
      .style("fill", "white");

  nodes.forEach(function(n, i) {
      var coord = circleCoord(circle, n, i, nodes.length-1)
      n.x = coord.x
      n.y = coord.y
  });

  // for straight line links
  var lines = svg.selectAll("line.node-link")
      .data(links).enter().append("line")
      .attr("class", function(d,i) { return "node-link node-link-"+ d.id.toString()})
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

  var gnodes = svg.selectAll('g.gnode')
      .data(nodes).enter().append('g')
      .attr("class", function(d,i) { return "gnode node-"+ d.id.toString()})
      .attr("transform", function(d,i) { 
        return "translate(" + d.x + "," + d.y + ")"; 
      });

  var node = gnodes.append("circle")
      .attr("r", 25)
      .attr("class", "node")
      .on("mouseenter", function(d) {
          is_connected(d, 0.1)
          node.transition().duration(100).attr("r", 25)
          d3.select(this).transition().duration(100).attr("r", 30)
      })
      .on("mouseleave", function(d) {
          node.transition().duration(100).attr("r", 25);
          is_connected(d, 1);
      }) 

  var labels = gnodes.append("text")
      .attr("dy", 4)
      .text(function(d){return d.points})

   var ids = gnodes.append("text")
      .attr("dy", 10)
      .attr("dy", 10)
      .text(function(d){return d.id})

}

