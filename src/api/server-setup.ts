import { UserResolver } from '@src/api/graphql/user.resolver';
import { formatError, HttpError } from '@src/error';
import * as dotenv from 'dotenv';
import { GraphQLServer } from 'graphql-yoga';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { buildSchemaSync } from 'type-graphql';

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: `${process.cwd()}/.env.test` });
} else {
  dotenv.config({ path: `${process.cwd()}/.env` });
}

export const setupGraphQL = async (): Promise<HttpServer | HttpsServer> => {
  let graphQLServer: HttpServer | HttpsServer;
  try {
    graphQLServer = await new GraphQLServer({
      schema: buildSchemaSync({ resolvers: [UserResolver], validate: false }),
      context: (request) => request,
    }).start({
      port: process.env.GRAPHQL_PORT,
      formatError,
    });
    console.log(`GraphQL server is running on http://${process.env.GRAPHQL_HOST}:${process.env.GRAPHQL_PORT}`);
  } catch (error) {
    throw new HttpError(
      503,
      "Couldn't create the GraphQL server, check if there's an already existent connection on port " +
        process.env.GRAPHQL_PORT,
      error,
    );
  }
  return graphQLServer;
};
