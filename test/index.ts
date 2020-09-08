import * as bcrypt from 'bcrypt';
import { expect } from 'chai';
import * as dotenv from 'dotenv';
import { formatError } from 'error';
import { verify as verifyToken } from 'jsonwebtoken';
import { it } from 'mocha';
import 'reflect-metadata';
import { User } from "src/entity/User";
import { graphQLServer } from 'src/graphql-setup';
import * as supertest from 'supertest';
import { createConnection, getConnection, getRepository, Repository } from "typeorm";


dotenv.config({ path: process.cwd() + '/.env.test' })

describe('GraphQL', () => {

  before(async () => {
    try {
      await createConnection('test');
      await graphQLServer.start({ port: process.env.PORT });
      console.log(`Server is running on ${process.env.URL}`);
    } catch (error) {
      throw formatError(503, 'Are you sure the Docker database container is up?', error)
    }
  });

  after(async () => {
    await getConnection('test').close()
  });

  describe('Login', () => {
    type LoginInput = {
      email: string
      password: string
    };

    let request: supertest.SuperTest<supertest.Test>;
    let userRepository: Repository<User>;
    const unencryptedPassword = "supersafe";
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

    const login = (credentials: LoginInput) => {
      return request.post('/')
        .send({
          query: `mutation login($email: String!, $password: String!) { login(email: $email, password: $password) { token user { id name email birthDate cpf} } }`,
          variables: { email: credentials.email, password: credentials.password }
        });
    }

    before((done) => {
      request = supertest(process.env.URL);
      userRepository = getRepository(User, 'test');
      done();
    });

    beforeEach(async () => {
      await userRepository.save(testUser);
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
      expectedResponse['id'] = expectedResponse['id'].toString();

      const response = await login(correctCredentials);
      expect(response.body.data.login.user).to.be.contain(expectedResponse);
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
    type UserInput = {
      name: string
      email: string
      password: string
      birthDate: string
      cpf: number
    };

    let request: supertest.SuperTest<supertest.Test>;
    let userRepository: Repository<User>;
    const unencryptedPassword = "supersafe";
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
      password: bcrypt.hashSync(unencryptedPassword, bcrypt.genSaltSync(6)),
      birthDate: "01-01-1970",
      cpf: 28
    };
    let token: string;

    const createUser = (user: UserInput) => {
      return request.post('/')
        .auth(token, { type: 'bearer' })
        .send({
          query: `mutation createUser($user: UserInput!) { createUser(user: $user) { id name email birthDate cpf } }`,
          variables: { user }
        });
    }

    before((done) => {
      request = supertest(process.env.URL);
      userRepository = getRepository(User, 'test');

      done();
    });

    beforeEach(async () => {
      await userRepository.save(existingUser);
      existingUser['id'] = undefined

      const response = await request.post('/')
        .send({
          query: `mutation { login(email: "${existingUser.email}", password: "${unencryptedPassword}") { token } }`
        });
      token = response.body.data.login.token;
    });

    afterEach(async () => {
      await userRepository.delete({});
    });

    it('Creates a new specified user for an user logged in correctly', async () => {
      const { password, ...expectedResponse } = { ...newUser };

      const response = await createUser(newUser);
      expect(response.body.data.createUser).to.contain(expectedResponse);
    });

    it('Fails to create a new user with an already registered email', async () => {
      const response = await createUser(existingUser);
      expect(response.body).to.have.property('errors');
    });

    it('Fails to create a new user if user is not logged in', async () => {
      token = '';

      const response = await createUser(newUser);
      expect(response.body).to.have.property('errors');
    });

    it('Fails to create a new user with an invalid email', async () => {
      const invalidUser = { ...newUser };
      invalidUser.email = 'shortmail';

      const response = await createUser(invalidUser);
      expect(response.body).to.have.property('errors');
    });

    it('Fails to create a new user with a weak password', async () => {
      const invalidUser = { ...newUser };
      invalidUser.password = 'shortpass';

      const response = await createUser(invalidUser);
      expect(response.body).to.have.property('errors');
    });

    describe('Empty fields', () => {

      const verifyEmptyField = (field: keyof (User), done: Function) => {
        const invalidUser = { ...newUser };
        invalidUser[`${field}`] = undefined;

        request.post('/')
          .send({
            query: `mutation { createUser (user: $user) { 
            user { 
              id
              name
              email
              birthDate
              cpf
            } 
          } }`,
            variables: {
              user: invalidUser
            }
          })
          .expect(400)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.body, 'Error expected').to.have.property('errors');
            done();
          });
      };

      it('Fails if name is empty', (done) => {
        verifyEmptyField('name', done);
      });

      it('Fails if email is empty', (done) => {
        verifyEmptyField('email', done);
      });

      it('Fails if password is empty', (done) => {
        verifyEmptyField('password', done);
      });

      it('Fails if birthDate is empty', (done) => {
        verifyEmptyField('birthDate', done);
      });

      it('Fails if cpf is empty', (done) => {
        verifyEmptyField('cpf', done);
      });
    });
  });
});
