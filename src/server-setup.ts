import { User } from '@src/entity/User';
import { formatError } from '@src/error';
import { graphQLProps } from '@src/graphql-props';
import * as dotenv from 'dotenv';
import { GraphQLServer } from 'graphql-yoga';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import 'reflect-metadata';
import { createConnection } from 'typeorm';

dotenv.config({ path: process.cwd() + '/.env' + (process.env.NODE_ENV && '.' + process.env.NODE_ENV) });

export const setupTypeORM = async () => {
  try {
    await createConnection({ url: process.env.TYPEORM_URL, type: 'postgres', entities: [User] });
  } catch (error) {
    throw formatError(503, 'Are you sure the Docker database container is up?', error);
  }
}

export const setupGraphQL = async (): Promise<HttpServer | HttpsServer> => {
  try {
    return await new GraphQLServer(graphQLProps).start({ port: process.env.PORT });
  } catch (error) {
    throw formatError(503, 'Couldn\'t create the GraphQL server, check if there\'s an already existent connection on port ' + process.env.PORT, error);
  }
};
