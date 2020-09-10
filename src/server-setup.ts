import { User } from '@src/entity/User';
import { formatError } from '@src/error';
import { graphQLProps } from '@src/graphql-props';
import * as dotenv from 'dotenv';
import { GraphQLServer } from 'graphql-yoga';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import 'reflect-metadata';
import { createConnection, getConnection } from 'typeorm';

dotenv.config({ path: process.cwd() + '/.env' + (process.env.NODE_ENV && '.' + process.env.NODE_ENV) });

export const setup = async () => {
  let graphQLServer: HttpServer | HttpsServer;
  try {
    await createConnection({ url: process.env.TYPEORM_URL, type: 'postgres', entities: [User] });
  } catch (error) {
    throw formatError(503, 'Are you sure the Docker database container is up?', error)
  }
  try {
    graphQLServer = await new GraphQLServer(graphQLProps).start({ port: process.env.PORT });;
  } catch (error) {
    await getConnection().close()
    throw formatError(503, 'Couldn\'t create the GraphQL server, check if there\'s an already existent connection on port ' + process.env.PORT, error)
  }
  console.log(`Server is running on http://${process.env.URL}`);
  return graphQLServer;
};
