init()

function init() {

  d3.queue()   
    .defer(d3.json, './data/deathPercentages_byProvince_byTime.json')  
    .defer(d3.json, './data/VietnamWarTimeline.json')  
    .await(createChart);  
}

function createChart(error, deathJSON, timelineJSON) {

  timelineJSON_nodup = removeDuplicates(timelineJSON, 'Event') 

  var yourVlSpec1 = 

    {
      "config": {"view": {"width": 400, "height": 300}},
      "layer": [
        {
          "data": {
            "values": deathJSON
          },
          "mark": {"type": "bar", "size": 10},
          "encoding": {
            "color": {
              "type": "nominal",
              "field": "DEPLOYMENT_PROVINCE_1",
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
                "range": [
                  "#B2172A",
                  "#E3191C",
                  "#FD8D3B",
                  "#FED975",
                  "#31A353",
                  "#74C476",
                  "#9ECAE0",
                  "#2066AC",
                  "#BDBDBD"
                ]
              }
            },
            "x": {
              "type": "temporal",
              "field": "FATALITY_DATE",
              "timeUnit": "yearmonth",
              "title": ""
            },
            "y": {
              "type": "quantitative",
              "field": "count",
              "scale": {"domain": [0, 2400]},
              "sort": "ascending",
              "title": "Count of deaths"
            }
          },
          "height": 650,
          "width": 1300
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
                    "range": ["#000000", "#FFEBCC"]
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
              "height": 650,
              "width": 1300
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
              "height": 650,
              "width": 1300
            }
          ]
        }
      ],
      "resolve": {
        "scale": {"color": "independent", "y": "independent", "x": "shared"}
      },
      "$schema": "https://vega.github.io/schema/vega-lite/v2.4.3.json"
    }

  vegaEmbed("#stackedBarChart", yourVlSpec1);
  
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

