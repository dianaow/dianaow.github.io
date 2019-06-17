var moving_bubbles = function () {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 

  const FOCI_LENGTH = 10;
  const FOCI_STROKE_WIDTH = 2;
  const HEIGHT = screen.width < 420 ? screen.width*0.90 : screen.width*0.50;
  const INTERVAL_DURATION = 5000;
  const MARGIN = 20;
  const MUTATE_PROBABILITY = 0.02;
  const CIRCLE_RADIUS = screen.width < 420 ? 2 : 3.5;
  const WIDTH = screen.width < 420 ? screen.width*0.90 : screen.width*0.50;

  var res = []
  var centroids, progress, circles, timer
  let center = [WIDTH / 2, HEIGHT / 2];
  let centerRadius = Math.min(WIDTH / 2, HEIGHT / 2) * 0.68;
  let foci = null;
  let fociCount = null;
  let nodeCount = null;
  let nodes = null;
  let svg = null;
  var t = 0
  var NUM_FLICKS = 30
  var chargeStrength = screen.width < 420 ? -2 : -5
  var fociStrength = 0.2
  var simulation = d3.forceSimulation()
  var modal = d3.select(".content-forces")
  var modalDiv = modal.append('div')
    .attr('id', "div-content2-1")
    .attr('width', WIDTH)
    .attr('height', HEIGHT)
    .attr('transform', 'translate(' + MARGIN + ',' + screen.height + ')')
    .attr('float', 'left')


  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Create scales ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  var money_laundering = ['#F48FB1', '#F06292', '#EC407A', '#E91E63', '#D81B60', '#C2185B', 'red']
  var tax_customs_violation = ["#D4E157", "#CDDC39", "#C0CA33", "#AFB42B", "#9E9D24", "#827717", 'red']
  var cybercrime = ['#c7e9c0','#a1d99b','#74c476','#41ab5d','#238b45','#005a32', 'red']
  var organized_crime = ['#c6dbef','#9ecae1','#6baed6','#4292c6','#2171b5','#084594', 'red']
  var terrorism = ['#d9d9d9','#bdbdbd','#969696','#737373','#525252','#252525', 'red']
  var sanctions = ['#dadaeb','#bcbddc','#9e9ac8','#807dba','#6a51a3','#4a1486', 'red']
  var trafficking = ['#fdd0a2','#fdae6b','#fd8d3c','#f16913','#d94801','#8c2d04', 'red']

  var colors = [{key:'Money Laundering', colors: money_laundering},
  {key:'Tax & Customs Violation', colors: tax_customs_violation},
  {key:'Cybercrime', colors: cybercrime},
  {key:'Organised Crime', colors: organized_crime},
  {key:'Terrorism', colors: terrorism}, 
  {key:'Sanctions', colors: sanctions},
  {key:'Trafficking in Stolen Goods', colors: trafficking}]

  var focisCrime = ['Money Laundering', 'Tax & Customs Violation', 'Cybercrime', 'Organised Crime', 'Terrorism', 'Sanctions', 'Trafficking in Stolen Goods']
  var focisScore = ['0.2-0.39', '0.4-0.59', '0.6-0.69', '0.7-0.79', '0.8-0.99', '0.9-0.99', '1' ]
  var colorScale = d3.scaleOrdinal()
    .domain(focisScore)

  var focis = [{key:'crime', categories: focisCrime}, {key:'score', categories: focisScore}]

  var crimeFoci = onFociCountChange(focisCrime) // create a foci for each crime category
  var scoreFoci = onFociCountChange(focisScore) // create a foci for each score category

  var crimeFoci_new = []
  Object.keys(crimeFoci).map(function(key, index) {
     crimeFoci_new.push({
      x: crimeFoci[index].x,
      y: crimeFoci[index].y,
      key: crimeFoci[index].key,
      color: crimeFoci[index].color
    })     
  })

  var yScale = d3.scaleBand()
    .domain(focisCrime)
    .range([HEIGHT+120, 40])

  /////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// INITIALIZE ///////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  return { 
    clear : function () {
      modalDiv.select("svg").remove()
    },
    run : function () {

      svg = modalDiv.append("svg")
          .attr("width", WIDTH + 2 * MARGIN)
          .attr("height", HEIGHT + 2 * MARGIN)
          .append("g")
          .attr("class", "margin")
          .attr("transform", `translate(${MARGIN}, ${MARGIN})`);

      if(screen.width > 420){
        svg.append('rect')
          .attr("width", WIDTH)
          .attr("height", HEIGHT)  
          .attr('fill', 'none')
          .style('stroke-width', '2px')
          .style('rx', '6px') 
          .style('stroke', 'black')
      }

      gCircle = svg.append('g').attr('class', 'circles')

      d3.range(1,400).map((d,i) => {
        res.push({
          id: i,
          crime0: crimeFoci[getRandomArbitrary(0,6)].key,
          binned0 : scoreFoci[getRandomArbitrary(0,6)].key,
          crime1: crimeFoci[getRandomArbitrary(0,6)].key,
          binned1 : scoreFoci[getRandomArbitrary(0,6)].key,
          crime2: crimeFoci[getRandomArbitrary(0,6)].key,
          binned2 : scoreFoci[getRandomArbitrary(0,6)].key
        })
      })

      init()
    }
  }

  function init() {

    var res_nested_crime = d3.nest()
      .key(d=>d.crime0)
      .entries(res)

    nodes = []
    res_nested_crime.map(d=> {
      var n = createNodes(focis, d.key, d.values)
      nodes.push(n)
    })
    nodes = [].concat.apply([], nodes)
    
    //nodes = createNewNodes(focis, nodes) // create a new set of nodes to 'fly in'

    nodes.forEach((d,i)=>{
      d.class = d.binned0 == '1' ? "new" : undefined
    })

    simulate(nodes, crimeFoci, true, 'groupCrime') // kick off simulation

    d3.select('.changeFocitoCrime').on("click", function () { 
      simulate_group(nodes, foci, true)
      init()
    });
    d3.select('.run_add').on("click", function () { simulate(nodes, scoreFoci, false, 'pull') });
    d3.select('.run_move').on("click", function () { changeNodeFoci(nodes, crimeFoci, false) });
    d3.select('.run_align').on("click", function () { simulate(nodes, crimeFoci, false, 'align') });
    d3.select('.run_change_foci').on("click", function () { simulate_group(nodes, crimeFoci, false) });
    d3.select('.changeFocitoIndustry').on("click", function () { changeFocitoIndustry(nodes, scoreFoci, false) });

  }

  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// Simulate nodes //////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  function simulate(nodes, foci, bg, type) {

    if(type=='groupCrime'){

      nodes.forEach(d=>{
        d.x1 = d.class=='new' ? foci[d.focus].x : d.x
        d.y1 = d.class=='new' ? foci[d.focus].y : d.y
        d.opacity = d.class=='new' ? 1 : 0
      })

    } else if (type=='pull'){
      fociStrength = 0.1
      nodes.forEach(d=>{
        d.fx = null
        d.fy = null
        d.x1 = foci[d.focus].x
        d.y1 = foci[d.focus].y
        d.opacity = 1
      })

    } else if (type=='groupIndustry'){

      nodes.forEach(d=>{
        d.fx = null
        d.fy = null
        d.x1 = foci[d.focus].x
        d.y1 = foci[d.focus].y
      })

    } else if (type=='pool'){

      nodes.forEach(d=>{
        d.fx = null
        d.fy = null
        d.x1 = WIDTH/2
        d.y1 = HEIGHT/2
      })

    }

    if(bg==true){
      startSimulationBackground() 
    } else if(bg==false){
      if(type=='groupCrime'){
        updateCircles(nodes, 'groupCrime') // render nodes
      }
      startSimulation()
    }

  }

  /////////////// Group nodes according to subgraphs (with simulation) ///////////////
  function simulate_group(nodes, foci, terminator) {

    setTimeout(function() { changeNodeGroup(NUM_FLICKS, foci, terminator) }, 1000)

    // show progress bar to indicate time to end of animation
    var segmentWidth = WIDTH-40
    progress = svg.append('rect')
      .attr('class', 'progress-bar')
      .attr('rx', 10)
      .attr('ry', 10)
      .attr('fill', 'lightgray')
      .attr('height', 5)
      .attr('width', 0)
      .attr('x', 20)
      .attr('y', 10)

    function moveProgressBar(t, NUM_FLICKS){
      progress.transition()
        .duration(800)
        .attr('fill', 'black')
        .attr('width', function(){
          return t/NUM_FLICKS * segmentWidth;
        });
    }    

    function changeNodeGroup(NUM_FLICKS, foci, terminator) {
      console.log(terminator)
      var animation_interval = d3.interval(function(){

        t += 1  // update time

        if (t > NUM_FLICKS) { animation_interval.stop(); simulation.stop(); return true } // stop simulation after 10 timesteps
        if (terminator==true) { 
          animation_interval.stop(); 
          simulation.stop(); 
          svg.select('.progress-bar').remove()
          return true 
        }

        assignOtherSubgraph(t)
        moveProgressBar(t, NUM_FLICKS)

      }, 800, d3.now() - 800)

      function assignOtherSubgraph(t) {

        var newFoci = getRandomArbitrary(1, 7) 
        var newI = getRandomArbitrary(0, 400) 
        nodes[newI].x = foci[newFoci].x
        nodes[newI].y = foci[newFoci].y
        simulation.nodes(nodes)
        simulation.velocityDecay(0.4).alpha(0.5).restart()

      }

    }

  }

  //////////////////// Reinitialize simulation (show tick movement) ////////////////////
  function startSimulation() {

    var buffer = screen.width < 420 ? 0.5 : 2.5
    simulation.nodes(nodes)
      .force("charge", d3.forceManyBody().strength(chargeStrength).distanceMin(CIRCLE_RADIUS))
      .force("collide", d3.forceCollide(CIRCLE_RADIUS + buffer))
      .force("position-x", d3.forceX(d=>d.x1).strength(fociStrength))
      .force('position-y', d3.forceY(d=>d.y1).strength(fociStrength))
      .on("tick", onSimulationTick)

    simulation.velocityDecay(0.3).alpha(0.5).restart()

  }

  function onSimulationTick() {
    svg.selectAll("circle")
        .attr('opacity', d => d.opacity)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
  }

  //////////////////// Reinitialize simulation (in the background) ////////////////////
  function startSimulationBackground() {

    simulation.nodes(nodes)
      .force("charge", d3.forceManyBody().strength(chargeStrength).distanceMin(CIRCLE_RADIUS))
      .force("collide", d3.forceCollide(CIRCLE_RADIUS + 2.5))
      .force("position-x", d3.forceX(d=>d.x1).strength(fociStrength))
      .force('position-y', d3.forceY(d=>d.y1).strength(fociStrength))
      .stop()

    simulation.velocityDecay(0.3).alpha(0.5).restart()
    for (var i = 0; i < 150; ++i) simulation.tick() 

    updateCircles(nodes, 'groupCrime') // render nodes

  }

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////// Create foci points and nodes ////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  ////////////////////// Assign focus point of each category //////////////////
  function onFociCountChange(focis) {
      fociCount = focis.length
      foci = {};
      for (let i = 0; i < fociCount; i++) {
          let focus = createFocus(i, focis[i], fociCount);
          foci[i] = focus;
      }
      return foci
  }

  /////////////////////// Calculate focus point of each category ///////////////
  function createFocus(index, key, fociCount) {
      let angle = 2 * Math.PI / fociCount * index;
      return {
          key: key,
          index: index,
          angle: angle,
          color: colors.find(c=>c.key == key) ? colors.find(c=>c.key == key).colors[5] : null,
          //color: d3.interpolateRainbow(index / fociCount),
          x: center[0] + centerRadius * Math.cos(angle),
          y: center[1] + centerRadius * Math.sin(angle)
      };
  }

  ////////////////////////////////// Create nodes //////////////////////////////
  function createNodes(focis, key, data) {

    var crime = focis.find(d=>d.key == 'crime').categories
    var score = focis.find(d=>d.key == 'score').categories
    var n = []

    colorScale.range(colors.find(c=>c.key == key).colors)

    data.map((d,i)=> {
      n.push({
        index: i, // unique index for each node
        id: d.id, // unique ID for each entity 
        country: d.country,
        subgraph: d.subgraph,
        crime0: d.crime0,
        binned0: d.binned0,
        focus: crime.indexOf(d.crime0), //based on first crime category
        focus1: crime.indexOf(d.crime1), //based on second crime category
        focus2: crime.indexOf(d.crime2), //based on third crime category
        focus_score: score.indexOf(d.binned0), // based on association score category
        r: CIRCLE_RADIUS,
        color: colorScale(d.binned0),
        strokeFill: colorScale(d.binned0),
        //x: crimeFoci_new.find(f=>f.key == d.crime0).x,
        //y: crimeFoci_new.find(f=>f.key == d.crime0).y,
        x: randBetween(0, WIDTH),
        y: randBetween(0, HEIGHT),   
        same_subgraph: d.same_subgraph
      })
    })
    return n
  }

  function createNewNodes(focis, nodes) {

    var subgraphs = nodes.map(d=>d.subgraph).filter(onlyUnique)
    var crime = focis.find(d=>d.key == 'crime').categories
    var score = focis.find(d=>d.key == 'score').categories

    var beyondWidth = [screen.width+150+Math.random(), -150+Math.random()]
    var beyondHeight = [screen.height+150+Math.random(), -150+Math.random()]
    var newNodes = []

    d3.range(0, 100).map(d=> {
      var binned0 = focisScore[getRandomArbitrary(0,score.length-1)] // randomly assigned a crime category
      var crime0 = focisCrime[getRandomArbitrary(0,crime.length-1)] // randomly assigned an association score
      colorScale.range(colors.find(c=>c.key == crime0).colors)
      newNodes.push({
        crime0: crime0,
        binned0: binned0,
        subgraph: subgraphs[getRandomArbitrary(0,subgraphs.length-1)],
        focus: crime.indexOf(crime0),
        focus_score: score.indexOf(binned0),
        r: CIRCLE_RADIUS,
        color: colorScale(binned0),
        strokeFill: 'black',
        x: beyondWidth[getRandomArbitrary(0,1)],
        y: beyondHeight[getRandomArbitrary(0,1)],
        class: 'new',
      })
    })

    nodes.push(newNodes)
    nodes = [].concat.apply([], nodes)
    nodes.forEach((d,i)=>{
      d.index = i
    })

    return nodes
  }

  ///////////////////////// Update focus point of some nodes //////////////////////
  function changeNodeFoci(nodes, focis, bg) {

    nodes.map((d,i) => {
      if (d.focus1) {
        let point = d;
        let newFocus = d.focus1; // change focus point 
        point.focus = newFocus;
      }
    })
    simulate(nodes, focis, bg, 'pull')

  }

  /////////////////////// Update foci based on industry categories //////////////////
  function changeFocitoIndustry(nodes, focis, bg) {

    nodes.map((d,i) => {
      if (d.focus_score!=-1) {
        let point = d;
        let newFocus = d.focus_score; // change focus point 
        point.focus = newFocus;
      } 
    })
    //updateLabels(scoreFoci, 'groupIndustry')
    simulate(nodes, focis, bg, 'groupIndustry')

  }

  /////////////////////// Update foci based on score categories //////////////////
  function changeFocitoScore(data) {

    svg1.selectAll('text').remove()
    svg1.selectAll('circle').remove()
    svg.selectAll('text').remove()
    var pointsBar = createDots(data, 'bar')
    var pointsBar1 = createDots(data, 'tiledbar')

    updateCircles(pointsBar, 'groupScore')
    setTimeout(function(){
      updateCircles(pointsBar1, 'groupScore')
    }, 3000)
    var ASFocis = []
    focisScore.map((d,i)=>{
      ASFocis.push({
        key : d,
        x : ((i*150)+100),
        y : HEIGHT-100
      })
    })
    updateLabels(ASFocis, 'groupScore')

  }

  ///////////////////////////////////////////////////////////////////////////////////
  //////////////////////// Update node, labels, misc positions //////////////////////
  ///////////////////////////////////////////////////////////////////////////////////
  function updateCircles(data, type) {

      circles = gCircle.selectAll("circle").data(data, d=>d.index);

      circles.exit().remove()

      var entered_circles = circles
          .enter()
          .append("circle")
          .classed("node", true)
          .classed("enter", true)
          .attr("id", d => d.index)
          .attr("r", d => d.r)
          .attr("fill", d => d.color)
          .attr('stroke', d => d.strokeFill)
          .attr('stroke-width', '1px')
          .attr("cx", d => d.x)
          .attr("cy", d => d.y)
          .attr("opacity", d => d.opacity)
          
      circles = circles.merge(entered_circles)

      var t = d3.transition()
        .duration(2000)
        .ease(d3.easeQuadOut)

    if(type=='groupCrime'){

      circles
        .classed("enter", false)
        .classed("update", true)
        .transition().duration(500) // comment this line if you want to let simulation transition the nodes
        .attr("fill", d => d.color)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)  
        .attr("opacity", d => d.opacity)

    } else if(type=='groupScore'){

      simulation.stop()

      circles
        .classed("enter", false)
        .classed("update", true)

      circles.transition(t)
        .attr("fill", d => d.color)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)  

    }

  }

  function randBetween(min, max) {
      return min + (max - min) * Math.random();
  }

  function getRandomArbitrary(min, max) {
    return Math.round(Math.random() * (max - min) + min)
  }

}()