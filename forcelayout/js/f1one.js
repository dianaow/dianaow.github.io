
//Width and height
var width = 780,
    height = 500;

//Original data
var dataset = {
    "nodes":[
      {"id":0,"name":""},
      {"id":1,"name":"Shanghai SIPG"},
      {"id":2,"name":"Beijing Guoan"},
      {"id":3,"name":"Guangzhou Evergrande"},
      {"id":4,"name":"Shenzhen FC"},
      {"id":5,"name":"Shandong Luneng"},
      {"id":6,"name":"Jiangsu Suning"},
      {"id":7,"name":"Wuhan Zall"},
      {"id":8,"name":"Hebei China"},
      {"id":9,"name":"Dalian Yifang"},
      {"id":10,"name":"Guangzhou R&F"},
      {"id":11,"name":"Henan Jianye"},
      {"id":12,"name":"Chongqing Lifan"},
      {"id":13,"name":"Tianjin Teda"},
      {"id":14,"name":"Beijing Teda"},
      {"id":15,"name":"Tianjin Tianhai"},
      {"id":16,"name":"Shanghai Shenhua"}
    ],
    "links":[
      {"id":1,"source":1,"target":0},
      {"id":2,"source":2,"target":0},
      {"id":3,"source":3,"target":0},
      {"id":4,"source":4,"target":0},
      {"id":5,"source":5,"target":0},
      {"id":6,"source":6,"target":0},
      {"id":7,"source":7,"target":0},
      {"id":8,"source":8,"target":0},
      {"id":9,"source":9,"target":0},
      {"id":10,"source":10,"target":0},
      {"id":11,"source":11,"target":0},
      {"id":12,"source":12,"target":0},
      {"id":13,"source":13,"target":0},
      {"id":14,"source":14,"target":0},
      {"id":15,"source":15,"target":0},
      {"id":16,"source":16,"target":0}
    ]
};

var nodes = dataset.nodes
var links = dataset.links

// apend 
var simulation = d3.forceSimulation()
        .force("link", d3.forceLink()
                        .id(function(d,i) { return i })
                        .distance(150)
        )
        .force("charge", d3.forceManyBody().strength(function(d,i) { return i==0 ? 10*-500 : -500 }))
        .force("center", d3.forceCenter(width / 2, height / 2));

simulation
    .nodes(nodes)

simulation.force("link")
    .links(links)

for (var i = nodes.length * nodes.length; i > 0; --i) simulation.tick();

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

// Draw curved lines connecting node to center
//var lines = svg.selectAll("path")
    //.data(links).enter().append("path")
    //.attr("class", function(d,i) { return "node-link node-link-"+ d.id.toString()})
    //.attr("d", function(d) {
        //var dx = d.target.x - d.source.x,
            //dy = d.target.y - d.source.y,
            //dr = Math.sqrt(dx * dx + dy * dy);
        //return "M" + 
            //d.source.x + "," + 
            //d.source.y + "A" + 
            //dr + "," + dr + " 0 0,1 " + 
            //d.target.x + "," + 
            //d.target.y;
    //});

var gnodes = svg.selectAll('g.gnode')
    .data(nodes).enter().append('g')
    .attr("class", function(d,i) { return "gnode node-"+ d.id.toString()})
    .attr("transform", function(d,i) { 
      return "translate(" + d.x + "," + d.y + ")"; 
    });

var node = gnodes.append("circle")
    .attr("r", 30)
    .attr("class", "node")
    .on("mouseenter", function(d) {
        node.transition().duration(100).attr("r", 25)
        d3.select(this).transition().duration(100).attr("r", 30)
    })
    .on("mouseleave", function(d) {
        node.transition().duration(100).attr("r", 25);
    })

  gnodes.on("click", function(d,i) {
      swapPositions(d, d3.select(this))
    }); 

var labels = gnodes.append("text")
    .attr("dy", 4)
    .attr('font-size', 9)
    .text(function(d){return d.})


var center = d3.select(".node-0").classed("centered", true)
center.select('circle').attr('r', 150)

gnodes.each(function (d) {
  drawArcsforName(d3.select(this), d)
});

function drawArcsforName(nodeElement, d) {

  // Draw arcs of nodes
  var arcs =  nodeElement.append("path")
    .attr("id", function(d) { return "s"+d.id; }) //Unique id of the path
    .attr("d", function(d) { return describeArc(d.vx, d.vy, 30, -160, 160); }) //SVG path
    .style("fill", "none")

  // Append text to arcs of nodes
  var arcPaths = nodeElement.append("text")
    .append('textPath')
      .attr("fill", 'black')
      .attr('font-size', 9)
      .attr("xlink:href", function(d) { return "#s"+d.id; }) //place the ID of the path here
      .attr("text-anchor", "middle") //place the text halfway on the arc
      .attr("startOffset", "50%")
      .text(function(d) { return d.name; })

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