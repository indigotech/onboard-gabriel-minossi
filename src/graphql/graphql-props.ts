import { UserResolver } from './user.resolver';
import { buildSchemaSync } from 'type-graphql';
import { Props } from 'graphql-yoga/dist/types';

export const graphQLProps: Props = {
  schema: buildSchemaSync({ resolvers: [UserResolver], validate: false }) as any,
  context: (request) => request,
};
