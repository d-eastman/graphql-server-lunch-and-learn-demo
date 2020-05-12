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
    }
`;

const resolvers = {
    Query: {
        message: () => 'Hello Data!',
        getDemoAppInfos: () => mockDemoAppData
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
}

-- Here is the expected response --
{
  "data": {
    "message": "Hello Data!",
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
    ]
  }
}
*/

app.get('', (req, res) => res.send('You have arrived, tho there ain\'t much here :)'));
app.use('*', (req, res) => res.send('Well done, you broke it :p'));
app.listen(PORT, () => console.log(`Started http://localhost:${PORT}`));
