import { User } from '@src/entity/User';
import { HttpError } from '@src/error';
import { encrypt } from '@src/helpers';
import * as bcrypt from 'bcrypt';
import { Context } from 'graphql-yoga/dist/types';
import * as jwt from 'jsonwebtoken';
import { getRepository, Repository } from 'typeorm';
import { HelloResolver } from './hello.resolver';

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

const getVerification = (context: Context) => {
  const auth = context.request.get('Authorization');
  if (!auth) {
    throw new HttpError(401, 'You must be logged in', new jwt.JsonWebTokenError(''));
  }

  const token = auth.replace('Bearer ', '');
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new HttpError(401, 'Invalid token. Try loggin in again', error);
  }
};

const resolvers = {
  Query: {
    hello: () => 'Hello!',
    user: async (_, { id }, context: Context) => {
      getVerification(context);

      const userRepository: Repository<User> = getRepository(User);
      const user = id && (await userRepository.findOne({ id }));
      if (!user) {
        throw new HttpError(404, 'User not found');
      }

      delete user.password;
      return user;
    },
    users: async (_, { count, skip }, context: Context) => {
      getVerification(context);

      count = count || 10;
      skip = skip || 0;

      const userRepository: Repository<User> = getRepository(User);
      const [users, usersCount] = await userRepository.findAndCount({ take: count, skip, order: { name: 'ASC' } });

      const hasMore = usersCount - skip - count > 0;

      return { users, hasMore, skippedUsers: skip, totalUsers: usersCount };
    },
  },
  Mutation: {
    login: async (_, { email, password, rememberMe }) => {
      const isValid = (email: string): boolean => /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
      if (!isValid(email)) {
        throw new HttpError(400, 'Invalid email');
      }

      const userRepository: Repository<User> = getRepository(User);
      const user = await userRepository.findOne({ where: { email } });
      if (!user) {
        throw new HttpError(401, 'Invalid Credentials');
      }
      if (!bcrypt.compareSync(password, user.password)) {
        throw new HttpError(401, 'Invalid Credentials');
      } else {
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: rememberMe ? '1w' : '1h' });
        return { user, token };
      }
    },
    createUser: async (_, { user }, context: Context) => {
      getVerification(context);

      const isValid = (email: string): boolean => /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
      const isWeak = (password: string): boolean =>
        !(password.length >= 7 && /^.*(([A-Z].*[a-z])|([a-z].*[A-Z]))+.*$/.test(password));

      if (!isValid(user.email)) {
        throw new HttpError(400, 'Invalid email');
      }
      if (isWeak(user.password)) {
        throw new HttpError(
          400,
          'Password must be at least 7 characters long and must contain at last one letter and one digit',
        );
      }

      const userRepository = getRepository(User);

      if (await userRepository.findOne({ where: { email: user.email } })) {
        throw new HttpError(400, 'Email already in use');
      }

      const newUser = {
        name: user.name,
        email: user.email.toLowerCase(),
        password: encrypt(user.password),
        birthDate: user.birthDate,
        cpf: user.cpf,
      };
      return userRepository.save(newUser);
    },
  },
};

export const graphQLProps = {
  typeDefs,
  resolvers,
  context: (request) => request,
};
