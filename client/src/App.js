import React, { Component, Fragment } from 'react';
import L from 'leaflet';
import './App.css';

import union from '@turf/union';
import intersect from '@turf/intersect';

import firebase from 'firebase';
import xhr, { REQ } from 'util/xhr';

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
    selectedSets: [],
    lastOperation: void 0,
    addOperationAsync: {
      req: REQ.INIT,
    },
    removeOperationAsync: {
      req: REQ.INIT,
    },
  }

  onSetClick = (felaySet) => (event) => {
    this.setState(({ selectedSets: prevSelection }) => {
      const nextSelection = prevSelection.includes(felaySet)
        ? prevSelection.filter(remaining => remaining !== felaySet)
        : prevSelection.concat([ felaySet ]);

      return { selectedSets: nextSelection };
    });
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

    this.dbRef = firebase
      .database()
      .ref('projects')
      .child('sample-project');

    this.dbRef.child('initialGeoJson').once('value', this.receiveInitialState);
    this.dbRef.child('operations').on('value', this.receiveOperations);

    this.renderGeoJson();
  }

  componentWillUnmount() {
    this.dbRef.child('operations').off('value', this.receiveOperations);
  }

  db = {} // Synced content from DB
  receiveInitialState = (snap) => {
    this.db.initialGeoJson = snap.val();
    this.updateGeoJSON();
  }
  receiveOperations = (snap) => {
    this.db.operations = snap.val() || [];
    this.updateGeoJSON();
    this.setState({
      lastOperation: this.db.operations[0]
    });
  }

  updateGeoJSON() {
    const { initialGeoJson, operations } = this.db;

    if (!initialGeoJson) {
      return;
    }

    if (!operations) {
      this.geojson = initialGeoJson;
      this.renderGeoJson();
      return;
    }

    function applyOperation(geojson, operation) {
      const selection = geojson.features.filter((_, index) => operation.selection.includes(index));
      const combineFn = { union, intersect }[operation.name];

      const arrNotNull = (val) => val === null ? [] : val;

      return {
        ...geojson,
        features: geojson.features
          .filter(remaining => !selection.includes(remaining))
          .concat(arrNotNull(combineFn(...selection))),
      };
    }

    this.geojson = operations.reduce(applyOperation, initialGeoJson);
    this.renderGeoJson();
  }

  renderGeoJson() {
    this.setState({ selectedSets: [] });
    this.felaySets.forEach(({ layer }) => this.map.removeLayer(layer));
    this.felaySets = [];

    L
      .geoJSON(this.geojson, {
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

  performOperation(name) {
    const selection = this.state.selectedSets.map(felaySet => this.geojson.features.indexOf(felaySet.feature))

    this.setState({
      selectedSets: [],
      addOperationAsync: { req: REQ.PENDING },
    });

    xhr
      .post(`https://us-central1-geojson-arne.cloudfunctions.net/addOperation?name=${name}&selection=${selection.join(',')}`)
      .then(
        () => {
          this.setState({
            addOperationAsync: { req: REQ.SUCCESS }
          });
        },
        () => {
          this.setState({
            addOperationAsync: { req: REQ.ERROR }
          });
        }
      );
  }

  performUnion = () => {
    this.performOperation('union');
  }

  performIntersect = () => {
    this.performOperation('intersect');
  }

  revertLastOperation = (name) => {
    this.setState({
      removeOperationAsync: { req: REQ.PENDING },
    });

    xhr
      .post(`https://us-central1-geojson-arne.cloudfunctions.net/removeLastOperation`)
      .then(
        () => {
          this.setState({
            removeOperationAsync: { req: REQ.SUCCESS }
          });
        },
        () => {
          this.setState({
            removeOperationAsync: { req: REQ.ERROR }
          });
        }
      );
  }

  render() {
    const { selectedSets, lastOperation, addOperationAsync, removeOperationAsync } = this.state;

    this.felaySets.forEach(felaySet => {
      if (selectedSets.includes(felaySet)) {
        felaySet.layer.setStyle(layerStyle.selected);
      } else {
        felaySet.layer.setStyle(layerStyle.default);
      }
    });

    const reqPending = addOperationAsync.req === REQ.PENDING;

    return (
      <Fragment>
        <div id="map" style={{width: '100vw', height: '80vh'}} />
        <div className="geojson-controls">
          <button
            disabled={reqPending || (selectedSets.length !== 2)}
            title={selectedSets.length !== 2 ? 'Select exactly two polygons to perform union' : ''}
            onClick={this.performUnion}
          >
            Union
          </button>
          <button
            disabled={reqPending || (selectedSets.length !== 2)}
            title={selectedSets.length !== 2 ? 'Select exactly two polygons to perform intersect' : ''}
            onClick={this.performIntersect}
          >
            Intersect
          </button>
          <button
            disabled={reqPending || !lastOperation}
            title={!lastOperation ? 'No operations to revert' : `Revert last operation (${lastOperation.name})`}
            onClick={this.revertLastOperation}
          >
            Revert operation
          </button>
          <div>
            {{
              [REQ.INIT]: '',
              [REQ.PENDING]: 'Perform operation: pending',
              [REQ.ERROR]: 'Perform operation: error',
              [REQ.SUCCESS]: 'Perform operation: success',
            }[addOperationAsync.req]}
          </div>
          <div>
            {{
              [REQ.INIT]: '',
              [REQ.PENDING]: 'Revert operation: pending',
              [REQ.ERROR]: 'Revert operation: error',
              [REQ.SUCCESS]: 'Revert operation: success',
            }[removeOperationAsync.req]}
          </div>
        </div>
      </Fragment>
    );
  }
}

export default App;
