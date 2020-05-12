const express = require('express');
const PORT = process.env.PORT || 4000;
const app = express();
const express_graphql = require('express-graphql');
const { makeExecutableSchema } = require('graphql-tools');
const GraphQLJSON = require('graphql-type-json');
const { get } = require('lodash');
const couch = require('couchdb-promises')({baseUrl: 'http://localhost:5984'});

const fakeDemoAppDbName = 'fake-DemoApp';

const typeDefs = `
    scalar JSON
    
    type DemoAppConfig {
        appName: String!
        environment: String!
        edition: String
        sourceId: String
        contents: JSON
        sectionNames: [String]
        jsonPath: String
    }
   
    type Query {    
        getDemoAppConfig(appName: String!, environment: String!, edition: String, jsonPath: String) : DemoAppConfig
    }
`;

const resolvers = {
    Query: {
        getDemoAppConfig: (obj, args) => {
            const appName = args.appName || 'feature-1';
            const environment = args.environment || 'ref';
            const edition = args.edition || 'regular';
            const couchDocId = `${appName}-${environment}-${edition}`;
            const jsonPath = args.jsonPath;
            const fullJsonPath = `data.data${jsonPath ? '.' + jsonPath : ''}`;
            return couch.getDatabase(fakeDemoAppDbName)
                .then(() => couch.getDocument(fakeDemoAppDbName, couchDocId))
                .then(results => ({
                    appName,
                    environment,
                    edition,
                    sourceId: couchDocId,
                    jsonPath,
                    contents: fullJsonPath ? get(results, fullJsonPath) : results
                }));
        },
    },
    JSON: GraphQLJSON,
    DemoAppConfig: {
        sectionNames(root) {
            return root && root.contents && root.contents.data ?
                Object.keys(root.contents.data) : []
        }
    },
};
const schema = makeExecutableSchema({ typeDefs, resolvers });

app.use('/graphiql', express_graphql({
    schema: schema,
    graphiql: true
}));

/*
-- Here is the query to try --
{
  getDemoAppConfig(appName: "feature-1", environment: "dev", jsonPath: "features") {
    appName
    environment
    edition
    sourceId
    jsonPath
    contents
  }
}

-- Here is the expected response --
{
  "data": {
    "getDemoAppConfig": {
      "appName": "feature-1",
      "environment": "dev",
      "edition": "regular",
      "sourceId": "feature-1-dev-regular",
      "jsonPath": "features",
      "contents": {
        "enableFeature1": true,
        "enableFeature2": true,
    ...etc....
*/

app.get('', (req, res) => res.send('You have arrived, tho there ain\'t much here :)'));
app.use('*', (req, res) => res.send('Well done, you broke it :p'));
app.listen(PORT, () => console.log(`Started http://localhost:${PORT}`));
