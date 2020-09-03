import * as assert from 'assert';
import 'reflect-metadata';
import * as supertest from 'supertest';
import { getRepository, Repository, createConnection } from "typeorm";
import { User } from "../src/entity/User";
import { server } from '../src/index';

const url = 'http://localhost:4000';

describe('GraphQL', () => {
  before(async () => {
    try {
      await createConnection('test');
      server.start({port: 4001}, () => console.log(`Server is running on http://localhost:4001`));
    } catch (error) {
      error => console.error('Error connecting to databse: ' + error)
    }
  });
  describe('Login', () => {
    let request: supertest.SuperTest<supertest.Test>;
    before(() => {
      request = supertest(url);
    });

    const email = "batata";
    const password = "pass";
    it(`Successfully returns token for user with email "${email}" and password "${password}"`, (done) => {
      request.post('/')
        .send({
          query: `mutation { login(email: "${email}", password: "${password}") { token } }`
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          assert(res.body.data.login.token, 'Token expected');
          done();
        })
    });

    const wrongPassword = "ssap";
    it(`Fails logging in for email "${email}" and password "${wrongPassword}"`, (done) => {
      request.post('/')
        .send({
          query: `mutation { login(email: "${email}", password: "${wrongPassword}") { token } }`
        })
        .expect(200)
        .end((err, res) => {
          if (err) return err;
          assert(res.body.errors, 'Error expected');
          done();
        })
    });

    const wrongEmail = "atatab";
    it(`Fails logging in for email "${wrongEmail}" and password "${password}"`, (done) => {
      request.post('/')
        .send({
          query: `mutation { login(email: "${wrongEmail}", password: "${password}") { token } }`
        })
        .expect(200)
        .end((err, res) => {
          if (err) return err;
          assert(res.body.errors, 'Error expected');
          done();
        })
    });
  });
});
