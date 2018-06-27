import Pockito, { Listenable } from 'pockito';
import firebase from 'firebase';

import union from '@turf/union';
import intersect from '@turf/intersect';

import { operationStore } from './operationStore';


/***********/
/*  Store  */
/***********/

const { undefOr, arrayOf, object } = Pockito.Validators;

const store = new Listenable({
  initialState: {
    geojson: void 0,
    selectedSets: [],
  },
  validator: {
    geojson: undefOr(object),
    selectedSets: arrayOf(object),
  },
});

export { store as geojsonStore };


/*********************/
/*  Action creators  */
/*********************/

const dbRef = firebase
  .database()
  .ref('projects')
  .child('sample-project');
const data = {};

export function syncGeojson() {
  dbRef.child('initialGeoJson').once('value', receiveInitialState);
  dbRef.child('operations').on('value', receiveOperations);
}
export function unsyncGeojson() {
  dbRef.child('operations').off('value', receiveOperations);
}

function receiveInitialState(snap) {
  data.initialGeoJson = snap.val();
  updateGeoJSON();
}
function receiveOperations(snap) {
  data.operations = snap.val() || [];
  updateGeoJSON();
  operationStore.set({
    lastOperation: data.operations[0]
  });
}
function setGeojson(geojson) {
  if (store.geojson === geojson) {
    return;
  }

  store.set({
    geojson,
    selectedSets: [],
  });
}
function updateGeoJSON() {
  const { initialGeoJson, operations } = data;

  if (!initialGeoJson) {
    return;
  }

  if (!operations) {
    setGeojson(initialGeoJson);
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

  setGeojson(operations.reduce(applyOperation, initialGeoJson));
}
