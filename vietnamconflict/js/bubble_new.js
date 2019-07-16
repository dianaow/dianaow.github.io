var bubble = function () {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 
  var svg
  var modal = d3.select("#general")

  var margin = {top: 0, right: 0, bottom: 0, left: 0},
      width = window.innerWidth <= 1440 ? 720 : 820 - margin.left - margin.right,
      height = window.innerWidth <= 1440 ? 720 : 820 - margin.top - margin.bottom;

  //////////////////// Set up and initiate containers ///////////////////////
  svg = modal.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  //SVG filter for the gooey effect
  //Code taken from http://tympanus.net/codrops/2015/03/10/creative-gooey-effects/
  var defs = svg.append("defs");
  var filter = defs.append("filter").attr("id","gooeyCodeFilter");
  filter.append("feGaussianBlur")
    .attr("in","SourceGraphic")
    .attr("stdDeviation","10")
    //to fix safari: http://stackoverflow.com/questions/24295043/svg-gaussian-blur-in-safari-unexpectedly-lightens-image
    .attr("color-interpolation-filters","sRGB") 
    .attr("result","blur");
  filter.append("feColorMatrix")
    .attr("class", "blurValues")
    .attr("in","blur")
    .attr("mode","matrix")
    .attr("values","1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -5")
    .attr("result","gooey");
  filter.append("feBlend")
    .attr("in","SourceGraphic")
    .attr("in2","gooey")
    .attr("operator","atop");

  ///////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Initialize ////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  return { 
    run : function () {

      cluster()
      icon()

      var ele = document.getElementById('vis-container');
      d3.select('.click-btn').on('click', function() {
        ele.scrollIntoView({behavior: 'smooth'})
      }) 
    }
  }

  function cluster() {

    var data = [
     {branch: 'AIR FORCE', count: 2586},
     {branch: 'ARMY', count: 38224},
     {branch: 'MARINE CORPS', count: 14844}, 
     {branch: 'NAVY', count: 2559}
    ]

    //Calculate the centers for each branch based on d3's pack layout
    var pack = d3.pack()
      .size([width, height])
      .padding(100);

    var nest = d3.nest()
    var root = d3.hierarchy({data:nest.entries(data)},function(d){return d.data;}).sum(function(d) {return d.count; })
    var nodes = pack(root)

    //Draw the pack layout
    var wrapper = svg.selectAll('.branch').data(nodes.children)
      .enter().append('g')
      .attr('class', 'branch')
      .attr('id', function (d) { return 'branch-' + d.data.branch })
      .style("filter", "url(#gooeyCodeFilter)")

    // Append branch circles
    wrapper.append("circle")
        .attr('class', function (d) { return d.data.branch })
        .attr('cx', function (d) { return d.x; })
        .attr('cy', function (d) { return d.y; })
        .attr('r', function (d) { return d.r; })
        .attr('fill', '#db2828')

    //Append branch labels
    wrapper.append("text")
        .attr("class", "branchLabel")
        .attr("transform", function (d) { return "translate(" + (d.x-d.r/2-10) + ", " + (d.y) + ")"; })
        .attr('font-weight', 'bold')
        .attr('font-size', window.innerWidth <= 1440 ? '0.8em' : '1em')
        .attr('fill', 'white')
        .text(function (d) { return d.data.branch })

    //Append death count labels
    wrapper.append("text")
        .attr("class", "countLabel")
        .attr("transform", function (d) { return "translate(" + (d.x-d.r/2-10) + ", " + (d.y+20) + ")"; })
        .attr('font-size', window.innerWidth <= 1440 ? '0.8em' : '1em')
        .attr('fill', 'white')
        .text(function (d) { return Math.round(d.data.count) + ' deaths' });

  } 

  function icon() {

    var dot = d3.select('#branch-ARMY').append('g')
      .attr('class', 'click-btn')
      .attr('transform', function (d) { return "translate(" + d.x + ", " + d.y + ")"; })

    dot.append('circle')
      .attr('r', 40)
      .attr('fill', '#db2828')
      .transition().ease(d3.easeQuadOut).duration(3000)
      .attr('cy', function (d) { return d.r*1.5 })     

    dot.append('text')
      .attr('fill', 'white')
      .attr('opacity', 0)
      .attr('font-weight', 'bold')
      .attr('font-size', '1.2em')
      .transition().ease(d3.easeQuadOut).duration(3000)
      .attr('x', function (d) { return -25 })
      .attr('y', function (d) { return d.r*1.5+5 }) 
      .text('CLICK')
      .on("end", function(){
        dot.select('text').attr('opacity', 1)
      });
 
 }

}()