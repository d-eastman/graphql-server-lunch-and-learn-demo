const express = require('express');
const PORT = process.env.PORT || 4000;
const app = express();
const express_graphql = require('express-graphql');
const { makeExecutableSchema } = require('graphql-tools');

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
    type DemoAppInfo {
        appName: String!
        environments: [String]
    } 
    
    type Query {    
        message: String
        getDemoAppInfos: [DemoAppInfo]
        getDemoAppInfo(appName: String!): DemoAppInfo
    }
`;

const resolvers = {
    Query: {
        message: () => 'Hello Query Param!',
        getDemoAppInfos: () => mockDemoAppData,
        getDemoAppInfo: (obj, args) =>
            mockDemoAppData.filter(x => x.appName === args.appName)[0]
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
  message
  getDemoAppInfos {
    appName
    environments
  }
  getDemoAppInfo(appName: "feature-2") {
    appName
    environments
  }
}

-- Here is the expected response --
{
  "data": {
    "message": "Hello Query Param!",
    "getDemoAppInfos": [
      {
        "appName": "feature-1",
        "environments": [
          "enable",
          "ref",
          "stage",
          "prod"
        ]
      },
      {
        "appName": "feature-2",
        "environments": [
          "dev",
          "ref",
          "stage",
          "prod"
        ]
      }
    ],
    "getDemoAppInfo": {
      "appName": "feature-2",
      "environments": [
        "dev",
        "ref",
        "stage",
        "prod"
      ]
    }
  }
}
*/

app.get('', (req, res) => res.send('You have arrived, tho there ain\'t much here :)'));
app.use('*', (req, res) => res.send('Well done, you broke it :p'));
app.listen(PORT, () => console.log(`Started http://localhost:${PORT}`));
