import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getConnection } from 'typeorm';

jest.mock('got', () => {
  return {
    post: jest.fn(),
  };
});

const GRAPHQL_ENDPOINT = '/graphql';
const EMAIL = 'bear04012@gmail.com';
const PASSWORD = '12345';

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await getConnection().dropDatabase();
    app.close();
  })

  describe('createAccount', () => {
    it('should create account', () => {
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({
        query: `
        mutation {
          createAccount(input:{
            email:"${EMAIL}",
            password:"${PASSWORD}",
            role: Client
          }) {
            ok
            error
          }
        }
        `
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.createAccount.ok).toBe(true);
        expect(res.body.data.createAccount.error).toBe(null);
      });
    });
    it('should fail if account already exists', () => {
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({
        query: `
        mutation {
          createAccount(input:{
            email:"${EMAIL}",
            password:"${PASSWORD}",
            role: Client
          }) {
            ok
            error
          }
        }
        `
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.createAccount.ok).toBe(false);
        expect(res.body.data.createAccount.error).toBe('User Already Exists');
      });
    });
  });

  describe('login', () => {
    it('should login with correct email and password', async () => {
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({
        query: `
        mutation {
          login(input:{
            email:"${EMAIL}",
            password:"${PASSWORD}",
          }) {
            ok
            error
            token
          }
        }
      `,
      })
      .expect(200)
      .expect(res => {
        const { body: { data: { login }} } = res;
        expect(login.ok).toBe(true);
        expect(login.error).toBe(null);
        expect(login.token).toEqual(expect.any(String));
        jwtToken = login.token;
      });
    });

    it('should fail log in', async () => {
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({
        query: `
        mutation {
          login(input:{
            email:"hi",
            password:"hey yo",
          }) {
            ok
            error
            token
          }
        }
      `,
      })
      .expect(200)
      .expect(res => {
        const { body: { data: { login }} } = res;
        expect(login.ok).toBe(false);
        expect(login.error).toBe('User Not Found');
        expect(login.token).toBe(null);
      });
    });
  });

  describe('userProfile', () => {
    // console.log(token);
  });
  it.todo('me');
  it.todo('verifyEmail');
  it.todo('editProfile');
});
