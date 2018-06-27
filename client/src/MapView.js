import React from 'react';
import L from 'leaflet';
import './MapView.css';

import {
  geojsonStore,
  syncGeojson,
  unsyncGeojson,
} from 'geojsonStore';

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

export default class MapView extends React.Component {

  felaySets = []

  onSetClick = (felaySet) => (event) => {
    const { selectedSets: prevSelection } = geojsonStore;
    const nextSelection = prevSelection.includes(felaySet)
      ? prevSelection.filter(remaining => remaining !== felaySet)
      : prevSelection.concat([ felaySet ]);

    geojsonStore.set({ selectedSets: nextSelection });
  }

  initializeMap() {
    const mymap = L.map('map').setView([51.508, -0.118], 14);

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
      maxZoom: 18,
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      id: 'mapbox.streets'
    }).addTo(mymap);

    this.map = mymap;
  }

  componentDidMount() {
    this.initializeMap();
    syncGeojson();

    geojsonStore.addListener(this.renderGeoJson, ['geojson']);
    geojsonStore.addListener(this.renderNormally, ['selectedSets']);
  }
  componentWillUnmount() {
    unsyncGeojson();

    geojsonStore.removeListener(this.renderGeoJson, ['geojson']);
    geojsonStore.removeListener(this.renderNormally, ['selectedSets']);
  }

  renderGeoJson = () => {
    this.felaySets.forEach(({ layer }) => this.map.removeLayer(layer));
    this.felaySets = [];

    L
      .geoJSON(geojsonStore.geojson, {
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

  renderNormally = () => {
    this.forceUpdate();
  }

  render() {
    const { selectedSets } = geojsonStore;

    this.felaySets.forEach(felaySet => {
      if (selectedSets.includes(felaySet)) {
        felaySet.layer.setStyle(layerStyle.selected);
      } else {
        felaySet.layer.setStyle(layerStyle.default);
      }
    });

    return <div id="map" style={{width: '100vw', height: '80vh'}} />;
  }
}
