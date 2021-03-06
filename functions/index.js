const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

const union = require('@turf/union').default;
const intersect = require('@turf/intersect').default;

admin.initializeApp();

function applyOperation(geojson, operation) {
  const selection = geojson.features.filter((_, index) => operation.selection.includes(index));
  const combineFn = { union, intersect }[operation.name];

  const arrNotNull = (val) => val === null ? [] : val;

  return Object.assign({}, geojson, {
    features: geojson.features
      .filter(remaining => !selection.includes(remaining))
      .concat(arrNotNull(combineFn(selection[0], selection[1])))
  });
}

function isValid(geojson) {
  return true; // I don't know how to validate GeoJSON
}

// Based on example:
// https://firebase.google.com/docs/functions/get-started#add_the_addmessage_functions
exports.addOperation = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    // We only have this one project for now, but that could change.
    const projectName = 'sample-project';

    const projectRef =
      admin
        .database()
        .ref('projects')
        .child(projectName)
    ;

    // If we add more data to projects we might want to only fetch initialGeoJson and operations
    // here, and not anything extra. That must be done in two operations, though.
    projectRef.once('value', snap => {
      const project = snap.val();

      if (!project) {
        res.status(404).json({ error: `Not Found: The project "${projectName}" does not exist.` });
        return;
      }

      const { initialGeoJson, operations = [] } = project;

      const currentGeoJson = operations.reduce(applyOperation, initialGeoJson);

      const nextOperation = {
        name: req.query.name,
        selection: (req.query.selection || '').split(',').map(Number),
      };

      if (nextOperation.selection.length !== 2) {
        res.status(400).json({ error: `Bad Request: Currently only supports operations on exactly two features.` });
        return;
      }
      if (nextOperation.selection.some(index => typeof currentGeoJson.features[index] !== 'object')) {
        res.status(400).json({ error: `Bad Request: The selection contains nonexistent features.` });
        return;
      }
      if (['union', 'intersect'].indexOf(nextOperation.name) === -1) {
        res.status(400).json({ error: `Bad Request: The operation "${nextOperation.name}" is not supported.` });
        return;
      }

      const nextGeoJson = applyOperation(currentGeoJson, nextOperation);

      if (!isValid(nextGeoJson)) {
        res.status(400).json({ error: `Bad Request: Applying the operation would produce an invalid GeoJSON.` });
        return;
      }

      projectRef
        .child('operations')
        .set(operations.concat(nextOperation))
        .then(() => { // eslint-disable-line promise/always-return
          res.status(200).json({ message: 'OK' });
        })
        .catch(error => {
          res.status(500).json({ error });
        })
      ;
    });
  });
});

exports.removeLastOperation = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    // We only have this one project for now, but that could change.
    const projectName = 'sample-project';

    const operationsRef =
      admin
        .database()
        .ref('projects')
        .child(projectName)
        .child('operations')
    ;

    operationsRef.once('value', snap => {
      const operations = snap.val();

      if (!operations) {
        res.status(404).json({ error: `Not Found: Either the project "${projectName}" does not exist or it has no operations to remove.` });
        return;
      }

      operationsRef
        .set(
          operations.slice(0, operations.length - 1)
        )
        .then(() => { // eslint-disable-line promise/always-return
          res.status(200).json({ message: 'OK' });
        })
        .catch(error => {
          res.status(500).json({ error });
        })
      ;
    });
  });
});
