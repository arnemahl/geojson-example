import React, { Component, Fragment } from 'react';

import { geojsonStore } from 'geojsonStore';
import {
  operationStore,
  performUnion,
  performIntersect,
  revertLastOperation,
} from 'operationStore';
import { REQ } from 'util/xhr';

class App extends Component {

  componentDidMount() {
    geojsonStore.addListener(this.onChange);
    operationStore.addListener(this.onChange);
  }
  componentWillUnmount() {
    geojsonStore.removeListener(this.onChange);
    operationStore.removeListener(this.onChange);
  }

  onChange = () => {
    this.forceUpdate();
  }

  render() {
    const { selectedSets } = geojsonStore;
    const { lastOperation, addOperationAsync, removeOperationAsync } = operationStore;

    const reqPending = addOperationAsync.req === REQ.PENDING;

    return (
      <Fragment>
        <div className="geojson-controls">
          <button
            disabled={reqPending || (selectedSets.length !== 2)}
            title={selectedSets.length !== 2 ? 'Select exactly two polygons to perform union' : ''}
            onClick={performUnion}
          >
            Union
          </button>
          <button
            disabled={reqPending || (selectedSets.length !== 2)}
            title={selectedSets.length !== 2 ? 'Select exactly two polygons to perform intersect' : ''}
            onClick={performIntersect}
          >
            Intersect
          </button>
          <button
            disabled={reqPending || !lastOperation}
            title={!lastOperation ? 'No operations to revert' : `Revert last operation (${lastOperation.name})`}
            onClick={revertLastOperation}
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
