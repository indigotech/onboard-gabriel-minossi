import * as assert from 'assert';
import 'reflect-metadata';
import * as supertest from 'supertest';
import { createConnection, getRepository } from "typeorm";
import { User } from "../src/entity/User";
import { server } from '../src/index';
import { toUnicode } from 'punycode';

const url = 'http://localhost:4001';

describe('GraphQL', () => {
  before(async () => {
    await createConnection('test');
    server.start({ port: 4001 }, () => console.log(`Server is running on http://localhost:4001`));
  });
  describe('Login', () => {
    let request: supertest.SuperTest<supertest.Test>;
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
    }

    before(() => {
      request = supertest(url);

      const userRepository = getRepository(User);
      userRepository.save(testUser);
    });

    after(async () => {
      const userRepository = getRepository(User);
      const users = await userRepository.find({
        where: {
          name: testUser.name,
          email: testUser.email,
          password: testUser.password,
          birthDate: testUser.birthDate,
          cpf: testUser.cpf
        }
      });
      const user = users[users.length - 1];
      userRepository.delete(user);
    })

    it(`Successfully returns token for user with correct credentials`, (done) => {
      request.post('/')
        .send({
          query: `mutation { login(email: "${testUser.email}", password: "${testUser.password}") { token } }`
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          assert(res.body.data.login.token, 'Token expected');
          done();
        })
    });

    it(`Fails logging in for an existent email with a wrong password`, (done) => {
      request.post('/')
        .send({
          query: `mutation { login(email: "${testUser.email}", password: "${wrongCredentials.password}") { token } }`
        })
        .expect(200)
        .end((err, res) => {
          if (err) return err;
          assert(res.body.errors, 'Error expected');
          done();
        })
    });

    it(`Fails logging in for an unexistent email and an existent password`, (done) => {
      request.post('/')
        .send({
          query: `mutation { login(email: "${wrongCredentials.email}", password: "${testUser.password}") { token } }`
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
