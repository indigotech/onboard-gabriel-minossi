import { User } from '@src/entity/User';
import { HttpError } from '@src/error';
import { encrypt } from '@src/helpers';
import { Context } from 'graphql-yoga/dist/types';
import * as jwt from 'jsonwebtoken';
import { getRepository } from 'typeorm';
import { UserResolver } from './user.resolver';

const typeDefs = `
type Query {
  hello: String
  user(id: ID!): User!
  users(count: Int, skip: Int): Users!
}

type Mutation {
  login(email: String!, password: String!, rememberMe: Boolean): Login
  createUser(user: UserInput!): User!
}

type User {
  id: ID!
  name: String!
  email: String!
  birthDate: String!
  cpf: Int!
}

input UserInput {
  name: String!
  email: String!
  password: String!
  birthDate: String!
  cpf: Int!
}

type Login {
  user: User!
  token: String!
}

type Users {
  users: [User!]!
  hasMore: Boolean!
  skippedUsers: Int!
  totalUsers: Int!
}
`;

const resolvers = {
  Query: {
    hello: () => UserResolver.hello(),
    user: (_, data, context: Context) => UserResolver.user(data, context),
    users: (_, data, context: Context) => UserResolver.users(data, context),
  },
  Mutation: {
    login: (_, data) => UserResolver.login(data),
    createUser: async (_, data, context: Context) => UserResolver.createUser(data, context),
  },
};

export const graphQLProps = {
  typeDefs,
  resolvers,
  context: (request) => request,
};
