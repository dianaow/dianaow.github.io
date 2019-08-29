///////////////////////////////////////////////////////////////////////////
//////////////////////////////// Render map ///////////////////////////////
///////////////////////////////////////////////////////////////////////////
if (ipadPRO_landscape) {
  var scale = width/6
  var translateX = 0
  var translateY = 0
} else if (ipad_portrait) {
  var scale = width/5.5 
  var translateX = 0
  var translateY = 0
} else if (desktop){
  var scale = width/6
  var translateX = -50
  var translateY = 150
} else {
  var scale = width/6.2
  var translateX = 0
  var translateY = 120
}

var projection = d3.geoMercator()
   .center([0, 0]) // set centre to further North
   .scale([scale]) // scale to fit group width
   .translate([width/2 + translateX, height/2 + translateY]) 

var path = d3.geoPath()
   .projection(projection)

function drawMap(data) {

  // draw a path for each feature/country
  countriesPaths = map
     .selectAll("path")
     .data(data)
     .enter().append("path")
     .attr("d", path)
     .attr("id", function(d, i) { return "country" + d.properties.name })
     .attr("class", "country")
     .attr('fill', DEFAULT_MAP_COLOR)
     .attr('stroke', DEFAULT_MAP_STROKE)
     .attr('stroke-width', '0.4px')
  
  // store an array of each country's centroid
  data.map(d=> {
    centroids.push({
      name: d.properties.name,
      x: path.centroid(d)[0],
      y: path.centroid(d)[1]
    })
  })

}

///////////////////////////////////////////////////////////////////////////
//////////////////////////////// Zoomable map /////////////////////////////
///////////////////////////////////////////////////////////////////////////
const mapWidth = svg.node().getBoundingClientRect().width;
const mapHeight = svg.node().getBoundingClientRect().height;

const zoom = d3.zoom()
  .scaleExtent([0.7, 1.9])
  .translateExtent([[-mapWidth, -mapHeight], [mapWidth, mapHeight]])
  .extent([[0,0], [mapWidth, mapHeight]])
  .on("zoom", zoomed)

function zoomed(d){

  const {x,y,k} = d3.event.transform
  let t = d3.zoomIdentity
  t =  t.translate(x,y).scale(k*sf)
  g.attr("transform", t)

}  

svg.call(zoom)

////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// Chloropleth map ///////////////////////////////
//////////////////////////////////////////////////////////////////////////////////// 
function updateMap(X) {

  countriesPaths
    .attr('fill', function(d) {
      if ((d.properties[X] === undefined) | (d.properties[X] == 0)) {
        return DEFAULT_MAP_COLOR
      } else {
        return "#404040"
      }
    })

}

////////////////////////////////////////////////////////////////////////////////////
//////////////////////////// Draw ALL net flow paths on map ////////////////////////
//////////////////////////////////////////////////////////////////////////////////// 
function drawAllLinksMap(data, type) {

  var countries = data.map(d=>d.properties.name)
  var arcData = []
  countries.map(country=>{
    arcData.push(createLinksNet(data, 'net_' + country + "_" + newYear))
  })
  arcData = arcData.flat()

  var arcPaths = all_arcs.selectAll("path").data(arcData)

  arcPaths.exit().remove()

  var entered_arcs = arcPaths.enter().append("path")
    .merge(arcPaths)
    .attr("class", "connector")
    .attr('id', function(d,i){ return 'connector-' + i })
    .attr('d', function(d) { 
      return line(d, 'sourceLocation', 'targetLocation')
      //var a = Math.atan2(d.targetLocation[1] - d.sourceLocation[1], d.targetLocation[0] - d.sourceLocation[0]) * (180 / Math.PI)
      //return arc(d, 'sourceLocation', 'targetLocation', 1)
    })
    .attr('fill', 'none')
    .attr('opacity', function(d) { return type=='show_country' ? 0 : opacityScale(d.value) })
    .attr('stroke-width', function(d) { return lineScale(d.value) })
    .style("stroke", function(d,i) {
      var sx = d.targetLocation[0] - d.sourceLocation[0]
      if (d.category=='net_recipient') {
        return (sx > 0) ? 'url(#destinationLinkStroke1)' : 'url(#destinationLinkStroke2)'
      }
      else {
        return (sx > 0) ? 'url(#originLinkStroke1)' : 'url(#originLinkStroke2)'
      }
    })

}

function createLinksNet(data, X) {

  var arcData = []
  data.map((d,i)=>{
    if((d.properties[X] !== undefined) & (d.properties[X] !== 0) ) {
      var country = X.split("_", NUM_VAR)[1]
      var cS = centroids.find(c => c.name == d.properties.name)
      var cT = centroids.find(c => c.name == country) ?  centroids.find(c => c.name == country) : {x: 0, y:0}
      if((country != 'No country label') & (country != 'Mauritius')){
        if(d.properties[X] > 0){
          arcData.push({
            value: d.properties[X],
            sourceName: d.country,
            targetName: country,
            sourceLocation: [cS.x, cS.y],
            targetLocation: [cT.x, cT.y],
            category: 'net_recipient'
          })
        } else if(d.properties[X] < 0){
           arcData.push({
            value: Math.abs(d.properties[X]),
            targetName: d.country,
            sourceName: country,
            targetLocation: [cS.x, cS.y],
            sourceLocation: [cT.x, cT.y],
            category: 'net_donor'
          })
        }
      }
    }
  }) 
  return arcData

} 

////////////////////////////////////////////////////////////////////////////////////
///////////// Draw connector paths on map according to selected category ///////////
//////////////////////////////////////////////////////////////////////////////////// 
function drawLinksMap(data, X) {

  var arcData = createLinks(data, X)
  arcData.map((d,i)=>{
    d.id = i
  })

  var arcPaths = arcs.selectAll("path").data(arcData, d=>d.id)

  arcPaths.exit().remove()

  var entered_arcs = arcPaths.enter().append("path")
    .merge(arcPaths)
    .attr('class', 'line')
    .attr('id', function(d,i){ return 'line-' + d.id })
    .attr('d', function(d) {
      return line(d, 'sourceLocation', 'targetLocation')
      //var a = Math.atan2(d.targetLocation[1] - d.sourceLocation[1], d.targetLocation[0] - d.sourceLocation[0]) * (180 / Math.PI)
      //return arc(d, 'sourceLocation', 'targetLocation', 1)
    })
    .attr('fill', 'none')
    .attr('opacity', function(d) { return opacityScale(d.value) })
    //.attr('stroke-width', DEFAULT_PATH_WIDTH)
    //.attr('stroke', colors[newCategory]['primary'])
    .attr('stroke-width', function(d) { return lineScale(d.value) })
    .style("stroke", function(d,i) {
      var sx = d.targetLocation[0] - d.sourceLocation[0]
      if (newCategory=='exposed by') {
        return (sx > 0) ? 'url(#destinationLinkStroke1)' : 'url(#destinationLinkStroke2)'
      }
      else {
        return (sx > 0) ? 'url(#originLinkStroke1)' : 'url(#originLinkStroke2)'
      }
    })

  drawLinksDashedMap(arcData)
  animatePaths("line-dashed")

} 

function createLinks(data, X) {
  // Create an array to feed into path selection
  //var arcdata = [
    //{
      //sourceName: Singapore,
      //targetName: Australia,
      //sourceLocation: [-99.5606025, 41.068178502813595],
      //targetLocation: [-106.503961875, 33.051502817366334]
    //}]

  var arcData = []
  data.map((d,i)=>{
    if((d.properties[X] !== undefined) & (d.properties[X] !== 0)) {
      
      var country = X.split("_", NUM_VAR)[1]
      var cS = centroids.find(c => c.name == d.properties.name)
      var cT = centroids.find(c => c.name == country)

      if(newCategory=='recipient'){
        arcOne = {
          value: d.properties[X],
          sourceName: d.properties.name,
          targetName: country,
          sourceLocation: [cS.x, cS.y],
          targetLocation: [cT.x, cT.y],
          startColor: colors['donor'], 
          stopColor: colors['recipient']
        }
      } else if(newCategory=='donor'){
        arcOne = {
          value: d.properties[X],
          targetName: d.properties.name,
          sourceName: country,
          targetLocation: [cS.x, cS.y],
          sourceLocation: [cT.x, cT.y],
          startColor: colors['donor'], 
          stopColor: colors['recipient']
        }
      }
      arcData.push(arcOne)
    }
  })
  return arcData

}

////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// Path animation ////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////// 
function drawLinksDashedMap(data) {

  var arcPaths = arcs.selectAll("path.line-dashed").data(data, d=>d.id)

  arcPaths.exit().remove()

  var entered_arcs = arcPaths.enter().append("path")
    .merge(arcPaths)
    .attr('class', 'line-dashed')
    .attr('id', function(d,i){ return 'line-dashed-' + d.id })
    .attr('d', function(d) { 
      return line(d, 'sourceLocation', 'targetLocation')
      //var a = Math.atan2(d.targetLocation[1] - d.sourceLocation[1], d.targetLocation[0] - d.sourceLocation[0]) * (180 / Math.PI)
      //return arc(d, 'sourceLocation', 'targetLocation', 1)
    })
    .attr('fill', 'none')
    .attr('opacity', function(d) { return opacityDashedScale(d.value) })
    .attr('stroke', 'white')
    .attr('stroke-width', function(d) { return lineDashedScale(d.value) })

}

function animatePaths(selector) {

  d3.selectAll("." + selector).each(function(d,i){
    //console.log(d3.select("#" + selector + "-" + d.id).node())
    repeat()
    function repeat() {
      var path = d3.select("#" + selector + "-" + d.id)
      if(path.node()){
        var totalLength =  path.node().getTotalLength() // Get the length of each line in turn
        path.attr("stroke-dasharray", totalLength + " " + totalLength)
          .attr("stroke-dashoffset", totalLength)
          .transition().duration(3000)
          .attr("stroke-dashoffset", 0)
          .on("end", repeat)
      }
    }

  })

}

////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Draw density circles on map ////////////////////////
//////////////////////////////////////////////////////////////////////////////////// 
function drawCirclesMap(data, type) {

  if(type=='show_country'){
    data = data.filter(d=>d.category == newCategory & d.country==newCountry)
  } else {
    data = data.filter(d=>d.category == newCategory)
  }

  var X = newYear
  var bubbleData = []
  data.map((d,i)=>{
    var c = centroids.find(c => c.name == d.country)
    if(c) {
      bubbleOne = {
        value: +d[X],
        country: d.country,
        x: c.x,   
        y: c.y
      }
      bubbleData.push(bubbleOne)
    }
  })
  circles = bubbles_explore.selectAll("g.nodegroup").data(bubbleData, d=>d.country)

  var entered_circles = circles.enter().append("g")
    .attr('class', 'nodegroup')
    .attr('transform', d=>'translate(' + d.x + "," + d.y + ")")

  entered_circles.append("circle").attr('class', 'bubble')

  circles.merge(entered_circles).select('.bubble')         
    .attr('id', d=>'bubble' + d.country)
    .transition().duration(300) 
    .attr('r', d=>rScale(d.value))
    .attr('stroke', 'white')
    .attr('stroke-width', '1px')
    .attr('stroke-opacity', 1)
    .attr('fill', colors[newCategory])
    .attr('fill-opacity', newCategory=='net' ? 0.1 : 0.6)

  circles.exit().remove()

  // append country labels below their respective bubble
  var countryLabels = map.selectAll(".countryLabel").data(bubbleData, d=>d.country)

  var entered_labels = countryLabels.enter().append("g")

  entered_labels.merge(countryLabels)
     .attr("class", "countryLabel")
     .attr("id", function(d) { return "countryLabel" + d.country })
     .attr("transform", function(d) {
        return (
           "translate(" + d.x + "," + (d.y+rScale(d.value)+10).toString() + ")" // centroid of countries
        );
     })

  entered_labels.append("text")
    .merge(countryLabels.select("text"))
     .attr("class", "countryName")
     .style("text-anchor", "middle")
     .attr("dx", 0)
     .attr("dy", 0)
     .attr('font-size', '12px')
     .attr('font-weight', 'bold')
     .attr('fill', colors[newCategory])
     .text(function(d) { return d.country.toUpperCase() })
     .call(getTextBox)
  
  // add a background rectangle the same size as the text
  countryLabels
     .insert("rect", "text")
     .attr("class", "countryBg")
     .attr('z-index', 999)
     .attr("transform", function(d) {
        return "translate(" + (d.bbox.x - 2) + "," + d.bbox.y + ")";
     })
     .attr("width", function(d) {
        return d.bbox.width + 4;
     })
     .attr("height", function(d) {
        return d.bbox.height;
     })

}

///////////////////////////////////////////////////////////////////////////
///////////////////////////// Helper functions ////////////////////////////
///////////////////////////////////////////////////////////////////////////
function topData(densityData, type, category) {

  if(type=='global_level'){
     var data = densityData.filter(d=>d.category==category)
  } else {
    var data = densityData.filter(d=>(d.country == newCountry) & (d.category == category))
  }
  data = data.sort(function(a, b){ return d3.descending(+a[newYear], +b[newYear]) })
  var countriesSorted = data.map(d=>d.country)
  var total = d3.sum(data, d=>+d[newYear])
  data = data.sort(function(a, b){ return countriesSorted.indexOf(a.country) - countriesSorted.indexOf(b.country) })
  
  var top_countries = []
  for ( var i = 0; i < 10; i++) {
    if(data[i]){
      var perc = Math.round((+data[i]['All']/total)*100)/100
      top_countries.push({'index':i, 'country': data[i]['country'], 'perc': perc})
    }
  }
  return top_countries
}

function getTextBox(selection) {
  selection.each(function(d) {
    d.bbox = this.getBBox();
  });
}

function findCenters(r, p1, p2) {
  var pm = { x : 0.5 * (p1.x + p2.x) , y: 0.5*(p1.y+p2.y) } ;
  var perpABdx= - ( p2.y - p1.y );
  var perpABdy = p2.x - p1.x;
  var norm = Math.sqrt(sq(perpABdx) + sq(perpABdy));
  perpABdx/=norm;
  perpABdy/=norm;
  var dpmp1 = Math.sqrt(sq(pm.x-p1.x) + sq(pm.y-p1.y)); 
  var sin = dpmp1 / r ;
  if (sin<-1 || sin >1) return null;
  var cos = Math.sqrt(1-sq(sin));
  var d = r*cos;
  var res1 = { x : pm.x + perpABdx*d, y: pm.y + perpABdy*d };
  var res2 = { x : pm.x - perpABdx*d, y: pm.y - perpABdy*d };
  return { c1 : res1, c2 : res2} ;  
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;

  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function describeArc(x, y, radius, startAngle, endAngle, category, NUM){
    var start = polarToCartesian(x, y, radius, endAngle);
    var end = polarToCartesian(x, y, radius, startAngle);
    var arcSweep = endAngle - startAngle <= 180 ? "0" : "1";
    if (NUM == 1) {
      var d = [
          "M", start.x, start.y, 
          "A", radius, radius, 0, arcSweep, 0, end.x, end.y
      ].join(" ");
    } else {
      var d = [
          "M", end.x, end.y, 
          "A", radius, radius, 0, arcSweep, 0, start.x, start.y
      ].join(" ");
    }
    return d    
}

function sq(x) { return x*x ; }

function drawCircleArcSVG(c, r, p1, p2, category, NUM) {
  if(c.x & c.y){
    var ang1 = Math.atan2(p1.y-c.y, p1.x-c.x)*180/Math.PI+90;
    var ang2 = Math.atan2(p2.y-c.y, p2.x-c.x)*180/Math.PI+90;
    var path = describeArc(c.x, c.y, r, ang1, ang2, category, NUM)
  }
  return path
}

function findCenters(r, p1, p2) {
  var pm = { x : 0.5 * (p1.x + p2.x) , y: 0.5*(p1.y+p2.y) } ;
  var perpABdx= - ( p2.y - p1.y );
  var perpABdy = p2.x - p1.x;
  var norm = Math.sqrt(sq(perpABdx) + sq(perpABdy));
  perpABdx/=norm;
  perpABdy/=norm;
  var dpmp1 = Math.sqrt(sq(pm.x-p1.x) + sq(pm.y-p1.y)); 
  var sin = dpmp1 / r ;
  if (sin<-1 || sin >1) return null;
  var cos = Math.sqrt(1-sq(sin));
  var d = r*cos;
  var res1 = { x : pm.x + perpABdx*d, y: pm.y + perpABdy*d };
  var res2 = { x : pm.x - perpABdx*d, y: pm.y - perpABdy*d };
  return { c1 : res1, c2 : res2} ;  
}

function arc(d, sourceName, targetName, NUM) {

  var sourceLngLat = d[sourceName],
      targetLngLat = d[targetName];

  if (targetLngLat && sourceLngLat) {

    var sourceX = sourceLngLat[0],
        sourceY = sourceLngLat[1];

    var targetX = targetLngLat[0],
        targetY = targetLngLat[1];

    var dx = targetX - sourceX,
        dy = targetY - sourceY

    var initialPoint = { x: sourceX, y: sourceY}
    var finalPoint = { x: targetX, y: targetY}
    d.r = Math.sqrt(sq(dx) + sq(dy)) * 2;
    var centers = findCenters(d.r, initialPoint, finalPoint);
    var path = drawCircleArcSVG(centers.c1, d.r, initialPoint, finalPoint, d.category, NUM);
    return path

  }

}

function line(d, sourceName, targetName){

  var sourceLngLat = d[sourceName],
      targetLngLat = d[targetName];

  if (targetLngLat && sourceLngLat) {

    var sourceX = sourceLngLat[0],
        sourceY = sourceLngLat[1];

    var targetX = targetLngLat[0],
        targetY = targetLngLat[1];

    var path = [
      "M", sourceX, sourceY, 
      "L", targetX, targetY
    ].join(" ")

    return path

  } else {
    return "M0,0,l0,0z";
  }
}