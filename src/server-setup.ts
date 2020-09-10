import { formatError } from '@src/error';
import { graphQLProps } from '@src/graphql-props';
import * as dotenv from 'dotenv';
import { GraphQLServer } from 'graphql-yoga';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import 'reflect-metadata';
import { createConnection, getConnection } from 'typeorm';

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: `${process.cwd()}/.env.test` })
} else {
  dotenv.config({ path: `${process.cwd()}/.env` })
}

export const setupTypeORM = async () => {
  try {
    await createConnection();
  } catch (error) {
    throw formatError(503, 'Are you sure the Docker database container is up?', error)
  }
}

export const setupGraphQL = async (): Promise<HttpServer | HttpsServer> => {
  let graphQLServer
  try {
    graphQLServer = await new GraphQLServer(graphQLProps).start({ port: process.env.GRAPHQL_PORT });;
  } catch (error) {
    await getConnection().close()
    throw formatError(503, 'Couldn\'t create the GraphQL server, check if there\'s an already existent connection on port ' + process.env.GRAPHQL_PORT, error)
  }
  console.log(`GraphQL server is running on http://${process.env.GRAPHQL_HOST}:${process.env.GRAPHQL_PORT}`);
  return graphQLServer;
};
