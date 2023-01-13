import { useState } from "react";
import { ComposableMap, Geographies, Geography, Marker, ProjectionConfig } from "react-simple-maps";
import MediterraneanJSON from "../maps/mediterranean.json";
import PredictionsJSON from "./things.json"

// defines the geojson map config
const geojsonFiles = {
  "Mediterranean": {
    file: MediterraneanJSON,
    projectionConfig: {
    rotate: [-15, -33, 0],
    scale: 300,
    }
  },
}
// const geojsonFiles = {
//   "Mediterranean": {
//     file: Mediterranean,
//     projectionConfig: {
//     rotate: [-140, -33, 0],
//     scale: 300,
//     }
//   },
// }




// scale data to vals between 0 and 1
const results = PredictionsJSON.map(p => p.result);
const min = Math.min(...results); 
const max = Math.max(...results);
const scaleRatio = max - min;
const scaledPredictions = PredictionsJSON.map(p => ({
  ...p,
  result: (p.result - min) / scaleRatio,
})); 

// returns a color based on scaled val
function getColor(value: number) {
  var hue = ((1 - value) * 120).toString(10);
  return ["hsl(", hue, ",100%,50%)"].join("");
}

console.log(getColor(0.1))

// color theme for geojson map
const theme = {
    radius: {
      small: .2,
    },
    pointColor: "red",
    color: {
      background: "#00FFFFF"
    },
    markerOffset: 2.75,
    locationTextColor: "red",
}


const Map = () => {
  const [day] = useState(1)
  const locations = scaledPredictions.filter((val) => val.day === day - 1);

  return (
    <>
      {/* <div style={{ paddingLeft: "0.5em" }}>{dateFromDay(2011, day).toLocaleDateString(undefined, {month: "short", day: "numeric"})}</div> */}
      {/* <input type="range" min="1" max="366" value={day} onChange={(e) => setDay(parseInt(e.target.value))} style={{width: "35vw"}} /> */}
      <ComposableMap
        style={{display: 'block', marginLeft: 'auto', marginRight: 'auto', width: '100%'}}
        projection="geoAzimuthalEqualArea"
        projectionConfig={geojsonFiles["Mediterranean"].projectionConfig as ProjectionConfig}
        width={200}
        height={140}
      >
        <Geographies geography={geojsonFiles["Mediterranean"].file}>
          {({ geographies }) =>
            geographies.map(geo =>
              <Geography
                key={geo.rsmKey}
                geography={geo}
                tabIndex={-1}
                fill={"lightblue"}
                stroke={"gray"}
                strokeWidth={"0"}
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            )
          }
        </Geographies>
        
        {/* creates a dot at given lat and lon */}
        {locations.map(({lat, lon, result }) => (
          <Marker coordinates={[lon, lat]}>
            <circle r={theme.radius.small} fill={getColor(result)} stroke={theme.color.background} strokeWidth={1} />
            <text
              textAnchor="middle"
              y={theme.markerOffset}
              fill={getColor(result)}
              fontSize={"0.1em"}
            >
            </text>
          </Marker>
        ))}
      </ComposableMap>
    </>
  )
}

export default Map;
