///////////////////////////////////////////////////////////////////////////
///////////////////////////////// Globals /////////////////////////////////
/////////////////////////////////////////////////////////////////////////// 

var screenWidth = Math.max(document.documentElement.clientWidth, window.innerHeight || 0)
var screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
var canvasDim = { width: screenWidth, height: screenHeight}

var margin = {top: 0, right: 0, bottom: 0, left: 0}
var width = canvasDim.width - margin.left - margin.right 
var height = canvasDim.width - margin.top - margin.bottom 

///////////////////////////////////////////////////////////////////////////
//////////////////// Set up and initiate containers ///////////////////////
/////////////////////////////////////////////////////////////////////////// 

var svg = d3.select("#chart").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

///////////////////////////////////////////////////////////////////////////
///////////////////////////// Create scales ///////////////////////////////
///////////////////////////////////////////////////////////////////////////

var xScale = d3.scaleBand()
  .range([margin.left, width])

var yScale = d3.scaleLinear()
  .range([height, margin.top])

var color = d3.scaleOrdinal()
	.range(['#fff5f0','#fee0d2','#fcbba1','#fc9272','#fb6a4a','#ef3b2c','#cb181d','#a50f15','#67000d'])

run()

///////////////////////////////////////////////////////////////////////////
/////////////////////////// Data Processing ///////////////////////////////
/////////////////////////////////////////////////////////////////////////// 

function run() {

  d3.queue()   
    .defer(d3.json, './data/deathPercentages_byProvince_byTime.json')  
    .defer(d3.json, './data/VietnamWarTimeline.json')  
    .await(dataProcess);  
}

function dataProcess(error, deathJSON, timelineJSON) {

	// Nest data with year-month set as key
	var dataByDate = d3.nest()
		.key(d=>d['FATALITY_DATE'])
		.entries(deathJSON)

	// Ensure that all year-months have the same sort arrangement of provinces
	dataByDate = dataByDate.map(d => d.values.sort(sortOn("DEPLOYMENT PROVINCE")))

	// Construct and array of all provinces with deaths
	var provincesList = [... new Set(deathJSON.map(d=>d["DEPLOYMENT PROVINCE"]))]

  // Construct an array of arrays where dataNew[i][j] is the point achived for year-month i and province j.
  var dataNew = []
  var eachPoints = []
  dataByDate.map((D,I) => {
    var oneMonthProvince = Array.from(Array(provincesList.length), () => 0)
    D.map((d,i) => {
      oneMonthProvince[provincesList.indexOf(d["DEPLOYMENT PROVINCE"])] = d.count
    })
    dataNew.push(oneMonthProvince)
  })
  console.log(dataNew)
  // Fix the order arrangement of year-month
  var YearMonthList = [... new Set(deathJSON.map(d=>d['FATALITY_DATE']))].sort(d3.ascending)

  // Constructs a stack layout based on data 
  // d3's permute ensures each individual array is sorted in the same order. Important to ensure sort arrangement is aligned for all parameters before stack layout)
  var stackedData = Object.assign(d3.stack().keys(d3.range(provincesList.length))(dataNew), {
    keys: provincesList,
    ids: provincesList.map(R => YearMonthList.map(P => `${R}_${P}`)),
    dates: YearMonthList
  })

  // Update x-scale based on new sort order of year-months
  xScale.domain(YearMonthList)

  // Update y-scale based on range of total fatality deaths within year-months
  yScale.domain([0, 2400])

  // Update color-scale based on new sort order of year-months
  color.domain(provincesList)

  stackedData.forEach((d,i) => {
    stackedData.dates.forEach((D,I) => {
      stackedData[i][I].province = stackedData.keys[i]
      stackedData[i][I].dates = D
      stackedData[i][I].key = stackedData.ids[i][I]
      stackedData[i][I].color = color(stackedData.keys[i]) 
      stackedData[i][I].x = xScale(D)
      stackedData[i][I].y = ( d[I][1] ? height - yScale(d[I][0]) : yScale(0) ) 
      stackedData[i][I].y1 = yScale(d[I][1])
      stackedData[i][I].width = xScale.bandwidth()
      stackedData[i][I].height = ( d[I][0] ? yScale(d[I][0]) : yScale(0) ) - ( d[I][1] ? yScale(d[I][1]) : yScale(0) )
    })
  })
  console.log(stackedData)

  renderStacked(stackedData)
}	

function renderStacked(data) {

  var bars = svg.selectAll("g.bar") 
    .data(data, d=>d.keys)

  bars.enter().append("g")
    .attr("class", d =>d.keys)
    .each(function(d) {
    	console.log(d)
    	d3.select(this).selectAll("rect")
    		.data(d)
    		.enter().append("rect")
        .attr("fill", d=>d.color)
        .attr("x", d => d.x)
        .attr("width", d => d.width)
        .attr("y", 0)
        .attr("height", 0)   
        .transition().duration(3000)
		    .attr("y", d => d.y)
        .attr("height", d => d.height)   
	
    })

}

function sortOn(property) {
  return function(a, b){
    if(a[property] < b[property]){
        return -1;
    }else if(a[property] > b[property]){
        return 1;
    }else{
        return 0;   
    }
  }
}