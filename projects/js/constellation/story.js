///////////////////////////////////////////////////////////////////////////
///////////////// Selective nodes and links highlight /////////////////////
///////////////////////////////////////////////////////////////////////////
function hop1() {

  var nodesToHighlight = [153, 280, 284]
  var labels = ['Shareholder X', "Company A", "Company B"]
  nodesSave
    .filter(function(d) { return nodesToHighlight.indexOf(d.id) > -1; })
    .forEach(function(d,i) {
      ctxNodes.globalAlpha = 0.5;
      ctxNodes.fillStyle = "navy";
      ctxNodes.fillRect(d.x+16, d.y-15, 120, 30);

      ctxNodes.globalAlpha = 1;
      ctxNodes.font = "20px Helvetica";
      ctxNodes.fillStyle =  'white'
      ctxNodes.fillText(labels[i], d.x+16, d.y+10);

      ctxNodes.shadowBlur = 0
      ctxNodes.shadowColor = 'white'
      ctxNodes.beginPath();
      ctxNodes.moveTo(d.x + d.radius, d.y);
      ctxNodes.arc(d.x, d.y, d.radius, 0, 2 * Math.PI);
      ctxNodes.fill();
      ctxNodes.closePath();
    });

}

function hop2() {

  var nodesToHighlight = [150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 170, 179, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206]
  var labels = ["Person A", "Person B", "Person C"]
  nodesSave
    .filter(function(d) { return nodesToHighlight.indexOf(d.id) > -1; })
    .forEach(function(d,i) {
      if(labels[i]) { 
        ctxNodes.globalAlpha = 0.5;
        ctxNodes.fillStyle = "navy";
        ctxNodes.fillRect(d.x+8, d.y-14, 60, 20);

        ctxNodes.globalAlpha = 1;
        ctxNodes.font = "14px Helvetica";
        ctxNodes.fillStyle = "white";
        ctxNodes.fillText(labels[i] ? labels[i] : "", d.x+10, d.y);
      }
      
      ctxNodes.shadowBlur = 0
      ctxNodes.shadowColor = 'white'
      ctxNodes.beginPath();
      ctxNodes.moveTo(d.x + d.radius, d.y);
      ctxNodes.arc(d.x, d.y, d.radius, 0, 2 * Math.PI);
      ctxNodes.fill();
      ctxNodes.closePath();
    });

  var mainNode = [280, 284]
  linkSave
    .filter(function(d) { return mainNode.indexOf(d.source.id) > -1 || mainNode.indexOf(d.target.id) > -1; })
    .forEach(function(d) {
      //ctxLinks.globalAlpha = 0.2;
      //ctxLinks.fillStyle = "darkred";
      //ctxLinks.fillRect(d.source.x + (d.target.x - d.source.x)/2 + 10, d.source.y + (d.target.y - d.source.y)/2, 100, 20);

      //ctxLinks.font = "16px Helvetica";
      //ctxLinks.fillStyle = "lightyellow";
      //ctxLinks.fillText("", d.source.x + (d.target.x - d.source.x)/2 + 10, d.source.y + (d.target.y - d.source.y)/2);

      ctxLinks.strokeStyle = "white";
      ctxLinks.lineWidth = 3; 
      ctxLinks.globalAlpha = 0.8;
      ctxLinks.beginPath();
      drawCircleArc(d.center, d.r, d.source, d.target, d.sign);
      ctxLinks.stroke();
      ctxLinks.closePath();
    })

}

function hop3() {

  var nodesToHighlight = [15, 30, 45, 60, 75, 125]

  nodesSave
    .filter(function(d) { return nodesToHighlight.indexOf(d.id) > -1; })
    .forEach(function(d,i) {
      ctxNodes.shadowBlur = 0
      ctxNodes.shadowColor = 'white'
      ctxNodes.beginPath();
      ctxNodes.moveTo(d.x + d.radius*1.4, d.y);
      ctxNodes.arc(d.x, d.y, d.radius*1.4, 0, 2 * Math.PI);
      ctxNodes.fill();
      ctxNodes.closePath();
    });
}

function hop4() {

  var nodesToHighlight = [153, 280, 284]
  var colors = ["red", "#d9d9d9", "#969696"]
  var threeNodes = nodesSave.filter(function(d) { return nodesToHighlight.indexOf(d.id) > -1; })
  threeNodes.forEach((d,i)=>{
    d.color = colors[i]
  })

  gCircle = g.selectAll('.infected').data(threeNodes)

  gCircle
    .enter().append('circle')
      .attr('class', "infected")
      .attr("fill", "white") 
      .attr("cx", d=> d.x+d.radius/4-2)
      .attr("cy", d=> d.y+d.radius/4-2)
      .attr('r', d=>d.radius)
      .merge(gCircle)
      .transition().ease(d3.easeCubicOut).duration(1000)
      .attr("cx", d=> d.x+d.radius/4-2)
      .attr("cy", d=> d.y+d.radius/4-2)
      .attr('r', d=>d.radius*1.4)
      .attr("fill", d=> d.color) 
      .attr("fill-opacity", 1)
      .attr('stroke', "black")
      .attr('stroke-width', "3px")

  // highlight the links
  var mainNode = [153]
  linkSave
    .filter(function(d) { return mainNode.indexOf(d.source.id) > -1 || mainNode.indexOf(d.target.id) > -1; })
    .forEach(function(d) {
      //ctxLinks.globalAlpha = 1;
      //ctxLinks.font = "16px Helvetica";
      //ctxLinks.fillStyle = "white";
      //ctxLinks.fillText("Affliated", d.source.x + (d.target.x - d.source.x)/2 + 14, d.source.y + (d.target.y - d.source.y)/2+8);

      ctxLinks.strokeStyle = "white";
      ctxLinks.lineWidth = 3; 
      ctxLinks.beginPath();
      drawCircleArc(d.center, d.r, d.source, d.target, d.sign);
      ctxLinks.stroke();
      ctxLinks.closePath();
    })

  // Title
  ctxCaptions.globalAlpha = 1;
  ctxCaptions.font = "22px Helvetica";
  ctxCaptions.fillStyle = "lightyellow";
  ctxCaptions.fillText("With knowledge graphs, we identify risk levels of entities", -margin.left - width/2 + 100, -margin.top + 300);

}

function hop5() {

  var nodesToHighlight = [153, 280, 284]
  var labels = ['Shareholder X', "Company A", "Company B"]
  var colors = ["red", "#d9d9d9", "#969696"]

  var zoom = d3.zoom()
      .on("zoom", zoomed);

  d3.selectAll('.infected')
    //.transition().ease(d3.easeLinear).duration(500)
    .style('opacity', 0)

  d3.select(".canvas-nodes").transition()
    .duration(1000)
    .call(zoom.transform, transform)
    .call(transition);

  function zoomed() { 
    ctxNodes.save();
    ctxNodes.clearRect(-margin.left - width/2, -margin.top, totalWidth, totalHeight);
    ctxNodes.translate(d3.event.transform.x, d3.event.transform.y);
    ctxNodes.scale(d3.event.transform.k, d3.event.transform.k);
    nodesSave
      .filter(function(d) { return nodesToHighlight.indexOf(d.id) > -1; })
      .forEach(function(d,i) {
        ctxNodes.shadowBlur = 0
        ctxNodes.shadowColor = colors[i]
        ctxNodes.beginPath();
        ctxNodes.moveTo(d.x + d.radius*1.4, d.y);
        ctxNodes.arc(d.x, d.y, d.radius*1.4, 0, 2 * Math.PI);
        ctxNodes.fill();
        ctxNodes.closePath();
      });
    ctxNodes.restore();

    var mainNode = [153]
    ctxLinks.save();
    ctxLinks.clearRect(-margin.left - width/2, -margin.top, totalWidth, totalHeight);
    ctxLinks.translate(d3.event.transform.x, d3.event.transform.y);
    ctxLinks.scale(d3.event.transform.k, d3.event.transform.k);
    linkSave
      .filter(function(d) { return mainNode.indexOf(d.source.id) > -1 || mainNode.indexOf(d.target.id) > -1; })
      .forEach(function(d) {
        ctxLinks.strokeStyle = "white";
        ctxLinks.lineWidth = 3; 
        ctxLinks.beginPath();
        drawCircleArc(d.center, d.r, d.source, d.target, d.sign);
        ctxLinks.stroke();
        ctxLinks.closePath();
      })
    ctxLinks.restore();

  }
  function transform() {
    return d3.zoomIdentity
        .translate(nodesSave[1].x, height/2)
        .scale(1.5)
        //.translate(-nodesSave[1].x, nodesSave[1].y)
  }

  function transition(canvas) {
    if(canvas){
      canvas.transition()
          .delay(500)
          .duration(3000)
          .call(zoom.transform, transform)
          .on("end", function() { canvas.call(transition); });
    }
  }

}

execute_short(function() {
  simulation.stop()
  hop1()
  execute(function() {
    hop2()
    execute(function() {
      hop3()
      execute(function() {
        hop4()
        execute(function() {
          hop5()
        })
      })
    })
  })
})