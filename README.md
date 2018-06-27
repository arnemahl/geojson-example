# GeoJSON Example

Hosted at [geojson-arne.firebaseapp.com](https://geojson-arne.firebaseapp.com/).

## Frontend

The frontend code is in the [client directory](./client).

## Serverless backend

For storing data we use [Firebase Realtime Database](https://firebase.google.com/docs/database/). The frontend fetches data directly from the database, but calls the REST API defined by our [Firebase Cloud Functions](https://firebase.google.com/docs/functions/) (in the [functions directory](./functions)) to write, as [our database rules](./database.rules.json) only allows read operations.
