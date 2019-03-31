var width = w * 0.8
var height = screen.width < 420 ? h * 0.85 : (screen.width <= 1024 ? h * 0.9 : h * 0.7) 
var barWidth = screen.width < 420 ? 7 : (screen.width <= 1024 ? 7 : 10) 
var legendOrient = screen.width < 420 ? 'right' : (screen.width <= 1024 ? 'right' : 'right') 
var legendDir = screen.width < 420 ? 'vertical' : (screen.width <= 1024 ? 'vertical' : 'vertical') 

renderStacked()

function renderStacked() {

  d3.queue()   
    .defer(d3.json, './data/deathPercentages_byProvince_byTime.json')  
    .defer(d3.json, './data/VietnamWarTimeline.json')  
    .await(createChart);  
}

function createChart(error, deathJSON, timelineJSON) {

  timelineJSON_nodup = removeDuplicates(timelineJSON, 'Event') 

  var chartDesktop = 

    {
      "config": {
        "view": {"stroke": "transparent"}
      },
      "layer": [
        {
          "data": {
            "values": deathJSON
          },
          "title": "U.S. Army Infantry Casualties from March 1965 to March 1973",
          "mark": {"type": "bar", "size": barWidth},
          "encoding": {
            "color": {
              "legend": {
                "orient": legendOrient,
                "direction": legendDir
              },
              "type": "nominal",
              "field": "DEPLOYMENT PROVINCE",
              "scale": {
                "domain": [
                  "Quang Tri",
                  "Thua Thien - Hue",
                  "Quang Nam",
                  "Quang Ngai",
                  "Kon Tum",
                  "Binh Dinh",
                  "Binh Duong",
                  "Tay Ninh",
                  "Other provinces"
                ],
                "range": ['#fff5f0','#fee0d2','#fcbba1','#fc9272','#fb6a4a','#ef3b2c','#cb181d','#a50f15','#67000d']
              }
            },
            "x" : {
              "type": "temporal",
              "field": "FATALITY_DATE",
              "timeUnit": "yearmonth",
              "title": "",
              "axis": {
                "labelColor":"black",
                "labelFontSize":12,
                "grid": false
              }
            },
            "y" : {
              "type": "quantitative",
              "field": "count",
              "scale": {"domain": [0, 2400]},
              "sort": "ascending",
              "axis": {
                "labelColor":"black",
                "labelFontSize":12,
                "title": "Count of deaths",
                "titleFontSize":16,
                "grid": false
              }
            }
          },
          "height": height,
          "width": width
        },
        {
          "layer": [
            {
              "data": {
                "values": timelineJSON
              },
              "mark": {"type": "tick", "dx": 0, "dy": 0, 'thickness': 10},
              "encoding": {
                "color": {
                  "type": "nominal",
                  "field": "plot",
                  "legend": null,
                  "scale": {
                    "domain": ["Yes", "No"],
                    "range": ["#000000", "white"]
                  }
                },
                "x": {
                  "type": "temporal",
                  "axis": null,
                  "field": "FATALITY_DATE",
                  "timeUnit": "yearmonth",
                  "title": null
                },
                "y": {
                  "type": "quantitative",
                  "axis": null,
                  "field": "y",
                  "title": null
                }
              },
                "height": height,
                "width": width
            },
            {
              "data": {
                "values": timelineJSON_nodup
              },
              "mark": {
                "type": "text",
                "align": "left",
                "angle": 90,
                "baseline": "middle",
                "dx": 10,
                "dy": 0
              },
              "encoding": {
                "text": {"type": "ordinal", "field": "Event"},
                "x": {
                  "type": "temporal",
                  "axis": null,
                  "field": "FATALITY_DATE",
                  "timeUnit": "yearmonth",
                  "title": null
                },
                "y": {
                  "type": "quantitative",
                  "axis": null,
                  "field": "y",
                  "title": null
                }
              },
                "height": height,
                "width": width
            }
          ]
        }
      ],
      "resolve": {
        "scale": {"color": "independent", "y": "independent", "x": "shared"}
      },
      "$schema": "https://vega.github.io/schema/vega-lite/v2.4.3.json"
    }

  var chartMobile = 

    {
      "config": {
        "view": {"stroke": "transparent"}
      },
      "layer": [
        {
          "data": {
            "values": deathJSON
          },
          "title": "U.S. Army Infantry Casualties from March 1965 to March 1973",
          "mark": {"type": "bar", "size": barWidth},
          "encoding": {
            "color": {
              "legend": {
                "orient": legendOrient,
                "direction": legendDir
              },
              "type": "nominal",
              "field": "DEPLOYMENT PROVINCE",
              "scale": {
                "domain": [
                  "Quang Tri",
                  "Thua Thien - Hue",
                  "Quang Nam",
                  "Quang Ngai",
                  "Kon Tum",
                  "Binh Dinh",
                  "Binh Duong",
                  "Tay Ninh",
                  "Other provinces"
                ],
                "range": ['#fff5f0','#fee0d2','#fcbba1','#fc9272','#fb6a4a','#ef3b2c','#cb181d','#a50f15','#67000d']
              }
            },
            "y" : {
              "type": "temporal",
              "field": "FATALITY_DATE",
              "timeUnit": "yearmonth",
              "title": "",
              "axis": {
                "labelColor":"black",
                "labelFontSize":12,
                "grid": false
              }
            },
            "x" : {
              "type": "quantitative",
              "field": "count",
              "scale": {"domain": [0, 2400]},
              "sort": "ascending",
              "axis": {
                "labelColor":"black",
                "labelFontSize":12,
                "title": "Count of deaths",
                "titleFontSize":16,
                "grid": false
              }
            }
          },
          "height": height,
          "width": width
        },
        {
          "layer": [
            {
              "data": {
                "values": timelineJSON
              },
              "mark": {"type": "tick", "dx": 0, "dy": 0, 'thickness': 10},
              "encoding": {
                "color": {
                  "type": "nominal",
                  "field": "plot",
                  "legend": null,
                  "scale": {
                    "domain": ["Yes", "No"],
                    "range": ["#000000", "white"]
                  }
                },
                "y": {
                  "type": "temporal",
                  "axis": null,
                  "field": "FATALITY_DATE",
                  "timeUnit": "yearmonth",
                  "title": null
                },
                "x": {
                  "type": "quantitative",
                  "axis": null,
                  "field": "y",
                  "title": null
                }
              },
                "height": height,
                "width": width
            },
            {
              "data": {
                "values": timelineJSON_nodup
              },
              "mark": {
                "type": "text",
                "align": "left",
                "angle": 0,
                "baseline": "middle",
                "dx": -140,
                "dy": 0
              },
              "encoding": {
                "text": {"type": "ordinal", "field": "Event"},
                "y": {
                  "type": "temporal",
                  "axis": null,
                  "field": "FATALITY_DATE",
                  "timeUnit": "yearmonth",
                  "title": null
                },
                "x": {
                  "type": "quantitative",
                  "axis": null,
                  "field": "y",
                  "title": null
                }
              },
                "height": height,
                "width": width
            }
          ]
        }
      ],
      "resolve": {
        "scale": {"color": "independent", "y": "independent", "x": "shared"}
      },
      "$schema": "https://vega.github.io/schema/vega-lite/v2.4.3.json"
    }

  var barChart = screen.width < 420 ? chartMobile : (screen.width <= 1024 ? chartMobile : chartDesktop) 
  vegaEmbed("#stackedBarChart", barChart);
  
}


function removeDuplicates(originalArray, prop) {
  var newArray = [];
  var lookupObject  = {};

  for(var i in originalArray) {
    lookupObject[originalArray[i][prop]] = originalArray[i];
  }

  for(i in lookupObject) {
    newArray.push(lookupObject[i])
  }
  return newArray;
 }

 function appendCol(originalArray) {
  for(var i in originalArray) {
    originalArray[i]['y'] = 3000
  }
  return originalArray
 }

