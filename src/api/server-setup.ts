import { UserResolver } from '@src/api/graphql/user.resolver';
import { formatError, HttpError } from '@src/error';
import { getVerification } from '@src/helpers';
import { GraphQLServer } from 'graphql-yoga';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { buildSchemaSync } from 'type-graphql';
import { Container } from 'typedi';

export const setupGraphQL = async (): Promise<HttpServer | HttpsServer> => {
  let graphQLServer: HttpServer | HttpsServer;
  try {
    graphQLServer = await new GraphQLServer({
      schema: buildSchemaSync({
        resolvers: [UserResolver],
        validate: false,
        authChecker: getVerification,
        container: Container,
      }),
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
