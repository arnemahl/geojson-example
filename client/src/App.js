import React, { Component, Fragment } from 'react';
import L from 'leaflet';
import './App.css';

import geojson from './geojson';
import union from '@turf/union';
import intersect from '@turf/intersect';

const layerStyle = {
  default: {
    weight: 2,
    color: '#3388fe',
    dashArray: '',
    fillOpacity: 0.5
  },
  selected: {
    weight: 2,
    color: 'coral',
    dashArray: '',
    fillOpacity: 0.5
  },
};

class App extends Component {

  felaySets = []

  state = {
    selectedSets: []
  }

  onSetClick = (felaySet) => (event) => {
    this.setState(({ selectedSets: prevSelection }) => {
      const nextSelection = prevSelection.includes(felaySet)
        ? prevSelection.filter(remaining => remaining !== felaySet)
        : prevSelection.concat([ felaySet ]);

      return { selectedSets: nextSelection };
    });
  }

  componentDidMount() {
    const mymap = L.map('map').setView([51.508, -0.118], 14);

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
      maxZoom: 18,
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      id: 'mapbox.streets'
    }).addTo(mymap);

    L.marker([51.5, -0.09]).addTo(mymap)
      .bindPopup("<b>Hello world!</b><br />I am a popup.").openPopup();

    L.circle([51.508, -0.11], 500, {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.5
    }).addTo(mymap).bindPopup("I am a circle.");

    L.polygon([
      [51.509, -0.08],
      [51.503, -0.06],
      [51.51, -0.047]
    ]).addTo(mymap).bindPopup("I am a polygon.");

    const popup = L.popup();

    function onMapClick(e) {
      popup
      .setLatLng(e.latlng)
      .setContent("You clicked the map at " + e.latlng.toString())
      .openOn(mymap);
    }

    // mymap.on('click', onMapClick);
    this.map = mymap;
    this.renderGeoJson();
  }

  renderGeoJson() {
    this.felaySets.forEach(({ layer }) => this.map.removeLayer(layer));
    this.felaySets = [];

    L
      .geoJSON(geojson, {
        onEachFeature: (feature, layer) => {
          layer.setStyle(layerStyle.default);

          const felaySet = {
            feature,
            layer,
          };

          layer.on('click', this.onSetClick(felaySet));
          this.felaySets.push(felaySet);
        }
      })
      .addTo(this.map)
    ;
  }

  combineAndReplaceSelection(combineFn) {
    const selection = this.state.selectedSets.map(felaySet => felaySet.feature);

    geojson.features = geojson.features
      .filter(remaining => !selection.includes(remaining))
      .concat(combineFn(...selection));

    this.setState({ selectedSets: [] });
    this.renderGeoJson();
  }

  performUnion = () => {
    this.combineAndReplaceSelection(union);
  }

  performIntersect = () => {
    this.combineAndReplaceSelection(intersect);
  }

  render() {
    const { selectedSets } = this.state;

    this.felaySets.forEach(felaySet => {
      if (selectedSets.includes(felaySet)) {
        felaySet.layer.setStyle(layerStyle.selected);
      } else {
        felaySet.layer.setStyle(layerStyle.default);
      }
    });

    return (
      <Fragment>
        <div id="map" style={{width: '100vw', height: '80vh'}} />
        <div className="geojson-controls">
          <button
            disabled={selectedSets.length !== 2}
            title={selectedSets.length !== 2 ? 'Select exactly two polygons to perform union' : ''}
            onClick={this.performUnion}
          >
            Union
          </button>
          <button
            disabled={selectedSets.length !== 2}
            title={selectedSets.length !== 2 ? 'Select exactly two polygons to perform intersect' : ''}
            onClick={this.performIntersect}
          >
            Intersect
          </button>
        </div>
      </Fragment>
    );
  }
}

export default App;
