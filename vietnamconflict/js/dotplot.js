/////////////////////// Calculate coordinates of dotted plot //////////////////
var DEFAULT_OPTIONS = {

  radius: 6,
  tilesPerRow: 8,
  width: 1000,
  height: 1000,
  color: "black",
  strokeFill: 'black',
  strokeWidth: 0,
  category: {sort_category: undefined, sort_list: undefined, color: undefined}
}

function getOptionOrDefault(key, options, defaultOptions) {
    defaultOptions = defaultOptions || DEFAULT_OPTIONS;
    if (options && key in options) {
        return options[key];
    }
    return defaultOptions[key];
}

function createDots(data, type, group1_name, group2_name, group1_list, group2_list, options) {

  var labels = []
  var arrays = [] 
  var radius = getOptionOrDefault('radius', options)
  var tilesPerRow = getOptionOrDefault('tilesPerRow', options)
  var width = getOptionOrDefault('width', options)
  var height = getOptionOrDefault('height', options)
  var color = getOptionOrDefault('color', options)
  var strokeFill = getOptionOrDefault('strokeFill', options)
  var strokeWidth = getOptionOrDefault('strokeWidth', options)
  var category = getOptionOrDefault('category', options) 
  var X = category.sort_category
  var sort_list = category.sort_list
  var colorScale = category.color

  var nodeRadius = radius * 2
  var tileSize = nodeRadius * 1.5
  var barWidth = (tilesPerRow+1) * tileSize

  var xScale = d3.scaleBand()
    .domain(group1_list)
    .range([0, group1_list.length*barWidth])

  var yScale = d3.scaleBand()
    .domain(group2_list)
    .range([group2_list.length*barWidth, 0])

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
      .sortValues(function(a,b) { return sort_list.indexOf(a[X]) - sort_list.indexOf(b[X]); })
      .entries(data)

    console.log(group1_list, sort_list)
    res_nested_bin.map((d,i) => {
      arrays.push(getTilesBar(d.key, d.values, i, X)) // get x-y coordinates of all tiles first without rendering the dotted bar chart
    })

    labels = []
    group1_list.map((d,counter) => {
      labels.push({
        x: (counter * barWidth) + (tilesPerRow * tileSize)/2,
        y: height + tileSize*2,
        key: 'xaxis_label',
        value: group1_list[counter],
        width: barWidth
      })
      labels.push({
        x: (counter * barWidth) + (tilesPerRow * tileSize)/2,
        y: d3.min(arrays[counter], d=>d.y) ? d3.min(arrays[counter], d=>d.y)-15 : 0,
        key: 'count_label',
        value: res_nested_bin[counter].values.length, 
        width: barWidth
      })
    })

    rects = []
    group1_list.map((d,i) => {
      rects.push({
        x: i * barWidth,
        y: d3.min(arrays[i], d=>d.y) ? d3.min(arrays[i], d=>d.y) : 0,
        height: height,
        width: barWidth,
        key: d
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
        y: -yScale.bandwidth() - tileSize*2,
        key: group1_list[counter],
        width: barWidth
      })
    })

    group2_list.map((d,counter) => {
      labels.push({
        x: -85,
        y: yScale(d),
        key: group2_list[counter],
        width: barWidth
      })
    })

    rects = []
    group1_list.map((d1,i1) => {
      group2_list.map((d2,i2) => {
        rects.push({
          x: i1 * barWidth,
          y: yScale(d2) - yScale.bandwidth(),
          width: barWidth
        })
      })
    })

  }

  var distributed = [].concat.apply([], arrays)
  var data = {dots: distributed, labels: labels, rects: rects}
  return data

  function getTilesBar(key, values, counter, X) {

    var tiles = []
    for(var i = 0; i < values.length; i++) {
      var rowNumber = Math.floor(i / tilesPerRow)
      tiles.push({
        x: ((i % tilesPerRow) * tileSize) + xScale(values[i][group1_name]) + tileSize,
        y: -(rowNumber + 1) * tileSize + height, // stack nodes within same group
        //index: key + i.toString(), // index each node
        index: values[i].id + '-' + values[i][group2_name],
        r: (tileSize/1.5)/2,
        color: colorScale ? colorScale(values[i][X]) : color,
        strokeFill: strokeFill,
        strokeWidth: strokeWidth,
        val: values
      });
    }
    return tiles

  }

  function getTilesBarTiled(key, values, counter) {

    var tiles = []
    for(var i = 0; i < values.length; i++) {
      var rowNumber = Math.floor(i / tilesPerRow)
      tiles.push({
        x: ((i % tilesPerRow) * tileSize) + (counter * barWidth) + tileSize,
        y: -(rowNumber + 1) * tileSize + yScale(values[i][group2_name]) + height,
        index: values[i].id + '-' + values[i][group2_name],
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