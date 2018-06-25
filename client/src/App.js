import React, { Component } from 'react';
import L from 'leaflet';
import './App.css';

import geojson from './geojson';

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
    if (event.shiftKey) {
      this.setState(state => {
        selectedSets: [
          felaySet,
          ...state.felaySet
        ]
      });
    } else {
      this.setState({ selectedSets: [felaySet] });
    }
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
      .addTo(mymap)
    ;

    window.map = mymap;
  }

  showSelection() {
  }

  render() {
    this.felaySets.forEach(felaySet => {
      if (this.state.selectedSets.includes(felaySet)) {
        felaySet.layer.setStyle(layerStyle.selected);
      } else {
        felaySet.layer.setStyle(layerStyle.default);
      }
    });

    return (
      <div id="map" style={{width: '100vw', height: '100vh'}} />
    );
  }
}

export default App;
