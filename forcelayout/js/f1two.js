var margin = {top: 120, right: 110, bottom: 120, left: 110};
var width = 1024 - margin.left - margin.right;
var height = 968 - margin.top - margin.bottom;

var svg = d3.select("body").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var nodes = [],
    links = [];

//var force = d3.layout.force()
  //.size([width, height])
  //.charge(function(d) {return d.type === 'api' ? 5 : -Math.pow(d.size, 2)})
  //.linkStrength(function(d) {return d.strength})
  //.on('tick', update);

var gnodes, circle, path, text;

function enter() {
  path = svg.selectAll('line')
    .data(links).enter().append('line')
    .attr('stroke-linecap', 'round')

  circle = svg.selectAll('circle')
    .data(nodes)
    .enter().append('circle')
    .attr('stroke-width', 2)
    //.call(force.drag)

  gnodes = svg.selectAll('g.node')
    .data(nodes)

  gnodes.enter().append("g")
    .attr('class', "node")

  text = svg.selectAll('text')
    .data(_.filter(nodes, function(node) {return node.type === 'api';}))
    .enter().append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '.35em')
    .attr('fill', '#555')
    .style({
      'font-size': '12px',
      'font-family': 'Helvetica',
      'font-weight': 600,
      'pointer-events': 'none'
    })

  textAlongPath = svg.selectAll('score_text')
    .data(_.filter(links, function(link) { return link.score != '-1'}))
    .enter().append('text')
    .attr('class', 'score_text')
    .attr('text-anchor', 'middle')
    .attr('dy', '.35em')
    .attr('fill', '#555')
    .style({
      'font-size': '12px',
      'font-family': 'Helvetica',
      'font-weight': 600,
      'pointer-events': 'none'
    })

}

function update() {
  circle.attr('r', function(d) {return d.size})
    .attr('fill', function(d) {return d.fill || '#fff'})
    .attr('fill-opacity', function(d) {return d.type === 'api' ? .25 : 1})
    .attr('stroke', function(d) {return d.stroke || 'none'})
    .attr('cx', function(d) {return d.x})
    .attr('cy', function(d) {return d.y})

  gnodes
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
  
  gnodes.append('image')
    .attr("xlink:href",  function(d) { return d.img })
    .attr("x", function(d) { return d.type === 'api' ? 0 : -25 })
    .attr("y", function(d) { return d.type === 'api' ? -20 : -25 })
    .attr("height", function(d) { return d.type === 'api' ? 20 : 50 })
    .attr("width", function(d) { return d.type === 'api' ? 20 : 50 })

  text.attr('x', function(d) {return d.x})
    .attr('y', function(d) {return d.y + 10})
    .text(function(d) {return d.name})
  
  path.attr('stroke-width', function(d) {return d.size})
    .attr('stroke', function(d) {return d.stroke})
    .attr('fill', function(d) {return d.stroke})
    .attr('x1', function(d) {return d.source.x})
    .attr('y1', function(d) {return d.source.y})
    .attr('x2', function(d) {return d.target.x})
    .attr('y2', function(d) {return d.target.y})

  textAlongPath.attr('x', function(d) {return (d.source.x + d.target.x)/2 + 10})
    .attr('y', function(d) {return (d.source.y + d.target.y)/2 + 10})
    .text(function(d) {return d.score})

};

d3.json('./data/data.json', function(data) {

  // sum up all goals scored by team from week 1 to present
  var linkStrengths = [];
  var api = _.chain(data)
    .pluck('api')
    .map(function(api) {return _.pairs(api)})
    .flatten().compact()
    .reduce(function(memo, api) {
      linkStrengths.push(api[1]);
      if (!memo[api[0]]) {
        memo[api[0]] = 0;
      }
      memo[api[0]] += api[1]-1;
      return memo;
    }, {})
    .value();

  var colorScale = d3.scale.ordinal()
    .domain([0, 20])
    .range(d3.schemeRdYlBu[11].concat(d3.schemePiYG[11]))
    
  var sizeScale = d3.scale.linear()
    .domain([_.min(api), _.max(api)])
    .range([5, 30]);

  var strengthScale = d3.scale.linear()
    .domain([_.min(linkStrengths), _.max(linkStrengths)])
    .range([0, 1]);

  var radius = 250;

  var apiNodes = _.chain(api)
    .map(function(count, name) {
      api[name] = {
        name,
        size: sizeScale(count), // based on total goals scored from week 1 to present
        fill: 'none', // standardize empty circle for each team
        stroke: 'black',
        fixed: true,
        img: data.find(d=>d.userId == name) ? data.find(d=>d.userId == name).img : "",
        type: 'api'
      };
      return api[name];
    }).sortBy(function(node) {
      return -node.size;  
    }).map(function(node, i) {
      var radian = (2 * Math.PI) / _.size(api) * i - (Math.PI / 2); // set position of team nodes
      node.x = radius * Math.cos(radian) + (width / 2);
      node.y = radius * Math.sin(radian) + (height / 2);
      return node;
    }).value();


  var blockNodes = _.map(data, function(block) { // nodes connecting teams
    var node = {
      id: block.id,
      size: 30,
      stroke: "none",
      name: block.userId,
      img: block.img,
      type: 'connected_node'
    };
    _.each(block.api, function(count, apiName) {
      var idx = block.sortOrder.indexOf(apiName)
      links.push({
        score: (count-1).toString(),
        source: node,
        target: api[apiName],
        size: count,
        strength: strengthScale(count),
        stroke: colorScale(idx)
      });
    });

    return node;
  });
  
  nodes = _.union(apiNodes, blockNodes);
  //force.nodes(nodes).links(links)
    //.start();
  
  enter();

  console.log(nodes, links)

});
