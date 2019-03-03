const {MapboxLayer, ArcLayer, ScatterplotLayer} = deck;
var arcGeoJSON = {"type": "FeatureCollection", "features": []}
var stopsLayer
var arcsLayer

const SOURCE_COLOR = [166, 3, 3];
const TARGET_COLOR = [35, 181, 184];
const RADIUS_SCALE = d3.scaleSqrt().domain([1, 50000]).range([10, 100]);
const WIDTH_SCALE = d3.scaleSqrt().domain([0, 50000]).range([0, 10]);

function renderLayers({arcs, stops}) {
  console.log(arcs, stops)
  stopsLayer = new MapboxLayer({
    type: ScatterplotLayer,
    id: 'ODpoints',
    data: stops,
    opacity: 1,
    pickable: true,
    // onHover: this._onHover,
    getRadius: d => (d.total > 500000 ? 100: RADIUS_SCALE(d.total)),
    getFillColor: d => (d.net > 0 ? TARGET_COLOR : SOURCE_COLOR)
  });

  arcsLayer = new MapboxLayer({
    type: ArcBrushingLayer,
    id: 'arcs',
    data: arcs,
    brushRadius: 100,
    getStrokeWidth: d => WIDTH_SCALE(d.value),
    opacity: 1,
    getSourcePosition: d => d.source,
    getTargetPosition: d => d.target,
    getSourceColor: SOURCE_COLOR,
    getTargetColor: TARGET_COLOR
  });

  map.setLayoutProperty('viz', 'visibility', 'none')
  map.addLayer(stopsLayer, 'waterway-label');
  map.addLayer(arcsLayer);

  map.on('mousemove', ({point}) => {
    if (arcsLayer) {
      arcsLayer.setProps({mousePosition: [point.x, point.y]});
    }
  });

}

function setArcsData(data) {

  d3.csv("./data/bus_" + "46009" + ".csv", function(csv) {
    var oneStop = csv.map((d,i) => {
      return {
        value: +d.TOTAL_TRIPS,
        BusStopCode: +d.BusStopCode,
        type: d.type,
        description: d.Description,
        lat: +d.Latitude,
        lon: +d.Longitude
      }
    })

    dependents = d3.nest()
      .key(d=>d.BusStopCode)
      .entries(oneStop)

    dependents.forEach((d,i)=>{
      d.total = d3.sum(d.values, x=>x.value)
      d.category = d.values[0].type == 'Bus Interchange' ?  "Bus Interchange" : ( d.values[1] ? "" : (d.values[0].type == 'origin' ? "Only departures" : "Only arrivals") )
    })

    var flows = []
    oneStop.map((d,i) => {
      flows.push([d.BusStopCode, d.type=='origin' ? d.value : -d.value])
    })
    flows = flows.reduce(function(prev,curr){prev[curr[0]]=curr[1];return prev;},{})

    var coordinates = []
    oneStop.map((d,i) => {
      coordinates.push([d.lon, d.lat])
    })
  
    arcGeoJSON.features = [{
      type: "Feature",
      geometry: {
        type: "MultiPolygon",
        coordinates: coordinates
      },
      properties: {
        name: 46009,
        flows: flows,
        centroid: [103.786, 1.43763]
      }
    }]

    oneStop.map((d,i) => {
      var name = d.BusStopCode
      arcGeoJSON.features.push({
        type: "Feature",
        geometry: {
          type: "MultiPolygon",
          coordinates: [103.786, 1.43763]
        },
        properties: {
          name: name,
          flows: Object.assign({name : d.type=='origin' ? d.value : -d.value}),
          centroid: [d.lon, d.lat]
        }
      })
    })
     console.log(arcGeoJSON)

    const arcs = [];
    const stops = [];
    const pairs = {};

    arcGeoJSON.features.forEach((stop, i) => {
      const {flows, centroid: targetCentroid} = stop.properties;
      const value = {gain: 0, loss: 0};

      Object.keys(flows).forEach(toId => {

        value[flows[toId] > 0 ? 'gain' : 'loss'] += flows[toId];
 
        const pairKey = i < toId ? `${i}-${toId}` : `${toId}-${i}`;
        const sourceCentroid = arcGeoJSON.features[0].properties.centroid;
        const gain = Math.sign(flows[toId]);

        // eliminate duplicates arcs
        if (pairs[pairKey]) {
          return;
        }

        pairs[pairKey] = true;

        arcs.push({
          target: gain > 0 ? targetCentroid : sourceCentroid,
          source: gain > 0 ? sourceCentroid : targetCentroid,
          value: Math.abs(flows[toId])
        });
      });

      // add point at arc target

      stops.push({
        ...value,
        position: targetCentroid,
        net: value.gain + value.loss,
        total: value.gain - value.loss,
        name: stop.properties.name
      });
    });

    // sort counties by radius large -> small
    stops.sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
    
    renderLayers({arcs, stops});
  })
}

class ArcBrushingLayer extends ArcLayer {
  getShaders() {
    // use customized shaders
    return Object.assign({}, super.getShaders(), {
      inject: {
        'vs:#decl': `
uniform vec2 mousePosition;
uniform float brushRadius;
        `,
        'vs:#main-end': `
float brushRadiusPixels = project_scale(brushRadius);

vec2 sourcePosition = project_position(instancePositions.xy);
bool isSourceInBrush = distance(sourcePosition, mousePosition) <= brushRadiusPixels;

vec2 targetPosition = project_position(instancePositions.zw);
bool isTargetInBrush = distance(targetPosition, mousePosition) <= brushRadiusPixels;

if (!isSourceInBrush && !isTargetInBrush) {
vColor.a = 0.0;
}
        `,
        'fs:#main-start': `
if (vColor.a == 0.0) discard;
        `
      }
    });
  }

  draw(opts) {
    const {brushRadius = 1e6, mousePosition} = this.props;
    // add uniforms
    const uniforms = Object.assign({}, opts.uniforms, {
      brushRadius: brushRadius,
      mousePosition: mousePosition ?
        this.projectPosition(this.unproject(mousePosition)).slice(0, 2) : [0, 0]
    });
    super.draw(Object.assign({}, opts, {uniforms}));
  }
}