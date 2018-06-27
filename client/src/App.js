import React, { Fragment } from 'react';
import MapView from './MapView';
import OperationPanel from './OperationPanel';

export default class App extends React.Component {

  render() {
    return (
      <Fragment>
        <MapView />
        <OperationPanel />
      </Fragment>
    );
  }
}
