import { expect } from 'chai';
import * as dotenv from 'dotenv';
import { verify as verifyToken } from 'jsonwebtoken';
import 'reflect-metadata';
import * as supertest from 'supertest';
import { createConnection, createConnections, getConnection, getRepository, Repository } from "typeorm";
import { formatError } from '../error';
import { User } from "src/entity/User";
import { graphQLServer } from 'src/graphql-setup';


dotenv.config({ path: process.cwd() + '/.env.test' })

describe('GraphQL', () => {

  before(async () => {
    try {
      await Promise.all([
        createConnections(),
        // createConnection('test'),
        graphQLServer.start({ port: process.env.PORT })]
      );
      console.log(`Server is running on ${process.env.URL}`);
    } catch (error) {
      throw formatError(503, 'Are you sure the Docker database container is up?', error)
    }
  });

  after(async () => {
    await getConnection('test').close()
  });

  describe('Login', () => {
    let request: supertest.SuperTest<supertest.Test>;
    let userRepository: Repository<User>;
    const testUser = {
      name: "test",
      email: "test-email@example.com",
      password: "supersafe",
      birthDate: "01-01-1970",
      cpf: 28
    };
    const wrongCredentials = {
      email: testUser.email.split("").reverse().join(""),
      password: testUser.password.split("").reverse().join("")
    };

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


    it(`Successfully returns a valid token for user with correct credentials`, (done) => {
      request.post('/')
        .send({
          query: `mutation { login(email: "${testUser.email}", password: "${testUser.password}") { token user { id } } }`
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const token = res.body.data.login.token
          expect(token, 'Missing token').to.exist;
          let verification
          verifyToken(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
              done(err);
            }
            verification = decoded;
          });
          expect(verification.id.toString(), 'Token does not match user information').to.equal(res.body.data.login.user.id);
          done();
        });
    });

    it(`Successfully returns the right user for the correct credentials`, (done) => {
      request.post('/')
        .send({
          query: `mutation { login(email: "${testUser.email}", password: "${testUser.password}") { 
            user { 
              id
              name
              email
              birthDate
              cpf
            } 
          } }`
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const returnedUser = res.body.data.login.user;
          expect(returnedUser.name, 'Wrong name return from database').to.be.equal(testUser.name);
          expect(returnedUser.email, 'Wrong email return from database').to.be.equal(testUser.email);
          expect(returnedUser.birthDate, 'Wrong birthDate return from database').to.be.equal(testUser.birthDate);
          expect(returnedUser.cpf, 'Wrong cpf return from database').to.be.equal(testUser.cpf);
          done();
        });
    });

    it(`Fails logging in for an existent email with a wrong password`, (done) => {
      request.post('/')
        .send({
          query: `mutation { login(email: "${testUser.email}", password: "${wrongCredentials.password}") { token } }`
        })
        .expect(200)
        .end((err, res) => {
          if (err) return err;
          expect(res.body, 'Error expected').to.have.property('errors');
          done();
        });
    });

    it(`Fails logging in for a non-valid email and an existent password`, (done) => {
      request.post('/')
        .send({
          query: `mutation { login(email: "${wrongCredentials.email}", password: "${testUser.password}") { token } }`
        })
        .expect(200)
        .end((err, res) => {
          if (err) return err;
          expect(res.body, 'Error expected').to.have.property('errors');
          done();
        });
    });
  });
});
