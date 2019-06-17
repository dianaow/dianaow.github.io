/////////////////////// Calculate coordinates of dotted plot //////////////////
var DEFAULT_OPTIONS = {

  radius: 6,
  tilesPerRow: 8,
  width: 1000,
  height: 1000,
  color: "black",
  strokeFill: 'black',
  strokeWidth: 0,
  scales: undefined
}

function getOptionOrDefault(key, options, defaultOptions) {
    defaultOptions = defaultOptions || DEFAULT_OPTIONS;
    if (options && key in options) {
        return options[key];
    }
    return defaultOptions[key];
}

function createDots(data, type, group1_name, group2_name, group1_list, group2_list, options) {

  var labels, arrays 
  var radius = getOptionOrDefault('radius', options)
  var tilesPerRow = getOptionOrDefault('tilesPerRow', options)
  var width = getOptionOrDefault('width', options)
  var height = getOptionOrDefault('height', options)
  var color = getOptionOrDefault('color', options)
  var strokeFill = getOptionOrDefault('strokeFill', options)
  var strokeWidth = getOptionOrDefault('strokeWidth', options)
  var scales = getOptionOrDefault('scales', options) // import any scales
  
  var nodeRadius = radius * 2
  var tileSize = nodeRadius * 1.5
  var barWidth = (tilesPerRow+1) * tileSize

  group2_listL = group2_list.slice(0,5)
  group2_listM = group2_list.slice(5,14)
  group2_listS = group2_list.slice(14,49)

  //group2_listS = group2_list.slice(0,35)
  //group2_listM = group2_list.slice(35,44)
  //group2_listL = group2_list.slice(44,49)

  shortestBlock = group2_listS.length*barWidth
  middleBlock = group2_listM.length*barWidth*2.5
  largestBlock = group2_listL.length*barWidth*8
  console.log(group2_listS, group2_listM, group2_listL)
  var yScaleS = d3.scaleBand()
    .domain(group2_listS)
    .range([shortestBlock, 0])

  var yScaleM = d3.scaleBand() // longer 
    .domain(group2_listM)
    .range([shortestBlock + middleBlock, shortestBlock+barWidth])

  var yScaleL = d3.scaleBand() // longer 
    .domain(group2_listL)
    .range([shortestBlock + middleBlock + largestBlock, shortestBlock + middleBlock+barWidth*3 ])

  if(type=='bar'){
    barChart()
  } else if(type=='tiledbar'){
    tiledbarChart()
  }

  function barChart() {

    arrays = []
    var res_nested_bin = d3.nest()
      .key(d=>d[group1_name])
      .sortKeys(function(a,b) { return group1_list.indexOf(a) - group1_list.indexOf(b); })
      .entries(data)

    res_nested_bin.map((d,i) => {
      arrays.push(getTilesBar(d.key, d.values, i)) // get x-y coordinates of all tiles first without rendering the dotted bar chart
    })

    res_nested_bin.map((d,counter) => {
      labels.push({
        x: (counter * barWidth),
        y: height
      })
    })

  }

  function tiledbarChart() {

    arrays = []
    var res_nested_bc = d3.nest()
      .key(d=>d[group1_name])
      .sortKeys(function(a,b) { return group1_list.indexOf(a) - group1_list.indexOf(b); })
      .key(d=>d[group2_name])
      .sortKeys(function(a,b) { return group2_list.indexOf(a) - group2_list.indexOf(b); })
      .entries(data)

    res_nested_bc.map((d1,i1) => {
      d1.values.map((d2,i2) => {
        d2.values.sort(function(x, y){
           return d3.ascending(x.value, y.value);
        })
        arrays.push(getTilesBarTiled(d2.key, d2.values, i1))
      })
    })
    //console.log(arrays)

    labels = []
    group1_list.map((d,counter) => {
      labels.push({
        x: (counter * barWidth),
        y: -yScaleS.bandwidth() - tileSize*2,
        key: group1_list[counter],
        width: barWidth
      })
    })

    group2_list.map((d,counter) => {
      labels.push({
        x: -85,
        y: group2_listL.indexOf(d) != -1 ? yScaleL(d) : ( group2_listM.indexOf(d) != -1 ? yScaleM(d) : yScaleS(d) ),
        key: group2_list[counter],
        width: barWidth
      })
    })

    rects = []
    group1_list.map((d1,i1) => {
      group2_list.map((d2,i2) => {
        rects.push({
          x: i1 * barWidth,
          y: group2_listL.indexOf(d2) != -1 ? yScaleL(d2) - yScaleL.bandwidth() : ( group2_listM.indexOf(d2) != -1 ? yScaleM(d2) - yScaleM.bandwidth() : yScaleS(d2) - yScaleS.bandwidth() ),
          width: barWidth
        })
      })
    })

  }

  var distributed = [].concat.apply([], arrays)
  var data = {dots: distributed, labels: labels, rects:rects}
  return data

  function getTilesBar(key, values, counter) {

    var tiles = []
    for(var i = 0; i < values.length; i++) {
      var rowNumber = Math.floor(i / tilesPerRow)
      tiles.push({
        x: ((i % tilesPerRow) * tileSize) + (counter * barWidth) + tileSize,
        y: -(rowNumber + 1) * tileSize + height, // stack nodes within same group
        index: key + i.toString(), // index each node
        r: (tileSize/1.5)/2,
        color: colorScale ? colorScale(values[i].value) : color,
        strokeFill: strokeFill,
        strokeWidth: strokeWidth
      });
    }
    return tiles

  }

  function getTilesBarTiled(key, values, counter) {

    var tiles = []
    for(var i = 0; i < values.length; i++) {
      var colorScale = scales.color
      var rowNumber = Math.floor(i / tilesPerRow)
      tiles.push({
        x: ((i % tilesPerRow) * tileSize) + (counter * barWidth) + tileSize,
        y: -(rowNumber + 1) * tileSize + (group2_listL.indexOf(values[i].province) != -1 ? yScaleL(values[i][group2_name]) : ( group2_listM.indexOf(values[i].province) != -1 ? yScaleM(values[i][group2_name]) : yScaleS(values[i][group2_name]) )),
        index: values[i].id,
        //index: key + i.toString(), // index each node
        r: (tileSize/1.5)/2,
        color: colorScale ? colorScale(values[i].value) : color,
        strokeFill: strokeFill,
        strokeWidth: strokeWidth
      });
    }
    return tiles

  }

}