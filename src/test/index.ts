import { User } from '@src/entity/User';
import { setupGraphQL, setupTypeORM } from '@src/server-setup';
import { expect } from 'chai';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { verify as verifyToken } from 'jsonwebtoken';
import { it } from 'mocha';
import * as supertest from 'supertest';
import { getConnection, getRepository, Repository } from 'typeorm';
import { encrypt } from './helpers';

describe('GraphQL', () => {
  let request: supertest.SuperTest<supertest.Test>;
  let graphQLServer: HttpServer | HttpsServer;

  before(async () => {
    request = supertest(process.env.URL);
    [graphQLServer,] = await Promise.all([
      setupGraphQL(),
      setupTypeORM()
    ]);

  });

  after(async () => {
    graphQLServer.close();
    await getConnection().close()
  });


  describe('Login', () => {
    interface LoginInput {
      email: string
      password: string
    };

    const login = (credentials: LoginInput) => {
      return request.post('/')
        .send({
          query: `mutation login($email: String!, $password: String!) { login(email: $email, password: $password) { token user { id name email birthDate cpf } } }`,
          variables: { email: credentials.email, password: credentials.password }
        });
    };

    let userRepository: Repository<User>;
    const unencryptedPassword = "Supersafe";
    const existingUser: Partial<User> = {
      name: "test",
      email: "test-email@example.com",
      password: encrypt(unencryptedPassword),
      birthDate: "01-01-1970",
      cpf: 28
    };
    const correctCredentials = {
      email: existingUser.email,
      password: unencryptedPassword
    };
    const wrongCredentials = {
      email: existingUser.email.split("").reverse().join(""),
      password: unencryptedPassword.split("").reverse().join("")
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
      const response = await login(correctCredentials);
      const token = response.body.data.login.token
      expect(token, 'Missing token').to.exist;
      const verification = verifyToken(token, process.env.JWT_SECRET)
      expect(verification['id'].toString(), 'Token does not match user information').to.equal(response.body.data.login.user.id);
    });

    it(`Successfully returns the right user for the correct credentials`, async () => {
      const { password, ...expectedResponse } = { ...existingUser }

      const response = await login(correctCredentials);
      expect(response.body.data.login.user).to.contain(expectedResponse);
    });

    it(`Fails logging in for an existent email with a wrong password`, async () => {
      const credentials = { email: correctCredentials.email, password: wrongCredentials.password };

      const response = await login(credentials);
      expect(response.body, 'Error expected').to.have.property('errors');
    });

    it(`Fails logging in for an unexistent email and an existent password`, async () => {
      const credentials = { email: wrongCredentials.email, password: correctCredentials.password };
      const response = await login(credentials);
      expect(response.body, 'Error expected').to.have.property('errors');
    });
  });

  describe('Create User', () => {
    interface CreateUserInput {
      name: string
      email: string
      password: string
      birthDate: string
      cpf: number
    };

    const createUser = (token: string, user: CreateUserInput) => {
      const newUser = { ...user };

      return request.post('/')
        .auth(token, { type: 'bearer' })
        .send({
          query: `mutation createUser($user: UserInput!) { createUser(user: $user) { id name email birthDate cpf } }`,
          variables: { user: newUser }
        });
    };

    let userRepository: Repository<User>;
    let token: string;
    const unencryptedPassword = "Supersafe";
    const existingUser: Partial<User> = {
      name: "existing",
      email: "existing-email@example.com",
      password: encrypt(unencryptedPassword),
      birthDate: "01-01-1970",
      cpf: 28
    };
    const newUser: CreateUserInput = {
      name: "new",
      email: "new-email@example.com",
      password: unencryptedPassword,
      birthDate: "01-01-1970",
      cpf: 28
    };

    before(() => {
      userRepository = getRepository(User);
    });

    beforeEach(async () => {
      await userRepository.save({ ...existingUser });

      token = (await request.post('/')
        .send({
          query: `mutation login($email: String!, $password: String!) { login(email: $email, password: $password) { token user { id name email birthDate cpf } } }`,
          variables: { email: existingUser.email, password: unencryptedPassword }
        })).body.data.login.token
    });

    afterEach(async () => {
      await userRepository.delete({ email: existingUser.email });
      await userRepository.delete({ email: newUser.email });
    });

    it('Creates a new specified user for an user logged in correctly', async () => {
      const { password, ...expectedResponse } = { ...newUser };

      const response = await createUser(token, newUser);
      expect(response.body.data.createUser).to.contain(expectedResponse);
    });

    it('Logs in to an user account after creation', async () => {
      const { password, ...expectedResponse } = { ...newUser };

      const response = await createUser(token, newUser);
      const loginResponse = await request.post('/')
        .send({
          query: `mutation login($email: String!, $password: String!) { login(email: $email, password: $password) { token user { id name email birthDate cpf } } }`,
          variables: { email: response.body.data.createUser.email, password: unencryptedPassword }
        })
      expect(loginResponse.body.data.login.user).to.contain(expectedResponse);
    });

    it('Fails to create a new user with an already registered email', async () => {
      const response = await createUser(token, existingUser as CreateUserInput);
      expect(response.body).to.have.property('errors');
    });

    it('Fails to create a new user if user is not logged in', async () => {
      const oldToken = token
      token = '';

      const response = await createUser(token, newUser);
      expect(response.body).to.have.property('errors');

      token = oldToken;
    });

    it('Fails to create a new user with an invalid email', async () => {
      const invalidUser = { ...newUser };
      invalidUser.email = 'shortmail';

      const response = await createUser(token, invalidUser);
      expect(response.body).to.have.property('errors');
    });

    it('Fails to create a new user with a weak password', async () => {
      const invalidUser = { ...newUser };
      invalidUser.password = 'shortpass';

      const response = await createUser(token, invalidUser);
      expect(response.body).to.have.property('errors');
    });

    describe('Empty fields', () => {

      const verifyEmptyField = async (field: keyof (User)) => {
        const invalidUser = { ...newUser };
        invalidUser[`${field}`] = undefined;
        const response = await createUser(token, invalidUser);
        expect(response.body, 'Error expected').to.have.property('errors');
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
    interface CreateUserInput {
      name: string
      email: string
      password: string
      birthDate: string
      cpf: number
    };

    const getUser = (token: string, id: number) => {
      return request.post('/')
        .auth(token, { type: 'bearer' })
        .send({
          query: `query user($id: ID!) { user(id: $id) { id name email birthDate cpf } }`,
          variables: { id }
        });
    };

    let userRepository: Repository<User>;
    let token: string;
    const unencryptedPassword = "Supersafe";
    const existingUser: Partial<User> = {
      name: "existing",
      email: "existing-email@example.com",
      password: bcrypt.hashSync(unencryptedPassword, bcrypt.genSaltSync(6)),
      birthDate: "01-01-1970",
      cpf: 28
    };
    const newUser: CreateUserInput = {
      name: "new",
      email: "new-email@example.com",
      password: unencryptedPassword,
      birthDate: "01-01-1970",
      cpf: 28
    };

    before(() => {
      userRepository = getRepository(User);
    });

    beforeEach(async () => {
      await userRepository.save({ ...existingUser });

      token = (await request.post('/')
        .send({
          query: `mutation login($email: String!, $password: String!) { login(email: $email, password: $password) { token user { id name email birthDate cpf} } }`,
          variables: { email: existingUser.email, password: unencryptedPassword }
        })).body.data.login.token
    });

    afterEach(async () => {
      await userRepository.delete({ email: existingUser.email });
      await userRepository.delete({ email: newUser.email });
    });

    it('Gets an existing user', async () => {
      const { password, ...expectedResponse } = { ...existingUser };
      const oldUser = await userRepository.findOne({ email: existingUser.email });

      const response = await getUser(token, oldUser.id);
      expect(response.body.data.user).to.contain(expectedResponse);
    });

    it('Gets a new user after it\'s creation', async () => {
      const createdUser = await userRepository.save({ ...newUser });
      const { password, id, ...expectedResponse } = { ...createdUser };
      expectedResponse['id'] = id.toString();

      const response = await getUser(token, createdUser.id);
      expect(response.body.data.user).to.contain(expectedResponse);
    });

    it('Fails to get an user with an unexistent id', async () => {
      const response = await getUser(token, -1);
      expect(response.body).to.have.property('errors');
    });

    it('Fails to get user if user is not logged in', async () => {
      const oldToken = token
      token = '';

      const response = await request.post('/')
        .auth(token, { type: 'bearer' })
        .send({
          query: `mutation createUser($user: UserInput!) { createUser(user: $user) { id name email birthDate cpf } }`,
          variables: { user: newUser }
        });

      expect(response.body).to.have.property('errors');

      token = oldToken;
    });
  });

  describe('Get Users', () => {
    interface CreateUserInput {
      name: string
      email: string
      password: string
      birthDate: string
      cpf: number
    };

    interface UsersInput {
      count?: number
      skip?: number
    };

    const getUsers = (token: string, input?: UsersInput) => {
      const variables = input || null
      return request.post('/')
        .auth(token, { type: 'bearer' })
        .send({
          query: `query getUsers($count: Int, $skip: Int) { users(count: $count, skip: $skip) { hasMore users { name } } }`,
          variables
        });
    };

    const getAllUsers = async (token: string) => {
      let users: User[] = [];
      let input: UsersInput = { count: 100, skip: 0 }
      let hasMore = true;

      while (hasMore) {
        const response = await getUsers(token, input);
        hasMore = response.body.data.users.hasMore;
        response.body.data.users.users.map(user => users.push(user));
        input.skip += input.count;
      }

      return users;
    }

    let userRepository: Repository<User>;
    let existingUsersCount: number
    let token: string;
    const unencryptedPassword = "Supersafe";
    const existingUser: Partial<User> = {
      name: "existing",
      email: "existing-email@example.com",
      password: encrypt(unencryptedPassword),
      birthDate: "01-01-1970",
      cpf: 28
    };
    const newUser: CreateUserInput = {
      name: "new",
      email: "new-email@example.com",
      password: unencryptedPassword,
      birthDate: "01-01-1970",
      cpf: 28
    };

    before(() => {
      userRepository = getRepository(User);
    });

    beforeEach(async () => {
      await userRepository.save({ ...existingUser });

      token = (await request.post('/')
        .send({
          query: `mutation login($email: String!, $password: String!) { login(email: $email, password: $password) { token user { id name email birthDate cpf } } }`,
          variables: { email: existingUser.email, password: unencryptedPassword }
        })).body.data.login.token

      existingUsersCount = await userRepository.count();
    });

    afterEach(async () => {
      await userRepository.delete({ email: existingUser.email });
    });


    it(`Gets the same ammount of users as there are in the database`, async () => {
      const allUsers = await getAllUsers(token);
      expect(existingUsersCount).to.equal(allUsers.length)
    });

    it(`Fails to get users without a valid token`, async () => {
      const oldToken = token
      token = '';

      const response = await getUsers(token);
      expect(response.body).to.have.property('errors');

      token = oldToken;
    });

    it(`Sorts users correctly by name`, async () => {
      const expectedUserNames = await userRepository.find({ select: ['name'], order: { name: 'ASC' } });

      const allUserNames = await getAllUsers(token);
      expect(expectedUserNames).to.eql(allUserNames);

    });
  });
});
