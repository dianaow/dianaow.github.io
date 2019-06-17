var constellation = function () {

  ///////////////////////////////////////////////////////////////////////////
  //////////////////// Globals ///////////////////
  /////////////////////////////////////////////////////////////////////////// 
  var ctxLinks, ctxNodes
  var modal = d3.select(".content-constellation")
  var margin = {
    top: 500,
    right: 10,
    bottom: 10,
    left: 10
  };
  var totalWidth = 1250;
  var totalHeight = 1200;
  var width = totalWidth - margin.left - margin.right;
  var height = totalHeight - margin.top - margin.bottom;

  var linkedByIndex = {},
      linkedToID = {},
      nodeByID = {}

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Create scales ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  var colorScale = d3.scaleLinear()
    .domain([1, 8, 17])
    .range(['red', 'lightyellow', 'blue'])
    .interpolate(d3.interpolateHcl); 

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Set-up voronoi //////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  var voronoi = d3.voronoi()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; })
    .extent([[-margin.left - width/2, -margin.top], [width/2 + margin.right, height + margin.bottom]]);
    
  var diagram;

  ///////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Force simulation ///////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  var simulation = d3.forceSimulation()
      .force("link", d3.forceLink().distance(50).strength(0.5))
      .force("charge", d3.forceManyBody(-200))
      //.force('center', d3.forceCenter(width/2, height/2))
      .stop()

  ///////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// CORE  //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  return { 
    clear : function () {
      modal.selectAll("canvas").remove()
      modal.select("svg").remove()
    },
    run : function () {

      //////////////////// Set up and initiate containers ///////////////////////
      //Canvas
      var canvasLinks = modal.append("canvas").attr('class', 'canvas-links')
      ctxLinks = canvasLinks.node().getContext("2d")
      var sf = Math.min(2, getPixelRatio(ctxLinks)) //no more than 2
      if(screen.width < 500) sf = 1 //for small devices, 1 is enough

      canvasLinks
        .attr('width', sf * totalWidth)
        .attr('height', sf * totalHeight)
        .style('width', totalWidth + "px")
        .style('height', totalHeight + "px")

      ctxLinks.scale(sf,sf);
      ctxLinks.translate(margin.left + width/2, margin.top);

      var canvasNodes = modal.append("canvas").attr('class', 'canvas-nodes')
      canvasNodes
        .attr('width', sf * totalWidth)
        .attr('height', sf * totalHeight)
        .style('width', totalWidth + "px")
        .style('height', totalHeight + "px")

      ctxNodes = canvasNodes.node().getContext("2d")
      ctxNodes.scale(sf,sf);
      ctxNodes.translate(margin.left + width/2, margin.top);

      // Another canvas layer just to ovelay captions
      var canvasCaptions = modal.append("canvas").attr('class', 'canvas-captions')
      var ctxCaptions = canvasCaptions.node().getContext("2d")
      canvasCaptions
        .attr('width', sf * totalWidth)
        .attr('height', sf * totalHeight)
        .style('width', totalWidth + "px")
        .style('height', totalHeight + "px")

      ctxCaptions.scale(sf,sf);
      ctxCaptions.translate(margin.left + width/2, margin.top);

      //SVG container
      var svg = modal.append("svg")
        .attr("width", totalWidth)
        .attr("height", totalHeight)

      var g = svg
        .append("g")
        .attr("transform", "translate(" + (margin.left + width/2) + "," + (margin.top) + ")scale(1, 1)")
        .style("isolation", "isolate");
       
      var hoverRect = g.append("rect")
        .attr("class","hoverRect")
        .attr("x", -width/2 - margin.left)
        .attr("y", -margin.top)
        .attr("width", totalWidth)
        .attr("height", totalHeight)

      getData() // kick off data processing and then rendering
    }
  }

  ///////////////////////////////////////////////////////////////////////////
  //////////////////////////// Read in the data /////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  function getData() {

    d3.json("./data/groups2.json", function(error, json) {

      var links = json.links
      var nodes = json.nodes

      ///////////////////////////////////////////////////////////////////////////
      ////////////////////////////// Create links ///////////////////////////////
      ///////////////////////////////////////////////////////////////////////////
      links.forEach(function(d) {
      
        linkedByIndex[d.source + "," + d.target] = true;

        //Save all of the links to a specific node
        if(!linkedToID[d.source]) linkedToID[d.source] = [];
        if(!linkedToID[d.target]) linkedToID[d.target] = [];
        linkedToID[d.source].push(d.target); 
        linkedToID[d.target].push(d.source); 
        d.opacity = 0.3;
        d.sign = Math.random() > 0.5;
      });

      linkSave = links;

      ///////////////////////////////////////////////////////////////////////////
      ////////////////////////////// Create nodes ///////////////////////////////
      ///////////////////////////////////////////////////////////////////////////
      nodes.forEach(function(d,i) { 
        nodes[i].id = i
      })

      nodes.forEach(function(d) { 

        d.radius = 5;
        if (d.group == "Group") { d.radius = 10; }

        d.fill = colorScale(d.group)
        if (d.group == "Group") { d.fill = 'lightyellow'; }

        d.opacity = 1

        nodeByID[d.id] = d;
      });

      nodesSave = nodes;
      
      ///////////////////////////////////////////////////////////////////////////
      //////////////////////////// Run simulation ///////////////////////////////
      /////////////////////////////////////////////////////////////////////////// 
      
      //umm....there is a flying node that needs to be fixed.
      //var sourceids = links.map(d=>d.source)
      //var targetids = links.map(d=>d.target)
      //nodes = nodes.filter(function(d){ return sourceids.indexOf(d.id) > -1 || targetids.indexOf(d.id) > -1 })

      simulation.nodes(nodes).on("tick", function() {
        drawLinks(links);
        drawNodes(nodes);
      })
      simulation.force('link').links(links)
      simulation.alpha(1).restart();

      diagram = voronoi(nodes)

      ///////////////////////////////////////////////////////////////////////////
      /////////////////////// Capture mouse events //////////////////////////////
      ///////////////////////////////////////////////////////////////////////////
      var currentHover = null;

      //hoverRect.on("mousemove", function() {
        //d3.event.stopPropagation();

        //Find the nearest entity to the mouse, within a distance of X pixels - this is buggy. the correct entity is not being identified.
        //var m = d3.mouse(this);
        //var found = diagram.find(m[0], m[1], 10);
        //console.log(found)
        //if (found) { 
          //simulation.stop()
          //d3.event.preventDefault();
          //mouseOvered(found.data, nodes); 
        //} else { 
          //mouseOut() 
        //} 

        //currentHover = found;
      //})

      ///////////////////////////////////////////////////////////////////////////
      ///////////////// Run animation (Highlight + zoom out) ////////////////////
      ///////////////////////////////////////////////////////////////////////////
      execute(function() {
        simulation.stop()
        runAnimation()
      })

      function runAnimation() {
        var startPoint = diagram.find(-22, -14, 10) // this is not reliable as it relies on screen dimenensions
        //var startPoint = {id: 157}
        mouseOvered(startPoint.data, nodes);
      }

    })
  }

  ///////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Draw the nodes ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function drawNodes(nodes, opacity, fill) {
    ctxNodes.save()
    ctxNodes.clearRect(-margin.left - width/2, -margin.top, totalWidth, totalHeight);
    nodes.forEach(function(d) {
      ctxNodes.beginPath();
      ctxNodes.moveTo(d.x + d.radius, d.y);
      ctxNodes.arc(d.x, d.y, d.radius, 0, 2 * Math.PI);
      ctxNodes.globalAlpha = 0.3;
      ctxNodes.fillStyle = "#d4d4d4";
      ctxNodes.shadowBlur = d.group=='Group' ? 30 : 15;
      ctxNodes.shadowColor = "#d4d4d4";
      ctxNodes.fill();
      ctxNodes.closePath();
    });
    ctxNodes.shadowBlur = 0;
    ctxNodes.restore()
  }//function drawNodes

  ///////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Draw the links ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function drawLinks(links) {
    ctxLinks.save()
    ctxLinks.clearRect(-margin.left - width/2, -margin.top, totalWidth, totalHeight);
    links.forEach(function(d) {
      //Find a good radius
      d.r = Math.sqrt(sq(d.target.x - d.source.x) + sq(d.target.y - d.source.y)) * 2;
      //Find center of the arc function
      var centers = findCenters(d.r, d.source, d.target);
      d.center = d.sign ? centers.c2 : centers.c1;

      ctxLinks.strokeStyle = "#d4d4d4";
      ctxLinks.lineWidth = 1.5;
      ctxLinks.globalAlpha = 0.3;
      ctxLinks.beginPath();
      drawCircleArc(d.center, d.r, d.source, d.target, d.sign);
      ctxLinks.stroke();
    })//forEach
    ctxLinks.restore()
  }//function drawLinks

  //https://stackoverflow.com/questions/26030023/draw-arc-initial-point-radius-and-final-point-in-javascript-canvas
  //http://jsbin.com/jutidigepeta/3/edit?html,js,output
  function findCenters(r, p1, p2) {
    // pm is middle point of (p1, p2)
    var pm = { x : 0.5 * (p1.x + p2.x) , y: 0.5*(p1.y+p2.y) } ;
    // compute leading vector of the perpendicular to p1 p2 == C1C2 line
    var perpABdx= - ( p2.y - p1.y );
    var perpABdy = p2.x - p1.x;
    // normalize vector
    var norm = Math.sqrt(sq(perpABdx) + sq(perpABdy));
    perpABdx/=norm;
    perpABdy/=norm;
    // compute distance from pm to p1
    var dpmp1 = Math.sqrt(sq(pm.x-p1.x) + sq(pm.y-p1.y));
    // sin of the angle between { circle center,  middle , p1 } 
    var sin = dpmp1 / r ;
    // is such a circle possible ?
    if (sin<-1 || sin >1) return null; // no, return null
    // yes, compute the two centers
    var cos = Math.sqrt(1-sq(sin));   // build cos out of sin
    var d = r*cos;
    var res1 = { x : pm.x + perpABdx*d, y: pm.y + perpABdy*d };
    var res2 = { x : pm.x - perpABdx*d, y: pm.y - perpABdy*d };
    return { c1 : res1, c2 : res2} ;  
  }//function findCenters

  function drawCircleArc(c, r, p1, p2, side) {
    var ang1 = Math.atan2(p1.y-c.y, p1.x-c.x);
    var ang2 = Math.atan2(p2.y-c.y, p2.x-c.x);
    ctxLinks.arc(c.x, c.y, r, ang1, ang2, side);
  }//function drawCircleArc

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////// Mouse event globals /////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  //Variables needed to disrupt mouseover loop
  var repeatSearch;
  var connectionsLooper;
  var startSearch;
  var doMouseOut = true;
  var stopMouseout;
  var counter = 0;
  var mouseOverDone = false;
  var clickLocked = false;
  var pathLocked = false;

  ///////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Mouse events ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function mouseOvered(d, nodes) {

      // stopMouseout = true;
      repeatSearch = true;
      mouseOverDone = true;
      clearTimeout(startSearch);

      if(!clickLocked) {
        clearTimeout(connectionsLooper);
        startSearch = setTimeout(function() { 
          if(repeatSearch) initiateConnectionSearch(d, nodes); 
        }, 500);
      }//if

      //Stop propagation to the SVG
      //d3.event.stopPropagation();
  }//mouseOvered

  function initiateConnectionSearch(d, nodes) {

    var selectedNodes = {},
        selectedNodeIDs = [],
        oldLevelSelectedNodes;

    //After a each a mouse out may run again
    doMouseOut = true;

    selectedNodes[d.id] = 0;
    selectedNodeIDs = [d.id];
    oldLevelSelectedNodes = [d.id];
    counter = 0    

    findConnections(nodes, selectedNodes, selectedNodeIDs, oldLevelSelectedNodes, counter);

  }//initiateConnectionSearch

  //Loop once through all newly found relatives to find relatives one step further
  function findConnections(nodes, selectedNodes, selectedNodeIDs, oldLevelSelectedNodes, counter) {

    if(counter === 0) {
     hideAllNodes(); 
   }

    showNodes(selectedNodeIDs[0], oldLevelSelectedNodes, selectedNodeIDs, selectedNodes);
    
    if( repeatSearch && counter < 12 ) {
      var levelSelectedNodes = [];
      for(var k = 0; k < oldLevelSelectedNodes.length; k++) {
        //Request all the linked nodes
        var connectedNodes = linkedToID[oldLevelSelectedNodes[k]];
        console.log(connectedNodes)
        //Take out all nodes already in the data
        connectedNodes = connectedNodes.filter(function(n) {
          return selectedNodeIDs.indexOf(n) === -1
        });
        //Place the left nodes in the data
        for(var l = 0; l < connectedNodes.length; l++) {
          var id = connectedNodes[l];
          selectedNodes[id] = counter+1;
          selectedNodeIDs.push(id);
          levelSelectedNodes.push(id);
        }//for l
      }//for k

      //Small timeout to leave room for a mouseout to run
      counter += 1;

      oldLevelSelectedNodes = uniq(levelSelectedNodes);
      connectionsLooper = setTimeout(function() { findConnections(nodes, selectedNodes, selectedNodeIDs, oldLevelSelectedNodes, counter); }, 100);
    } 

  }//findConnections

  function hideAllNodes() {
      clearCanvas();

      //Draw the lines
      linkSave.forEach(function(d) {
        ctxLinks.globalAlpha = 0.01;
        ctxLinks.lineWidth = 1;
        ctxLinks.beginPath();
        drawCircleArc(d.center, d.r, d.source, d.target, d.sign);
        ctxLinks.fill();
        ctxLinks.closePath();
      })//forEach

      //Draw the nodes
      nodesSave.forEach(function(d) {
        ctxNodes.globalAlpha = 0.01;
        ctxNodes.fillStyle = "#d4d4d4";
        ctxNodes.shadowBlur = d.group=='Group' ? 30 : 15;
        ctxNodes.shadowColor = "#d4d4d4";
        ctxNodes.beginPath();
        ctxNodes.moveTo(d.x + d.radius, d.y);
        ctxNodes.arc(d.x, d.y, d.radius, 0, 2 * Math.PI);
        ctxNodes.fill();
        ctxNodes.closePath();
      });

  }//hideAllNodes


  //Highlight the found relatives
  function showNodes(id, nodeIDs, allNodeIDs, selectedNodes) {

    ctxLinks.save()
    //Draw the more visible lines
    linkSave
      .filter(function(d) { return allNodeIDs.indexOf(d.source.id) > -1 || allNodeIDs.indexOf(d.target.id) > -1; })
      .forEach(function(d) {
        //console.log(d)
        d.hoverMin = 1000;
        var closeSource = selectedNodes[d.source.id],
            closeTarget = selectedNodes[d.target.id];
        if (typeof closeSource !== "undefined" && typeof closeTarget !== "undefined") { d.hoverMin = Math.min(closeSource, closeTarget); }
        ctxLinks.strokeStyle = "#d4d4d4";
        ctxLinks.lineWidth = 2.5; 
        ctxLinks.globalAlpha = 0.3;
        ctxLinks.beginPath();
        drawCircleArc(d.center, d.r, d.source, d.target, d.sign);
        ctxLinks.stroke();
        ctxLinks.closePath();
      })//forEach
    ctxLinks.restore()

    ctxNodes.save()
    //Draw the more visible nodes
    nodesSave
      .filter(function(d) { return nodeIDs.indexOf(d.id) > -1; })
      .forEach(function(d) {
        //console.log(d)
        d.closeNode = selectedNodes[d.id];

        ctxNodes.globalAlpha = 1;
        ctxNodes.fillStyle = d.group=='Group' ? 'lightyellow' : colorScale(d.group);
        ctxNodes.shadowBlur = d.group=='Group' ? 30 : 15;
        ctxNodes.shadowColor = d.group=='Group' ? 'lightyellow' : colorScale(d.group);

        ctxNodes.beginPath();
        ctxNodes.moveTo(d.x + d.radius, d.y);
        ctxNodes.arc(d.x, d.y, d.radius, 0, 2 * Math.PI);
        ctxNodes.fill();
        ctxNodes.closePath();
      });
    ctxNodes.shadowBlur = 0;
    ctxNodes.restore()

  }//showNodes

  //Go back to the normal state
  function mouseOut() {

    //Don't do a mouse out during the search of neighbors
    //if(stopMouseout) return;
    //Don't do a mouseout when a node was clicked
    if(clickLocked) return;

    //Disrupt the mouseover event so no flashing happens
    repeatSearch = false;
    clearTimeout(connectionsLooper);
    clearTimeout(startSearch);

    //Only run the mouse out the first time you really leave a node that you spend a 
    //significant amount of time hovering over
    if(!doMouseOut) return;

    //Redraw the visual
    clearCanvas();
    ctxLinks.strokeStyle = "#d4d4d4";
    ctxLinks.lineWidth = 1.5;
    drawLinks(linkSave);
    drawNodes(nodesSave);

    doMouseOut = false;

  }//mouseOut

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Helper functions ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  function execute(callback) {
    setTimeout(function() {
      callback();
    }, 6000);
  }

  function sq(x) { return x*x ; }

  //Check if node a and b are connected
  function isConnected(a, b) {
      return linkedByIndex[a + "," + b] || linkedByIndex[b + "," + a]; //|| a.index == b.index;
  }

  function easeOut( iteration, power ) {
    var p = power || 3;
    //returned: 0 - 1
    return 1 - Math.pow(1 - iteration, p);
  }//easeOut

  function uniq(a) {
      return a.sort().filter(function(item, pos, ary) {
          return !pos || item != ary[pos - 1];
      })
  }//uniq

  //Find the device pixel ratio
  function getPixelRatio(ctx) {
      //From https://www.html5rocks.com/en/tutorials/canvas/hidpi/
      let devicePixelRatio = window.devicePixelRatio || 1
      let backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
          ctx.mozBackingStorePixelRatio ||
          ctx.msBackingStorePixelRatio ||
          ctx.oBackingStorePixelRatio ||
          ctx.backingStorePixelRatio || 1
      let ratio = devicePixelRatio / backingStoreRatio
      return ratio
  }//function getPixelRatio

  function clearCanvas() {
    //Clear the canvas
    ctxLinks.clearRect(-margin.left - width/2, -margin.top, totalWidth, totalHeight);
    ctxNodes.clearRect(-margin.left - width/2, -margin.top, totalWidth, totalHeight);
  }//function clearCanvas

}()