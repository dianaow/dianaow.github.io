var chart = function () {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 
  var canvasDim = { width: screen.width, height: screen.height*1.06}
  var margin = {top: 10, right: 10, bottom: 0, left: 10}
  var width = canvasDim.width - margin.left - margin.right 
  var height = canvasDim.height - margin.top - margin.bottom 
  var mapWidth = 300
  var mapHeight = 600
  var chart = d3.select("#chart")
  var mapWrapper = d3.select("#map")
  var DEFAULT = 1968

  var provincesSorted = ['Yên Bái', 'Northeast', 'Thừa Thiên Huế', 'Khánh Hòa', 'Ninh Thuận', 'Bình Định', 'Quảng Nam', 'Phú Yên', 'Đắk Lắk', 'Gia Lai', 'Kon Tum', 'Lâm Đồng', 'Bình Dương', 'Tây Ninh', 'Đồng Nai', 'Hồ Chí Minh', 'Long An', 'Bến Tre', 'Tiền Giang', 'Vĩnh Long', 'Đồng Tháp', 'An Giang', 'Mekong (Southern)'].reverse()

  //////////////////// Set up and initiate containers ///////////////////////
  var svg = chart.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var gCircle = svg.append('g')
  var gRect = svg.append('g')

  var map = mapWrapper.append("svg")
    .attr("width", mapWidth)
    .attr("height", mapHeight)

  /////////////////////////////////// Scales ////////////////////////////////
  var maxDeath = 1300
  var color = d3.scaleLinear()
                .domain([0, maxDeath])
                .range(['white', 'black'])

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Initialize //////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 

  return { 
    run : function () {

      loadData()

      ///////////////////////////////////////////////////////////////////////////
      ////////////////////////////// Generate data //////////////////////////////
      ///////////////////////////////////////////////////////////////////////////

      function loadData() {

        d3.queue()
          .defer(d3.json, './data/vietnam1.json')
          .defer(d3.csv, './data/VietnamConflict_clean.csv') 
          .defer(d3.csv, './data/VietnamConflict_yearPT.csv') 
          .defer(d3.csv, './data/timeline.csv') 
          .await(processData);   

      }

      function processData(error, geoJSON, csv, csv2, csv3) {
        
        if (error) throw error;

        var data = csv.map((d,i) => {
          return {
            id: i,
            rank: d.RANK,
            position: d.POSITION,
            ethnicity: d.ETHNICITY,
            division: d.DIVISION,
            fatality_year: d.FATALITY_YEAR,
            fatality_month: d.FATALITY_MONTH,
            province: d.DEPLOYMENT_PROVINCE
          }
        })

        var timeline = csv3.map((d,i) => {
          return {
            year: +d.year,
            description: d.description,
          }
        })

        init(svg, width, height, data, timeline)

        var vietnam = geoJSON.features;  // store the path in variable for ease
        for (var i in vietnam) {    // for each geometry object
          for (var j in csv2) {  // for each row in the CSV
            if (vietnam[i].properties.NAME_1 == csv2[j]['DEPLOYMENT_PROVINCE']) {   // if they match
              //console.log(csv2[j]['DEPLOYMENT_PROVINCE'])
              for (var k in csv2[j]) {   // for each column in the a row within the CSV
                if (k != 'DEPLOYMENT_PROVINCE') {  // let's not add the name or id as props since we already have them
                  vietnam[i].properties[k] = (csv2[j][k] != null ? Number(csv2[j][k]) : 0)  // add each CSV column key/value to geometry object
                } 
              }
              break;  // stop looking through the CSV since we made our match
            } 
          }
        }
        //console.log(vietnam)

        drawMap(geoJSON, vietnam)
        updateMap(DEFAULT)
        interactive(d3.selectAll('rect'))
        interactiveLegend(d3.selectAll('rect.barLegend'), gCircle.selectAll('circle'))
      }

    }
  }

  ///////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// Render map /////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function drawMap(geoJSON, data) {

    var projection = d3.geoMercator().fitSize([mapWidth, mapHeight], geoJSON)

    var path = d3.geoPath().projection(projection);

    provincesPath = map.selectAll(".country")
        .data(data)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr('id', d=>d.properties.NAME_1)
        .attr("d", path)
        .attr('fill', 'none')
        .attr("stroke-width", "1px")
        .attr("stroke", "black")
  }

  ///////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Control Center /////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function init(svg, width, height, data, timeline) {

    data = data.filter(d=>d.province != 'UNKNOWN') // remove all persons with missing provinces
    
    data = data.sort(function(x, y){ return provincesSorted.indexOf(x.province) - provincesSorted.indexOf(y.province) })

    var years = data.map(d => +d.fatality_year).filter(onlyUnique).filter(e=>e != undefined).sort(function(x, y){
       return d3.ascending(x, y)
    })

    //var months = data.map(d => d.fatality_month).filter(onlyUnique).filter(e=>e != undefined)
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    var monthColors = chroma.scale(['#ffe5e5', '#ff0000']).mode('lch').colors(months.length)
    var monthColorScale = d3.scaleOrdinal()
      .domain(months)
      .range(monthColors)

    var months_groupby = groupby('fatality_month')

    renderBarLegend(months_groupby, monthColorScale, months, 'months')

    // sort provinces by highest death count
    //provinces_nested = d3.nest()
      //.key(d=>d.province)
      //.rollup(function(leaves) { return leaves.length; })
      //.entries(res)
      //.sort(function(a, b){ return d3.descending(a.value, b.value) })
    //var provinces_sorted = provinces_nested.map(d=>d.key)


    // intial sort by month-year
    data = data.sort(function(a, b){ return d3.ascending(a.fatality_month, b.fatality_month) })
    data = data.sort(function(a, b){ return d3.ascending(+a.fatality_year, +b.fatality_year) })
    
    res = data.filter(d=>(d.fatality_year == DEFAULT))
    var tab = 'month'
    update(res, tab)

    // 1: Years
    d3.select(".dropdown .menu").selectAll("div")
        .data(years)
      .enter().append("div")
        .attr('class', 'item')
        .attr("data-value", function (d) { return d })
        .text(function (d) { return d })
      .on("click", function(d) {
        res = data.filter(b=>(b.fatality_year == d))
        update(res, tab)
        updateMap(d)
      })

    d3.select(".year-header").html("<h1>" + DEFAULT + "</h1>")
    $('#year-range').range({
      min: 1967,
      max: 1973,
      start: 1968,
      step: 1,
      onChange: function(d, meta) {
        if(meta.triggeredByUser) {
          res = data.filter(b=>(b.fatality_year == d))
          update(res, tab)
          updateMap(d)  
          var summary = timeline.find(b=>b.year == d).description
          d3.select(".year-header").html("<h1>" + d + "</h1>")
          d3.select(".year-summary").html("<p>" + summary + "</p>")
        }         
      }
    });       

    // 2: Month
    d3.select(".btn-month")
      .on("click", function(d) {
        tab = 'month'
        update(res, tab)
        d3.select('.gLegend').remove()
        renderBarLegend(months_groupby, monthColorScale, months, 'months')
      })

    // 2: Rank
    //var ranks = res.map(d => d.rank).filter(onlyUnique).filter(e=>e != undefined)
    var enlisted = ["PVT", "SPC"]
    var WO = ['WO']
    var NCO = ["CPL", "SGT", "SSG", "SFC", "MSG", '1SG', 'SGM']
    var CO = ['2LT', '1LT', 'CPT']
    var FO = ['MAJ',' LTC', 'COL']
    var GO = ['BG', 'MG']
    var ranks = [enlisted, WO, NCO, CO, FO, GO].flat()

    var colors_enlisted = ['khaki', 'darkkhaki']
    var colors_WO = ['MediumVioletRed']
    var colors_NCO = ['#add8e6', '#a1b3ed', '#918ef2', '#7a69f7', '#5941fb', '#0000ff', 'red']
    var colors_CO = ['slategray', 'darkslategray', 'black']
    var colors_FO = ['red', 'red', 'red']
    var colors_GO = ['red', 'red']
    var ranksColors = [colors_enlisted, colors_WO, colors_NCO, colors_CO, colors_FO, colors_GO].flat()

    var ranksColorScale = d3.scaleOrdinal()
      .domain(ranks)
      .range(ranksColors)

    var ranks_groupby = groupby('rank')

    d3.select(".btn-rank")
      .on("click", function(d) {
        //res = res.sort(function(a,b) { return ranks.indexOf(a.rank) - ranks.indexOf(b.rank); })
        tab = 'rank'
        update(res, tab)
        d3.select('.gLegend').remove()
        renderBarLegend(ranks_groupby, ranksColorScale, ranks, 'ranks')
        interactiveLegend(d3.selectAll('rect.barLegend'), gCircle.selectAll('circle'))
      })

    // 3: Ethnicity
    var ethnicities = res.map(d => d.ethnicity).filter(onlyUnique).filter(e=>e != undefined)
    var ethnicitiesColors = chroma.scale(['lightgray', 'black', 'aquamarine', 'hotpink', 'darkslateblue']).mode('lch').colors(ethnicities.length)
    var ethnicitiesColorScale = d3.scaleOrdinal()
      .domain(ethnicities)
      .range(ethnicitiesColors)

    var eth_groupby = groupby('ethnicity')

    d3.select(".btn-ethnicity")
      .on("click", function(d) {
        //res = res.sort(function(a,b) { return ethnicities.indexOf(a.ethnicity) - ethnicities.indexOf(b.ethnicity); })
        tab = 'ethnicity'
        update(res, tab)
        d3.select('.gLegend').remove()
        renderBarLegend(eth_groupby, ethnicitiesColorScale, ethnicities, 'ethnicities')
      })

    // 4: Positions
    var positions = res.map(d => d.position).filter(onlyUnique).filter(e=>e != undefined)
    var positionsColors = chroma.scale(['#fafa6e','#2A4858']).mode('lch').colors(positions.length)
    var positionsColorScale = d3.scaleOrdinal()
      .domain(positions)
      .range(positionsColors)

    d3.select(".btn-position")
      .on("click", function(d) {
        //res = res.sort(function(a,b) { return positions.indexOf(a.position) - positions.indexOf(b.position); })
        tab = 'position'
        update(res, tab)
      })

    function update(data, tab) {

      var options = {
        radius: 1.9,
        tilesPerRow: 11,
        width: width,
        height: height*(3/4),
        leftBuffer: 0,
        bottomBuffer: 0
      }

      if(tab=='ethnicity'){
        options.category = {'color': ethnicitiesColorScale, 'sort_list': ethnicities, 'sort_category': 'ethnicity'}
      } else if(tab=='position'){
        options.category = {'color': positionsColorScale, 'sort_list': positions, 'sort_category': 'position'}
      } else if(tab=='rank'){
        options.category = {'color': ranksColorScale, 'sort_list': ranks, 'sort_category': 'rank'}
      } else if(tab=='month'){
        options.category = {'color': monthColorScale, 'sort_list': months, 'sort_category': 'fatality_month'}
      }

      var dots = createDots(data, 'bar', 'province', 'fatality_year', provincesSorted, years, options) 

      updateCircles(svg, dots.dots)
      updateLabels(svg, dots.labels)
      updateRects(svg, dots.rects)

    }

    function groupby(X) {
      const groupby = data.map(d => d[X]).reduce((total, value) => {
        total[value] = (total[value] || 0) + 1;
        return total;
      }, {});
      return groupby
    }


  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Interactivity ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  // When each invisible bar behind dot plot is hovered, location of province on map is highlighted
  function interactive(bar) {

    bar.on("mousemove", function(d) {
      map.selectAll(".country").filter(l=>l.properties.NAME_1 == d.key)
        .attr('stroke', 'red')
        .attr('stroke-width', '3px')
    }).on("mouseout", function(d) {
      map.selectAll(".country")
        .attr('stroke', 'black')
        .attr('stroke-width', '1px')
    })

  }

  // When each bar on legend is hovered, dots in respective category is highlight
  function interactiveLegend(bar, dots) {

    bar.on("mousemove", function(d) {
      console.log(d)
      dots.attr('opacity', function(l) { return l.category == d[0] ? 1 : 0.05})
    }).on("mouseout", function(d) {
      dots.attr('opacity', 1)
    })

  }
  ///////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Chloropleth map ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function updateMap(X) {

    map.selectAll(".country")
     .attr('fill', function(d) {
      if (((d.properties[X]) === undefined) || (d.properties[X]) === 0){
        return "#ffffff"
      } else {
        return color(d.properties[X]) 
      }})

  }

  ///////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Update dot plot ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function updateCircles(svg, data) {

    let circles = gCircle.selectAll("circle").data(data)

    circles.exit().remove()

    var entered_circles = circles
        .enter().append("circle")
        .merge(circles)
        .attr("class", d=> d.category)
        .attr("id", d => d.index)
        .attr("r", d => d.r)
        .attr("fill", d => d.color)
        .attr('stroke', d=> d.parent=='root' ? 'red' : d.strokeFill)
        .attr('stroke-width', d=> d.parent=='root' ? '2.5px' : d.strokeWidth)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)

    //circles = circles.merge(entered_circles)

    //circles
      //.transition().duration(3000)
      //.attr("class", d=> d.category)
      //.attr("fill", d => d.color)
      //.attr('cx', d => d.x)
      //.attr('cy', d => d.y)  

  }

  ///////////////////////////////////////////////////////////////////////////
  ////////////////// Update rects (layered behind dot plot) /////////////////
  ///////////////////////////////////////////////////////////////////////////

  function updateRects(svg, data) {

    let rects = gRect.selectAll("rect").data(data)

    rects.exit().remove()

    var entered_rects = rects
        .enter().append("rect")
        .merge(rects)
        .attr("width", d => d.width)
        .attr("height", d=> d.height)
        .attr("fill", 'white')
        .attr('stroke', 'black')
        .attr('stroke-width', '0px')
        .attr('opacity', 0)
        .attr('id', d=>d.key)
        .attr("x", d => d.x)
        .attr("y", d => 0)

    //rects = rects.merge(entered_rects)

    //rects
      //.transition().duration(5000)
      //.attr('x', d => d.x)
      //.attr('y', d => 0)  

  }

  ///////////////////////////////////////////////////////////////////////////
  ////////////////// Update labels (x-axis of dot plot) /////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function updateLabels(svg, data) {

    var texts = svg.selectAll("text").data(data)

    texts.exit().remove() 

    var entered_texts = texts
        .enter().append("text")
        .merge(texts)
        .attr("fill", d => 'black')
        .attr('dy', '0.35em')
        .attr("transform", d=> d.key=='xaxis_label' ? "translate(" + d.x + "," + d.y + ")rotate(45)" : "translate(" + d.x + "," + d.y + ")") 
        .attr('text-anchor', d=> d.key=='xaxis_label' ? 'start' : 'middle')
        .text(d=>d.value)

    //texts = texts.merge(entered_texts)

    //texts
      //.transition().duration(2000)
      //.attr("transform", d=> d.key=='xaxis_label' ? "translate(" + d.x + "," + d.y + ")rotate(45)" : "translate(" + d.x + "," + d.y + ")") 
      //.text(d=>d.value)

  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Render bar chart ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  
  function renderBarLegend(obj, scale, categories, cat_string) {

    var pad = 20
    var result = Object.keys(obj).map(function(key) {
      return [`${key}`, obj[key]];
    });

    var xScale = d3.scaleLinear()
      .domain([0, Math.ceil(d3.max(result, d=>d[1])/500) * 500])
      .range([0, 400 - (cat_string=='ethnicities' ? 50 : 0) ])
      
    var yScale = d3.scaleBand()
      .domain(categories)
      .range([0, 200-pad])
      .padding(0.1)

    var legend = d3.select('#legend').append('g')
      .attr('transform', d => 'translate(' + (cat_string=='ethnicities' ? 120 : 50) + ',0)')
      .attr('class', 'gLegend')

    d3.select('#legend').append('text')
      .attr('class', 'annotation')
      .attr('transform', d => 'translate(' + 20 + ',' + 215 + ')')
      .text('Hover over any of the bars to highlight a category')

    let rects = legend.selectAll("rect").data(result)

    rects.exit().remove()

    var entered_rects = rects.enter().append("rect")
        .attr('class', 'barLegend')
        .attr("width", (d,i) => xScale(d[1]))
        .attr("height", yScale.bandwidth())
        .attr("fill", (d,i) => scale(d[0]))
        .attr('stroke', 'black')
        .attr('stroke-width', '0px')
        .attr('id', d=>d.key)
        .attr("x", 0)
        .attr("y", (d,i) => yScale(d[0]))

    rects = rects.merge(entered_rects)

    legend.append("g")
      .attr("transform", "translate(0," + (200-pad).toString() + ")")
      .call(d3.axisBottom(xScale).ticks(10, cat_string=='months' ? 'f' : 's'))

    legend.append("g").call(d3.axisLeft(yScale))
      .call(legend => legend.select(".domain").remove())

  }

}()

function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}