import { User } from '@src/typeorm/entity/User';
import { encrypt } from '@src/helpers';
import { setupGraphQL, setupTypeORM } from '@src/server-setup';
import { expect } from 'chai';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { sign, verify as verifyToken } from 'jsonwebtoken';
import { it } from 'mocha';
import * as supertest from 'supertest';
import { getConnection, getRepository, Repository } from 'typeorm';
import { UserInputModel } from '@src/model/user.model';

describe('GraphQL', () => {
  let request: supertest.SuperTest<supertest.Test>;
  let graphQLServer: HttpServer | HttpsServer;

  before(async () => {
    request = supertest(`${process.env.GRAPHQL_HOST}:${process.env.GRAPHQL_PORT}`);
    [graphQLServer] = await Promise.all([setupGraphQL(), setupTypeORM()]);
    console.log();
  });

  after(async () => {
    graphQLServer && graphQLServer.close();
    const connection = getConnection();
    connection.isConnected && (await connection.close());
  });

  describe('Hello', () => {
    it('Says hello :)', async () => {
      let helloResponse;
      try {
        helloResponse = await request.post('/').send({
          query: `query hello { hello }`,
        });
      } catch (error) {
        console.log(error);
      }
      expect(helloResponse.body.data.hello).to.equal('Hello!');
    });
  });

  describe('Login', () => {
    interface LoginInput {
      email: string;
      password: string;
    }

    const login = (credentials: LoginInput) => {
      return request.post('/').send({
        query: `mutation login($email: String!, $password: String!) { login(email: $email, password: $password) { token user { id name email birthDate cpf } } }`,
        variables: { email: credentials.email, password: credentials.password },
      });
    };

    let userRepository: Repository<User>;
    const unencryptedPassword = 'Supersafe';
    const existingUser: UserInputModel = {
      name: 'test',
      email: 'test-email@example.com',
      password: encrypt(unencryptedPassword),
      birthDate: '01-01-1970',
      cpf: '28',
    };
    const correctCredentials = {
      email: existingUser.email,
      password: unencryptedPassword,
    };
    const wrongCredentials = {
      email: existingUser.email.split('').reverse().join(''),
      password: unencryptedPassword.split('').reverse().join(''),
    };

    before(() => {
      userRepository = getRepository(User);
    });

    beforeEach(async () => {
      await userRepository.save({ ...existingUser });
    });

    afterEach(async () => {
      await userRepository.delete({ email: existingUser.email });
    });

    it(`Successfully returns a valid token for user with correct credentials`, async () => {
      const loginResponse = await login(correctCredentials);
      const token = loginResponse.body.data.login.token;
      expect(token, 'Missing token').to.exist;
      const verification = verifyToken(token, process.env.JWT_SECRET);
      expect(verification['id'], 'Token does not match user information').to.equal(
        loginResponse.body.data.login.user.id,
      );
    });

    it(`Successfully returns the right user for the correct credentials`, async () => {
      const expectedUser = { ...existingUser };
      delete expectedUser.password;

      const mutationUser = (await login(correctCredentials)).body.data.login.user;
      delete mutationUser.id;

      expect(mutationUser).to.deep.equal(expectedUser);
    });

    it(`Fails logging in for an existent email with a wrong password`, async () => {
      const credentials = { email: correctCredentials.email, password: wrongCredentials.password };
      const loginResponse = await login(credentials);

      expect(loginResponse.body, 'Error expected').to.have.property('errors');
      expect(loginResponse.body.errors[0].code).to.equal(401);
    });

    it(`Fails logging in for an unexistent email and an existent password`, async () => {
      const credentials = { email: wrongCredentials.email, password: correctCredentials.password };
      const loginResponse = await login(credentials);

      expect(loginResponse.body, 'Error expected').to.have.property('errors');
      expect(loginResponse.body.errors[0].code).to.equal(400);
    });
  });

  describe('Create User', () => {
    const createUser = (token: string, user: UserInputModel) => {
      const newUser = { ...user };

      return request
        .post('/')
        .auth(token, { type: 'bearer' })
        .send({
          query: `mutation createUser($user: UserInput!) { createUser(user: $user) { id name email birthDate cpf } }`,
          variables: { user: newUser },
        });
    };

    let userRepository: Repository<User>;
    let token: string;
    const unencryptedPassword = 'Supersafe';
    const existingUser: UserInputModel = {
      name: 'existing',
      email: 'existing-email@example.com',
      password: encrypt(unencryptedPassword),
      birthDate: '01-01-1970',
      cpf: '28',
    };
    const newUser: UserInputModel = {
      name: 'new',
      email: 'new-email@example.com',
      password: unencryptedPassword,
      birthDate: '01-01-1970',
      cpf: '28',
    };

    before(() => {
      userRepository = getRepository(User);
    });

    beforeEach(async () => {
      await userRepository.save({ ...existingUser });

      token = sign({}, process.env.JWT_SECRET, { expiresIn: '2s' });
    });

    afterEach(async () => {
      await userRepository.delete({ email: existingUser.email });
      await userRepository.delete({ email: newUser.email });
    });

    it('Creates a new specified user for an user logged in correctly', async () => {
      const expectedUser = { ...newUser };
      delete expectedUser.password;

      const mutationUser = (await createUser(token, newUser)).body.data.createUser;
      delete mutationUser.id;

      expect(mutationUser).to.deep.equal(expectedUser);
    });

    it('Logs in to an user account after creation', async () => {
      const expectedUser = { ...newUser };
      delete expectedUser.password;

      const createdUser = (await createUser(token, newUser)).body.data.createUser;
      const mutationUser = (
        await request.post('/').send({
          query: `mutation login($email: String!, $password: String!) { login(email: $email, password: $password) { user { name email birthDate cpf } } }`,
          variables: { email: createdUser.email, password: unencryptedPassword },
        })
      ).body.data.login.user;

      expect(mutationUser).to.deep.equal(expectedUser);
    });

    it('Fails to create a new user with an already registered email', async () => {
      const createUserResponse = await createUser(token, existingUser);

      expect(createUserResponse.body).to.have.property('errors');
      expect(createUserResponse.body.errors[0].code).to.equal(400);
    });

    it('Fails to create a new user if user is not logged in', async () => {
      const oldToken = token;
      token = '';

      const createUserResponse = await createUser(token, newUser);

      expect(createUserResponse.body).to.have.property('errors');
      expect(createUserResponse.body.errors[0].code).to.equal(401);

      token = oldToken;
    });

    it('Fails to create a new user with an invalid email', async () => {
      const invalidUser = { ...newUser };
      invalidUser.email = 'shortmail';
      const createUserResponse = await createUser(token, invalidUser);

      expect(createUserResponse.body).to.have.property('errors');
      expect(createUserResponse.body.errors[0].code).to.equal(400);
    });

    it('Fails to create a new user with a weak password', async () => {
      const invalidUser = { ...newUser };
      invalidUser.password = 'shortpass';

      const createUserResponse = await createUser(token, invalidUser);

      expect(createUserResponse.body).to.have.property('errors');
      expect(createUserResponse.body.errors[0].code).to.equal(400);
    });

    describe('Empty fields', () => {
      const verifyEmptyField = async (field: keyof User) => {
        const invalidUser = { ...newUser };
        invalidUser[`${field}`] = undefined;
        const createUserResponse = await createUser(token, invalidUser);
        expect(createUserResponse.body, 'Error expected').to.have.property('errors');
      };

      it('Fails if name is empty', () => {
        verifyEmptyField('name');
      });

      it('Fails if email is empty', () => {
        verifyEmptyField('email');
      });

      it('Fails if password is empty', () => {
        verifyEmptyField('password');
      });

      it('Fails if birthDate is empty', () => {
        verifyEmptyField('birthDate');
      });

      it('Fails if cpf is empty', () => {
        verifyEmptyField('cpf');
      });
    });
  });

  describe('Get User', () => {
    const getUser = (token: string, id: string) => {
      return request.post('/').auth(token, { type: 'bearer' }).send({
        query: `query user($id: ID!) { user(id: $id) { id name email birthDate cpf } }`,
        variables: { id },
      });
    };

    let userRepository: Repository<User>;
    let token: string;
    const unencryptedPassword = 'Supersafe';
    const existingUser: UserInputModel = {
      name: 'existing',
      email: 'existing-email@example.com',
      password: encrypt(unencryptedPassword),
      birthDate: '01-01-1970',
      cpf: '28',
    };
    const newUser: UserInputModel = {
      name: 'new',
      email: 'new-email@example.com',
      password: unencryptedPassword,
      birthDate: '01-01-1970',
      cpf: '28',
    };

    before(() => {
      userRepository = getRepository(User);
    });

    beforeEach(async () => {
      await userRepository.save({ ...existingUser });

      token = sign({}, process.env.JWT_SECRET, { expiresIn: '2s' });
    });

    afterEach(async () => {
      await userRepository.delete({ email: existingUser.email });
      await userRepository.delete({ email: newUser.email });
    });

    it('Gets an existing user', async () => {
      const expectedUser = { ...existingUser };
      delete expectedUser.password;

      const oldUser = await userRepository.findOne({ email: existingUser.email });
      const queryUser = (await getUser(token, oldUser.id)).body.data.user;
      delete queryUser.id;

      expect(queryUser).to.deep.equal(expectedUser);
    });

    it("Gets a new user after it's creation", async () => {
      const createdUser = await userRepository.save({ ...newUser });
      const expectedUser = { ...createdUser };
      delete expectedUser.id;
      delete expectedUser.password;

      const queryUser = (await getUser(token, createdUser.id)).body.data.user;
      delete queryUser.id;

      expect(queryUser).to.deep.equal(expectedUser);
    });

    it('Fails to get an user with an unexistent id', async () => {
      const getUserResponse = await getUser(token, '');

      expect(getUserResponse.body).to.have.property('errors');
      expect(getUserResponse.body.errors[0].code).to.equal(404);
    });

    it('Fails to get user if user is not logged in', async () => {
      const oldToken = token;
      token = '';

      const oldUser = await userRepository.findOne({ email: existingUser.email });
      const getUserResponse = await getUser(token, oldUser.id);

      expect(getUserResponse.body).to.have.property('errors');

      token = oldToken;
    });
  });

  describe('Get Users', () => {
    interface UsersInput {
      count?: number;
      skip?: number;
    }

    const getUsers = (token: string, input?: UsersInput) => {
      const variables = input || null;
      return request.post('/').auth(token, { type: 'bearer' }).send({
        query: `query getUsers($count: Int, $skip: Int) { users(count: $count, skip: $skip) { hasMore users { id name email birthDate cpf } } }`,
        variables,
      });
    };

    const parseDatabaseUsers = (users: User[]) =>
      users.map((user) => {
        delete user.password;
        return user;
      });

    const verifyGetUsers = async (count?: number, skip?: number) => {
      count = count || null;
      skip = skip || null;

      const [databaseUsers, getUsersResponse] = await Promise.all([
        userRepository.find({ take: count || 10, skip, order: { name: 'ASC' } }),
        getUsers(token, { count, skip }),
      ]);
      const expectedUsers = parseDatabaseUsers(databaseUsers);

      expect(expectedUsers).to.deep.equal(getUsersResponse.body.data.users.users);
    };

    let userRepository: Repository<User>;
    let existingUsersCount: number;
    let token: string;
    const unencryptedPassword = 'Supersafe';
    const existingUser: Partial<User> = {
      name: 'existing',
      email: 'existing-email@example.com',
      password: encrypt(unencryptedPassword),
      birthDate: '01-01-1970',
      cpf: '28',
    };
    // const newUser: CreateUserInput = {
    //   name: 'new',
    //   email: 'new-email@example.com',
    //   password: unencryptedPassword,
    //   birthDate: '01-01-1970',
    //   cpf: 28,
    // };

    before(() => {
      userRepository = getRepository(User);
    });

    beforeEach(async () => {
      await userRepository.save({ ...existingUser });

      token = sign({}, process.env.JWT_SECRET, { expiresIn: '2s' });

      existingUsersCount = await userRepository.count();
    });

    afterEach(async () => {
      await userRepository.delete({ email: existingUser.email });
    });

    it('Gets one user', async () => {
      await verifyGetUsers(1);
    });

    it(`Gets all users`, async () => {
      await verifyGetUsers(existingUsersCount);
    });

    it(`Fails to get users without a valid token`, async () => {
      const oldToken = token;
      token = '';

      const getUsersResponse = await getUsers(token);
      expect(getUsersResponse.body).to.have.property('errors');

      token = oldToken;
    });

    describe('Pagination', () => {
      const pageSize = 50;

      it('Gets users from the beggining of the list', async () => {
        const count = pageSize;
        const skip = 0;

        await verifyGetUsers(count, skip);
      });

      it('Gets users from the middle of the list', async () => {
        const count = pageSize;
        const skip = pageSize;

        await verifyGetUsers(count, skip);
      });

      it('Gets users from the end of the list', async () => {
        const count = pageSize;
        const skip = existingUsersCount - pageSize / 2;

        await verifyGetUsers(count, skip);
      });

      it('Gets users from beyond the end of the list', async () => {
        const count = pageSize;
        const skip = existingUsersCount + 1;

        await verifyGetUsers(count, skip);
      });
    });
  });
});
