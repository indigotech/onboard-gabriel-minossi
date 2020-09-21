import { setupGraphQL } from '@src/api/server-setup';
import { setupTypeORM } from '@src/data/database-setup';
import { User } from '@src/data/entity/User';
import hello from '@src/test/hello.test';
import createUser from '@src/test/user/create-user.test';
import getUser from '@src/test/user/get-user.test';
import getUsers from '@src/test/user/get-users.test';
import login from '@src/test/user/login.test';
import * as supertest from 'supertest';
import { getRepository } from 'typeorm';

describe('GraphQL', () => {
  before(async () => {
    [this.graphQLServer, this.connection] = await Promise.all([setupGraphQL(), setupTypeORM()]);
    this.request = supertest(`${process.env.GRAPHQL_HOST}:${process.env.GRAPHQL_PORT}`);
  });

  after(async () => {
    this.graphQLServer && this.graphQLServer.close();
    this.connection.isConnected && (await this.connection.close());
  });

  describe('Hello', hello.bind(this));
  describe('User', () => {
    before(() => {
      this.userRepository = getRepository(User);
    });

    describe('Login', login.bind(this));
    describe('Create User', createUser.bind(this));
    describe('Get User', getUser.bind(this));
    describe('Get Users', getUsers.bind(this));
  });
});
