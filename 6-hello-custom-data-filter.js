const express = require('express');
const PORT = process.env.PORT || 4000;
const app = express();
const express_graphql = require('express-graphql');
const { makeExecutableSchema } = require('graphql-tools');
const axios = require('axios');
const GraphQLJSON = require('graphql-type-json');
const { get } = require('lodash');

const mockDemoAppData = [
    {
        appName: 'feature-1',
        environments: ['dev', 'ref', 'stage', 'prod']
    },
    {
        appName: 'feature-2',
        environments: ['dev', 'ref', 'stage', 'prod']
    }
];

const typeDefs = `
    scalar JSON
    
    type DemoAppInfo {
        appName: String!
        environments: [String]
    } 
    
    type DemoAppConfig {
        appName: String!
        environment: String!
        edition: String
        url: String
        contents: JSON
        sectionNames: [String]
        jsonPath: String
    }
    
    type Query {    
        message: String
        getDemoAppInfos: [DemoAppInfo]
        getDemoAppInfo(appName: String!): DemoAppInfo
        getDemoAppConfig(appName: String!, environment: String!, edition: String, jsonPath: String) : DemoAppConfig
    }
`;

const resolvers = {
    Query: {
        message: () => 'Hello Query Param!',
        getDemoAppInfos: () => mockDemoAppData,
        getDemoAppInfo: (obj, args) =>
            mockDemoAppData.filter(x => x.appName === args.appName)[0],
        getDemoAppConfig: (obj, args) => {
            const appName = args.appName || 'feature-1';
            const environment = args.environment || 'ref';
            const edition = args.edition || 'regular';
            const url = `http://data.demo-app.com/cfg/v1/${edition}/${environment}/${appName}.json`;
            const jsonPath = args.jsonPath;
            const fullJsonPath = `data.data${jsonPath ? '.' + jsonPath : ''}`;
            return axios.get(url).then(results => ({
                appName,
                environment,
                edition,
                url,
                jsonPath,
                contents: fullJsonPath ? get(results, fullJsonPath) : results
            }));
        }
    },
    JSON: GraphQLJSON,
    DemoAppConfig: {
        sectionNames(root) {
            return root && root.contents && root.contents.data ?
                Object.keys(root.contents.data) : []
        }
    }
};
const schema = makeExecutableSchema({ typeDefs, resolvers });

app.use('/graphiql', express_graphql({
    schema: schema,
    graphiql: true
}));

/*
-- Here is the query to try --
{
  getDemoAppConfig(appName: "feature-1", environment: "ref", edition: "regular", jsonPath: "ads") {
    appName
    environment
    edition
    url
    jsonPath
    contents
  }
}

-- Here is the expected response --
{
  "data": {
    "getDemoAppConfig": {
      "appName": "feature-1",
      "environment": "ref",
      "edition": "regular",
      "url": "http://data.demo-app.com/cfg/v1/regular/ref/feature-1.json",
      "jsonPath": "ads",
      "contents": {
        "stuff": {
          "key1": "1234",
          "key2": 10,
          "key3": true
        }
      }
    }
  }
}
*/

app.get('', (req, res) => res.send('You have arrived, tho there ain\'t much here :)'));
app.use('*', (req, res) => res.send('Well done, you broke it :p'));
app.listen(PORT, () => console.log(`Started http://localhost:${PORT}`));
