import fs from 'fs';
import { gql } from 'apollo-server-express';
import { HttpLink } from 'apollo-link-http';
import fetch from 'node-fetch';

const {
  makeExecutableSchema,
  makeRemoteExecutableSchema,
  introspectSchema,
  mergeSchemas
} = require('graphql-tools');


export default class SchemaManager {
  async createRemoteSchema(uri) {
    const link = new HttpLink({ uri, fetch });

    return makeRemoteExecutableSchema({
      schema: await introspectSchema(link),
      link
    });
  }

  async perform() {
    const linkSchema = gql`
      type Query {
        _: Boolean
      }

      type Mutation {
        _: Boolean
      }
    `;

    const typeDefs = [linkSchema];
    const resolvers = [];

    fs.readdirSync('./graphql/').forEach((file) => {
      if (file !== 'index.js') {
        const GraphQLSchema = new (require('./' + file).default)();

        typeDefs.push(GraphQLSchema.getSchema());
        resolvers.push(GraphQLSchema.getResolver());
      }
    });

    const appSchema = makeExecutableSchema({ typeDefs, resolvers, });

    const countrySchema = await this.createRemoteSchema('https://countries.trevorblades.com');
    typeDefs.push(countrySchema);

    return mergeSchemas({
      schemas: [appSchema, countrySchema],
    });
  };
}
