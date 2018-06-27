import Pockito, { Listenable } from 'pockito';
import xhr, { REQ } from 'util/xhr';

import { geojsonStore } from './geojsonStore';


/***********/
/*  Store  */
/***********/

const { oneOf, undefOr, object } = Pockito.Validators;

const store = new Listenable({
  initialState: {
    addOperationAsync: {
      req: REQ.INIT,
    },
    removeOperationAsync: {
      req: REQ.INIT,
    },
    lastOperation: void 0,
  },
  validator: {
    addOperationAsync: {
      validator: oneOf(Object.values(REQ)),
    },
    removeOperationAsync: {
      validator: oneOf(Object.values(REQ)),
    },
    lastOperation: undefOr(object),
  },
});


/*********************/
/*  Action creators  */
/*********************/

export { store as operationStore };

function performOperation(name) {
  const selection = geojsonStore.selectedSets.map(felaySet => geojsonStore.geojson.features.indexOf(felaySet.feature))

  store.set({
    selectedSets: [],
    addOperationAsync: { req: REQ.PENDING },
  });

  xhr
    .post(`https://us-central1-geojson-arne.cloudfunctions.net/addOperation?name=${name}&selection=${selection.join(',')}`)
    .then(
      () => {
        store.set({
          addOperationAsync: { req: REQ.SUCCESS }
        });
      },
      () => {
        store.set({
          addOperationAsync: { req: REQ.ERROR }
        });
      }
    );
}

export function performUnion() {
  performOperation('union');
}

export function performIntersect() {
  performOperation('intersect');
}

export function revertLastOperation(name) {
  store.set({
    removeOperationAsync: { req: REQ.PENDING },
  });

  xhr
    .post(`https://us-central1-geojson-arne.cloudfunctions.net/removeLastOperation`)
    .then(
      () => {
        store.set({
          removeOperationAsync: { req: REQ.SUCCESS }
        });
      },
      () => {
        store.set({
          removeOperationAsync: { req: REQ.ERROR }
        });
      }
    );
}
