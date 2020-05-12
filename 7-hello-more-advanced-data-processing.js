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
    
    type DemoAppConfigComparison {
        appName: String!
        environment1: String!
        environment2: String!
        environments: String!
        edition: String
        isExactMatch: Boolean
        contents1: JSON
        contents2: JSON
    }
    
    type Query {    
        message: String
        getDemoAppInfos: [DemoAppInfo]
        getDemoAppInfo(appName: String!): DemoAppInfo
        getDemoAppConfig(appName: String!, environment: String!, edition: String, jsonPath: String) : DemoAppConfig
        compareDemoAppConfigs(appName: String!, environment1: String!, environment2: String!, edition: String, jsonPath: String): DemoAppConfigComparison
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
        },
        compareDemoAppConfigs: (obj, args) => {
            const appName = args.appName || 'feature-1';
            const environment1 = args.environment1 || 'ref';
            const environment2 = args.environment2 || 'stage';
            const edition = args.edition || 'regular';
            const url1 = `http://data.demo-app.com/${edition}/${environment1}/${appName}.json`;
            const url2 = `http://data.demo-app.com/${edition}/${environment2}/${appName}.json`;
            const jsonPath = args.jsonPath;
            const fullJsonPath = `data.data${jsonPath ? '.' + jsonPath : ''}`;
            return axios.all([axios.get(url1), axios.get(url2)])
                .then(axios.spread((results1, results2) => {
                    const contents1 = fullJsonPath ? get(results1, fullJsonPath) : results1;
                    const contents2 = fullJsonPath ? get(results2, fullJsonPath) : results2;
                    return ({
                        appName,
                        environment1,
                        environment2,
                        edition,
                        jsonPath,
                        contents1,
                        contents2
                    });
                }));
        }
    },
    JSON: GraphQLJSON,
    DemoAppConfig: {
        sectionNames(root) {
            return root && root.contents && root.contents.data ?
                Object.keys(root.contents.data) : []
        }
    },
    DemoAppConfigComparison: {
        environments(root) {
            return `${root.environment1} vs ${root.environment2}`;
        },
        isExactMatch(root) {
            try {
                return JSON.stringify(root.contents1 || {}) === JSON.stringify(root.contents2 || {});
            } catch (e) {
                console.error(`isExactMatch failed! ${e}`);
                return false;
            }
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
  compareDemoAppConfigs(appName: "feature-1", environment1: "dev", environment2: "ref", jsonPath: "ads") {
    appName
    environment1
    environment2
    environments
    edition
    isExactMatch
    contents1
    contents2
  }
}

-- Here is the expected response --
{
  "data": {
    "compareDemoAppConfigs": {
      "appName": "feature-1",
      "environment1": "dev",
      "environment2": "ref",
      "environments": "dev vs ref",
      "edition": "regular",
      "isExactMatch": true,
      "contents1": {
        "ads": {
          "key1": "1234",
          "key2": 3
        },
        "ads": {
          "key1": "1234",
          "key2": 3
        }
      },
      "contents2": {
        "ads2": {
          "key1": "1234",
          "key2": 3
        },
        "ads2": {
          "key1": "1234",
          "key2": 3
        }
      }
    }
  }
}
*/

app.get('', (req, res) => res.send('You have arrived, tho there ain\'t much here :)'));
app.use('*', (req, res) => res.send('Well done, you broke it :p'));
app.listen(PORT, () => console.log(`Started http://localhost:${PORT}`));
