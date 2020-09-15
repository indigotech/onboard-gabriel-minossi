import { formatError, HttpError } from '@src/error';
import * as dotenv from 'dotenv';
import { GraphQLServer } from 'graphql-yoga';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import 'reflect-metadata';
import { createConnection, getConnection } from 'typeorm';
import { graphQLProps } from './graphql/graphql-props';

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: `${process.cwd()}/.env.test` });
} else {
  dotenv.config({ path: `${process.cwd()}/.env` });
}

export const setupTypeORM = async () => {
  try {
    await createConnection();
  } catch (error) {
    throw new HttpError(503, 'Are you sure the Docker database container is up?', error);
  }
};

export const setupGraphQL = async (): Promise<HttpServer | HttpsServer> => {
  let graphQLServer;
  try {
    graphQLServer = await new GraphQLServer(graphQLProps).start({
      port: process.env.GRAPHQL_PORT,
      formatError,
    });
    console.log(`GraphQL server is running on http://${process.env.GRAPHQL_HOST}:${process.env.GRAPHQL_PORT}`);
  } catch (error) {
    await getConnection().close();
    throw new HttpError(
      503,
      "Couldn't create the GraphQL server, check if there's an already existent connection on port " +
        process.env.GRAPHQL_PORT,
      error,
    );
  }
  return graphQLServer;
};
