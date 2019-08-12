var main = function () {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 
  var connData, densityData, arcs, all_arcs, bubbles, newCountry

  var ipadPRO_landscape = Math.min(window.innerWidth, screen.width)>1024 & Math.min(window.innerWidth, screen.width)<=1366 & (Math.abs(screen.orientation.angle == 90))
  var ipad_landscape = Math.min(window.innerWidth, screen.width)<=1024 & (Math.abs(screen.orientation.angle == 90))
  var ipad_portrait = Math.min(window.innerWidth, screen.width)<=1024 & (Math.abs(screen.orientation.angle == 0))
  var laptop = Math.min(window.innerWidth, screen.width) > 1024
  var desktop = Math.min(window.innerWidth, screen.width) > 1680

  var canvasDim = { width: window.innerWidth*0.98, height: ipad_portrait ? 400 : window.innerHeight*0.98}
  var margin = {top: 0, right: 0, bottom: 0, left: 0}
  var width = canvasDim.width - margin.left - margin.right 
  var height = canvasDim.height - margin.top - margin.bottom 
  var chart = d3.select("#chart")

  var centroids = []
  var attributeArray = []
  var attribute
  var NUM_VAR = 2
  var newCategory = 'net'
  var newYear = 'All'
  var DEFAULT_MAP_COLOR = 'black'
  var DEFAULT_MAP_STROKE = 'black'
  var DEFAULT_PATH_WIDTH = 1
  var M = d3.formatPrefix(",.0", 1e6)

  var rScale = d3.scaleSqrt()
    .range([0, 50])
    .domain([0, 133980469969])

  var lineScale = d3.scaleSqrt()
    .range([0.25, 5])
    .domain([0, 50000000000])

  var lineDashedScale = d3.scaleSqrt()
    .range([0.15, 3])
    .domain([0, 50000000000])

  var opacityScale = d3.scaleSqrt()
    .range([0.25, 1])
    .domain([0, 50000000000])

  var opacityDashedScale = d3.scaleSqrt()
    .range([0.125, 0.5])
    .domain([0, 50000000000])

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Initialize //////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 

  return { 
    run : function () {

      //////////////////// Set up and initiate containersxf ///////////////////////
      var sf = ipad_landscape ? 1.6 : 1

      var svg = chart.select("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)

      var g = svg.append("g")
        .attr('id', 'zoom-group')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")scale(" + sf + ")")

      map = g.append("g").attr("id", "map")
      bubbles = g.append("g").attr("class","bubbles")
      arcs = g.append("g").attr("class","arcs")
      all_arcs = g.append("g").attr("class","all_arcs")

      var svg_panel = d3.select('.countries-ranking-content').append('svg')
        .attr("width", '330px')
        .attr("height", '150px')

      var donor_rank = svg_panel.append("g")
        .attr("class",".donor-rank")
        .attr('transform', "translate(" + 0 + "," + 0 + ")")

      var recipient_rank = svg_panel.append("g")
        .attr("class",".recipient-rank")
        .attr('transform', "translate(" + 165 + "," + 0 + ")")

      loadData()

      ///////////////////////////////////////////////////////////////////////////
      ////////////////////////////// Generate data //////////////////////////////
      ///////////////////////////////////////////////////////////////////////////

      function loadData() {

        d3.queue()   // queue function loads all external data files asynchronously 
          .defer(d3.json, './data/custom.geo.json')
          .defer(d3.csv, './data/wn_country_PT.csv')  
          .defer(d3.csv, './data/all_country_PT.csv')  
          .defer(d3.csv, './data/all_country_pctPT.csv') 
          .defer(d3.csv, './data/countries_ranking.csv')
          .await(processData);   

      }

      function processData(error, geoJSON, csv, csv2, csv3, csv4) {
        
        if (error) throw error;

        $('#dimmer').dimmer('hide');

        connData = csv 
        densityData = csv2 
        densityPctData = csv3 
        countriesData = csv4

        world = geoJSON.features;  // store the path in variable for ease
        for (var i in connData) {    // for each geometry object
          for (var j in world) {  // for each row in the CSV
            if (world[j].properties.name == connData[i]['country']) {   // if they match
              for (var k in connData[i]) {   // for each column in the a row within the CSV
                world[j].properties[k] = (connData[i][k] != null ? Number(connData[i][k]) : 0)  // add each CSV column key/value to geometry object
              }
              break;  // stop looking through the CSV since we made our match
            } 
          }
        }

        menu()
        updateGlobalPanel()
        drawMap(world)
        drawCirclesMap('show_all')
        drawAllLinksMap(world)

        var countries = densityData.map(d=>d.country).filter(onlyUnique)
        var selectedPaths = countriesPaths.filter(d=>countries.indexOf(d.properties.name)!=-1)
        interactive(selectedPaths)
        interactive(d3.selectAll(".bubble")) 
        interactive(d3.selectAll('.bar'))

      }

      ///////////////////////////////////////////////////////////////////////////
      ////////////////////////// Buttons & Dropdowns ////////////////////////////
      ///////////////////////////////////////////////////////////////////////////
    
      // RESET
      reset = function() {
        resetVar()
        resetActions()
      }

      function resetVar() {
        newCategory = 'net'
        newYear = 'All'    
        isClicked = false
        countrySearched = false
        $('.dropdown').dropdown('restore defaults')
      }

      function resetActions() {
        undoMapActions()
        undoPanelActions()
        svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity)
        d3.selectAll(".countryLabel").style('display', 'none') // hide 'tooltip'
        d3.select('.all_arcs').attr('display', 'block')
        d3.select('.arcs').attr('display', 'none')
        drawAllLinksMap(world, 'show_all')
        drawCirclesMap('show_all')
      }

      // ZOOM
      zoomIn = function() {
        zoom.scaleBy(svg.transition().duration(750), 1.3)     
      }

      zoomOut = function() {
        zoom.scaleBy(svg.transition().duration(750), 0.7)     
      }

      // TOGGLE
      d3.select(".btn-net")
        .on("click", function(d) {
          newCategory = 'net'
          undoMapActions()
          drawCirclesMap('show_country')
          d3.select('.all_arcs').attr('display', 'block')
          d3.select('.arcs').attr('display', 'none')
          setTimeout(function(){
            drawAllLinksMap(world)
            doActions(newCountry)
          }, 250)
        })

      d3.select(".btn-source")
        .on("click", function(d) {
          newCategory = 'donor'
          undoMapActions()
          drawCirclesMap('show_country')
          d3.select('.all_arcs').attr('display', 'none')
          d3.select('.arcs').attr('display', 'block')
          setTimeout(function(){
            doActions(newCountry)
          }, 250)
        })

      d3.select(".btn-destination")
        .on("click", function(d) {
          newCategory = 'recipient'
          undoMapActions()
          drawCirclesMap('show_country')
          d3.select('.all_arcs').attr('display', 'none')
          d3.select('.arcs').attr('display', 'block')
          setTimeout(function(){
            doActions(newCountry)
          }, 250)
        })

      // DROPDOWN MENUS
      var isClicked = false
      var countrySearched = false
      function menu() {

        // 1: Country
        var countries = densityData.map(d=>d.country).filter(onlyUnique)
        countries.unshift("All Countries")
        d3.select(".dropdown-country .menu").selectAll("div")
            .data(countries)
          .enter().append("div")
            .attr('class', 'item')
            .attr("data-value", function (d) { return d })
            .text(function (d) { return d })
          .on("click", function(d) {
            isClicked = true
            countrySearched = true
            d3.selectAll(".countryLabel").style('display', 'none') // hide 'tooltip'
            if(d=='All Countries'){
              drawAllLinksMap(world, 'show_all')
              drawCirclesMap('show_all')
            } else {
              newCountry = d
              doActions(newCountry)
            }
          })

        // 2: Years
        var years = d3.range(1973,2014)
        years.unshift("All Years")
        d3.select(".dropdown-year .menu").selectAll("div")
            .data(years)
          .enter().append("div")
            .attr('class', 'item')
            .attr("data-value", function (d) { return d })
            .text(function (d) { return d })
          .on("click", function(d) {
            if(d=='All Years'){
              newYear = "All"
            } else {
              newYear = d
            }
            d3.selectAll(".countryLabel").style('display', 'none') // hide 'tooltip'
            if(countrySearched==true){
              drawCirclesMap('show_country')
              drawAllLinksMap(world, 'show_country')
              setTimeout(function(){
                doActions(newCountry)
              }, 250)
            } else {
              drawCirclesMap('show_all')
              drawAllLinksMap(world, 'show_all')
            }
          })

      }

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
        var translateX = -40
        var translateY = 150
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

      function drawCirclesMap(type) {

        if(type=='show_country'){
          data = densityData.filter(d=>d.category == newCategory & d.country==newCountry)
        } else {
          data = densityData.filter(d=>d.category == newCategory)
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
        circles = bubbles.selectAll("g.nodegroup").data(bubbleData, d=>d.country)

        var entered_circles = circles.enter().append("g")
          .attr('class', 'nodegroup')
          .attr('transform', d=>'translate(' + d.x + "," + d.y + ")")

        entered_circles.append("circle").attr('class', 'bubble')

        circles.merge(entered_circles).select('.bubble')         
          .attr('id', d=>'bubble' + d.country)
          .transition().duration(500) 
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

      ////////////////////////////////////////////////////////////////////////////////////
      //////////////////////////////////// Interactive map ///////////////////////////////
      //////////////////////////////////////////////////////////////////////////////////// 

      function interactive(obj) {

        obj
          .on("mousemove", function(d) {
            if(isClicked==false){
              doActions(d.country ? d.country : d.properties.name) 
            } 
          })
          .on("click", function(d) {
            isClicked == false ? isClicked = true : isClicked = false  
            countrySearched == false ? countrySearched = true : countrySearched = false  
            if(isClicked==true){
              doActions(d.country ? d.country : d.properties.name) 
            } else {
              $('.ui.search.dropdown.dropdown-country').dropdown('restore defaults')
              undoMapActions()
              undoPanelActions(d.country ? d.country : d.properties.name)
            }
          })
          .on("mouseout",  function(d) { 
            if(isClicked==false){
              d3.selectAll(".countryLabel").style('display', 'none') // hide 'tooltip'
              undoMapActions()
              updateGlobalPanel()
            }
          })

      }

      ////////////////////////////////////////////////////////////////////////////////////
      /////////////////////////////// Update panel and map ///////////////////////////////
      //////////////////////////////////////////////////////////////////////////////////// 

      function doActions(d) {

        newCountry = d // assign new country to global variable
        var attribute = newCategory + '_' + newCountry + '_' + newYear
        updateCountryPanel()

        ////////////////////////////////////// Menu //////////////////////////////////////
        if(countrySearched==true | isClicked==true){
          if(newCategory=='net'){
            d3.select('.ui.btn-net.basic.button').classed('active', true)
            d3.select('.ui.btn-source.basic.button').classed('active', false)
            d3.select('.ui.btn-destination.basic.button').classed('active', false)
          }
          if(newCategory=='donor'){
            d3.select('.ui.btn-net.basic.button').classed('active', false)
            d3.select('.ui.btn-source.basic.button').classed('active', true)
            d3.select('.ui.btn-destination.basic.button').classed('active', false)
          }
          if(newCategory=='recipient'){
            d3.select('.ui.btn-net.basic.button').classed('active', false)
            d3.select('.ui.btn-source.basic.button').classed('active', false)
            d3.select('.ui.btn-destination.basic.button').classed('active', true)
          }

          d3.select('.ui.btn-net.basic.button').style('opacity', 1)
          d3.select('.ui.btn-source.basic.button').style('opacity', 1)
          d3.select('.ui.btn-destination.basic.button').style('opacity', 1)
        }
        ////////////////////////////////////////////////////////////////////////////////////

        //////////////////////////////////////// Map ///////////////////////////////////////
        d3.select("#countryLabel" + newCountry).style('display', 'block') // update 'tooltip'
        updateMap(attribute) // Modify color density (in %)
        
        // PATHS : Individual donor/recipient country connectors (Only draw if there is a connection)
        if(newCategory!='net'){
          drawLinksMap(world, attribute) // Modify connector paths opacity on hover
        }

        // PATHS: All total amount country connectors
        if(all_arcs){
          all_arcs.selectAll('path.connector')
            .filter(function(d){ return d.sourceName!=newCountry & d.targetName!=newCountry })
            .attr('opacity', 0)

          all_arcs.selectAll('path.connector')
            .filter(d=> d.sourceName==newCountry | d.targetName==newCountry)
            .attr('opacity', 1)
        }

        // BUBBLES
        bubbles.selectAll('circle')
          .attr('stroke-opacity', d=>d.country == newCountry ? 0.6 : 0) 
          .attr('fill-opacity', d=>d.country == newCountry ? (newCategory=='net' ? 0.1 : 0.6) : 0) // Only show circle of hovered country
        ////////////////////////////////////////////////////////////////////////////////////

      }

      function updateGlobalPanel(){

        d3.select('.country-name').html('Global')

        var count_donor = d3.sum(densityData.filter(d=>d.category == 'donor'), d=>d['All'])
        var count_recipient = d3.sum(densityData.filter(d=>d.category == 'recipient'), d=>d['All'])
        var total = count_donor+count_recipient
  
        d3.select('.statistic.stats-sum > .value')
          .html("$ " + M(total))

        d3.select('.stats-perc').style('opacity', 0)
        d3.select('.country-ratio').style('opacity', 0)

        barChart(donor_rank, 'global_level','donor')
        barChart(recipient_rank, 'global_level', 'recipient')

      }

      function updateCountryPanel(){

        d3.select('.country-name').html(newCountry) // Country name

        var count_donor = densityData.find(d=>(d.country == newCountry) & (d.category == 'donor'))
        var count_recipient = densityData.find(d=>(d.country == newCountry) & (d.category == 'recipient'))
        var count_donor_value = count_donor ? +count_donor[newYear] : 0
        var count_recipient_value = count_recipient ? +count_recipient[newYear] : 0
        var total = count_donor_value+count_recipient_value

        // Total amount received and donated (update based on country and year selected)
        d3.select('.statistic.stats-sum > .value')
          .attr('id', newCategory)
          .html("$ " + M(total))

        // Within country: proportion of donors vs recipients (update based on country and year selected)
        var wn_country_perc = count_donor_value/total * 100
        $('#ratio').progress({percent: wn_country_perc}) 

        // Global density: proportion of donors vs recipients 
        var perc_donor = densityPctData.find(d=>(d.country == newCountry) & (d.category == 'donor')) 
        var perc_recipient = densityPctData.find(d=>(d.country == newCountry) & (d.category == 'recipient'))
        var perc_donor_value = perc_donor ? +perc_donor[newYear] : 0
        var perc_recipient_value = perc_recipient ? +perc_recipient[newYear] : 0

        d3.select('.stats-perc').style('opacity', 1)
        d3.select('.country-ratio').style('opacity', 1)

        d3.select('.statistic.perc_recipient > .value')
          .attr('id', newCategory)
          .html((Math.round(parseFloat(perc_recipient_value)*100)/100).toString() + " %") 

        d3.select('.statistic.perc_donor > .value')
          .attr('id', newCategory)
          .html((Math.round(parseFloat(perc_donor_value)*100)/100).toString() + " %")

        barChart(donor_rank, 'country_level', 'donor')
        barChart(recipient_rank, 'country_level','recipient')

      }

      function undoMapActions() {

        countriesPaths.attr('fill', DEFAULT_MAP_COLOR) // reset map color

        bubbles.selectAll('circle')
          .attr('stroke-opacity', 1)
          .attr('fill-opacity', newCategory=='net' ? 0.1 : 0.6) // show bubble chart again

        arcs.selectAll('path').remove() // remove all connector paths
        arcs.selectAll('path.line-dashed').interrupt() // stop all animations

        if(countrySearched==false){
          all_arcs.selectAll('path.connector').attr('opacity', function(d) { return opacityScale(d.value) })
        }
        
      }

      function undoPanelActions() {

        d3.select('.ui.btn-net.basic.button').style('opacity', 0)
        d3.select('.ui.btn-source.basic.button').style('opacity', 0)
        d3.select('.ui.btn-destination.basic.button').style('opacity', 0)
 
      }

      ///////////////////////////////////////////////////////////////////////////
      ///////////////////////////////// Bar chart ///////////////////////////////
      ///////////////////////////////////////////////////////////////////////////

      function barChart(obj, type, category) {

        var top_countries = topData(type, category)

        var xScale = d3.scaleLinear()
          .domain([0, 1])
          .range([0, 150])
          
        var yScale = d3.scaleBand()
          .domain(top_countries.map(d=>d.country))
          .range([0, 150])  
          .padding(0.1)  

        var rects = obj.selectAll('g').data(top_countries) 

        const entered_rects = rects.enter().append('g')

        entered_rects.merge(rects)
           .attr("transform", function(d) {
              return "translate(" + 0 + "," + yScale(d.country) + ")" 
           })

        rects.exit().remove()

        entered_rects.append('rect')
          .merge(rects.select("rect"))
          .attr('class', 'bar')
          .attr('id', function(d) { return "bar-" + category + '-' + d.country.replace(/ +/g, "") })
          .attr("fill", colors[category])
          .attr("height", yScale.bandwidth())
          .attr("width", function(d) { return xScale(d.perc) })

        // add the text to the label group showing country name
        entered_rects.append("text")
          .merge(rects.select("text"))
           .attr('class', 'rectLabel')
           .attr('id', function(d) { return "rectLabel-" + category + '-' + d.country.replace(/ +/g, "") })
           .attr("dx", d=>xScale(d.perc)+10)
           .attr("dy", yScale.bandwidth()/2)
           .attr('font-size', '8px')
           .attr('font-weight', 'bold')
           .attr('alignment-baseline', 'middle')
           .attr('fill', colors[category])
           .text(function(d) { return d.country })

        function topData(type, category) {

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


      }

    } 
  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Helper functions ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  function getTextBox(selection) {
    selection.each(function(d) {
      d.bbox = this.getBBox();
    });
  }

  function gcd (a, b) {
      return (b == 0) ? a : gcd (b, a%b);
  }

  function onlyUnique(value, index, self) { 
      return self.indexOf(value) === index;
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

}()