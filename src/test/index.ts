import * as bcrypt from 'bcrypt';
import { expect } from 'chai';
import * as dotenv from 'dotenv';
import { formatError } from '@src/error';
import { verify as verifyToken } from 'jsonwebtoken';
import { it } from 'mocha';
import 'reflect-metadata';
import { User } from "@src/entity/User";
import { graphQLServer } from '@src/graphql-setup';
import * as supertest from 'supertest';
import { createConnection, getConnection, getRepository, Repository } from "typeorm";


dotenv.config({ path: process.cwd() + '/.env.test' })

describe('GraphQL', () => {
  let request: supertest.SuperTest<supertest.Test>;

  before(async () => {
    try {
      await createConnection('test');
      await graphQLServer.start({ port: process.env.PORT });
      console.log(`Server is running on ${process.env.URL}`);
      request = supertest(process.env.URL);
    } catch (error) {
      throw formatError(503, 'Are you sure the Docker database container is up?', error)
    }
  });

  after(async () => {
    await getConnection('test').close()
  });

  type LoginInput = {
    email: string
    password: string
  };

  const login = (credentials: LoginInput) => {
    return request.post('/')
      .send({
        query: `mutation login($email: String!, $password: String!) { login(email: $email, password: $password) { token user { id name email birthDate cpf} } }`,
        variables: { email: credentials.email, password: credentials.password }
      });
  };

  describe('Login', () => {
    let userRepository: Repository<User>;
    const unencryptedPassword = "Supersafe";
    const testUser = {
      name: "test",
      email: "test-email@example.com",
      password: bcrypt.hashSync(unencryptedPassword, bcrypt.genSaltSync(6)),
      birthDate: "01-01-1970",
      cpf: 28
    };
    const correctCredentials = {
      email: testUser.email,
      password: unencryptedPassword
    };
    const wrongCredentials = {
      email: testUser.email.split("").reverse().join(""),
      password: unencryptedPassword.split("").reverse().join("")
    };


    before(() => {
      userRepository = getRepository(User, 'test');
    });

    beforeEach(async () => {
      await userRepository.save({ ...testUser });
    });

    afterEach(async () => {
      await userRepository.delete({});
    });


    it(`Successfully returns a valid token for user with correct credentials`, async () => {
      const response = await login(correctCredentials);
      const token = response.body.data.login.token
      expect(token, 'Missing token').to.exist;
      const verification = verifyToken(token, process.env.JWT_SECRET)
      expect(verification['id'].toString(), 'Token does not match user information').to.equal(response.body.data.login.user.id);
    });

    it(`Successfully returns the right user for the correct credentials`, async () => {
      const { password, ...expectedResponse } = { ...testUser }

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

  type UserInput = {
    name: string
    email: string
    password: string
    birthDate: string
    cpf: number
  };

  const createUser = (user: UserInput, token: string) => {
    const newUser = {...user};

    return request.post('/')
      .auth(token, { type: 'bearer' })
      .send({
        query: `mutation createUser($user: UserInput!) { createUser(user: $user) { id name email birthDate cpf } }`,
        variables: { user: newUser }
      });
  };

  describe('Create User', () => {
    let userRepository: Repository<User>;
    let token: string;
    const unencryptedPassword = "Supersafe";
    const existingUser: UserInput = {
      name: "existing",
      email: "existing-email@example.com",
      password: bcrypt.hashSync(unencryptedPassword, bcrypt.genSaltSync(6)),
      birthDate: "01-01-1970",
      cpf: 28
    };
    const newUser: UserInput = {
      name: "new",
      email: "new-email@example.com",
      password: unencryptedPassword,
      birthDate: "01-01-1970",
      cpf: 28
    };

    before(() => {
      userRepository = getRepository(User, 'test');
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
      await userRepository.delete({});
    });

    it('Creates a new specified user for an user logged in correctly', async () => {
      const { password, ...expectedResponse } = { ...newUser };

      const response = await createUser(newUser, token);      
      expect(response.body.data.createUser).to.contain(expectedResponse);
    });

    it('Logs in to an user account after creation', async () => {
      const { password, ...expectedResponse } = { ...newUser };

      const response = await createUser(newUser, token);
      console.log(response.body);

      console.log(await userRepository.find());
      

      const loginResponse = await login({ email: response.body.data.createUser.email, password: unencryptedPassword }); 
      console.log(loginResponse.body);
      expect(loginResponse.body.data.login.user).to.contain(expectedResponse);
    });

    it('Fails to create a new user with an already registered email', async () => {
      const response = await createUser(existingUser, token);
      expect(response.body).to.have.property('errors');
    });

    it('Fails to create a new user if user is not logged in', async () => {
      const oldToken = token
      token = '';

      const response = await createUser(newUser, token);
      expect(response.body).to.have.property('errors');

      token = oldToken;
    });

    it('Fails to create a new user with an invalid email', async () => {
      const invalidUser = { ...newUser };
      invalidUser.email = 'shortmail';

      const response = await createUser(invalidUser, token);
      expect(response.body).to.have.property('errors');
    });

    it('Fails to create a new user with a weak password', async () => {
      const invalidUser = { ...newUser };
      invalidUser.password = 'shortpass';

      const response = await createUser(invalidUser, token);      
      expect(response.body).to.have.property('errors');
    });

    describe('Empty fields', () => {

      const verifyEmptyField = async (field: keyof (User)) => {
        const invalidUser = { ...newUser };
        invalidUser[`${field}`] = undefined;
        const response = await createUser(invalidUser, token);
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
});
