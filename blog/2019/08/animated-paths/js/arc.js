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

function sq(x) { return x*x ; }

function describeArc(x, y, radius, startAngle, endAngle, DIRECTION, NUM){
    var large_arc_flag = endAngle - startAngle <= 180 ? "0" : "1";
    if(DIRECTION=='inner'){
      var start = polarToCartesian(x, y, radius, startAngle);
      var end = polarToCartesian(x, y, radius, endAngle);
      if (NUM === 1) {
        var sweep_flag = 0
      } else if (NUM === 2) {
        var sweep_flag = 1
      } 
    } else if(DIRECTION=='outer'){
      var start = polarToCartesian(x, y, radius, endAngle);
      var end = polarToCartesian(x, y, radius, startAngle);
      if (NUM === 1) {
        var sweep_flag = 1
      } else if (NUM === 2) {
        var sweep_flag = 0
      } 
    }
    var d = [
        "M", start.x, start.y, 
        "A", radius, radius, 0, large_arc_flag, sweep_flag, end.x, end.y
    ].join(" ");

    return d    
}

function drawCircleArcSVG(c, r, p1, p2, DIRECTION, NUM) {
  var ang1 = Math.atan2(p1.y-c.y, p1.x-c.x)*180/Math.PI+90;
  var ang2 = Math.atan2(p2.y-c.y, p2.x-c.x)*180/Math.PI+90;
  var path = describeArc(c.x, c.y, r, ang1, ang2, DIRECTION, NUM)
  return path
}

function arc(source, target, DIRECTION, NUM) {

    var sourceX = source[0],
        sourceY = source[1];
    var targetX = target[0],
        targetY = target[1];
    var dx = targetX - sourceX,
        dy = targetY - sourceY
    var initialPoint = { x: sourceX, y: sourceY}
    var finalPoint = { x: targetX, y: targetY}
    var r = Math.sqrt(sq(dx) + sq(dy)) * 2;
    var centers = findCenters(r, initialPoint, finalPoint);
    var path = drawCircleArcSVG(centers.c1, r, initialPoint, finalPoint, DIRECTION,  NUM);
    return path

}