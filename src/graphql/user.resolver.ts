import { HttpError } from '@src/error';
import { User } from '@src/graphql/user.type';
import { encrypt } from '@src/helpers';
import { LoginModel } from '@src/model/user.model';
import { User as RepositoryUser } from '@src/typeorm/entity/User';
import * as bcrypt from 'bcrypt';
import { Context } from 'graphql-yoga/dist/types';
import * as jwt from 'jsonwebtoken';
import { Arg, Ctx, ID, Mutation, Query, Resolver } from 'type-graphql';
import { getRepository } from 'typeorm';
import { CreateUserInput } from './create-user.input';
import { LoginInput } from './login.input';
import { Login } from './login.type';
import { UsersInput } from './users.input';
import { Users } from './users.type';

@Resolver(() => User)
export class UserResolver {
  private userRepository = getRepository(RepositoryUser);

  private getVerification(context: Context) {
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
  }

  @Query(() => String, { description: 'Query básica de hello world' })
  hello() {
    return 'Hello!';
  }

  @Mutation(() => Login, { description: 'Autenticação de um usuário no sistema' })
  async login(@Arg('data') { email, password, rememberMe }: LoginInput): Promise<LoginModel> {
    const isValid = (email: string): boolean => /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
    if (!isValid(email)) {
      throw new HttpError(400, 'Invalid email');
    }

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new HttpError(401, 'Invalid Credentials');
    }
    if (!bcrypt.compareSync(password, user.password)) {
      throw new HttpError(401, 'Invalid Credentials');
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: rememberMe ? '1w' : '1h' });
    return { user, token };
  }

  @Query(() => User, { description: 'Busca o usuário que possui o id = id' })
  async user(@Arg('id', () => ID) id: string, @Ctx() context: Context) {
    this.getVerification(context);

    const user = id && (await this.userRepository.findOne({ id }));
    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    delete user.password;
    return user;
  }

  @Query(() => Users, { description: 'Busca count usuários depois de skip em ordem alfabética' })
  async users(@Arg('data') { count, skip = 0 }: UsersInput, @Ctx() context: Context) {
    this.getVerification(context);

    const [users, usersCount] = await this.userRepository.findAndCount({ take: count, skip, order: { name: 'ASC' } });

    const hasMore = usersCount - skip - count > 0;

    return { users, hasMore, skippedUsers: skip, totalUsers: usersCount };
  }

  @Mutation(() => User, { description: 'Cria um novo usuário' })
  async createUser(@Arg('data') { name, email, password, birthDate, cpf }: CreateUserInput, @Ctx() context: Context) {
    this.getVerification(context);

    const isValid = (email: string): boolean => /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
    const isWeak = (password: string): boolean =>
      !(password.length >= 7 && /^.*(([A-Z].*[a-z])|([a-z].*[A-Z]))+.*$/.test(password));

    if (!isValid(email)) {
      throw new HttpError(400, 'Invalid email');
    }
    if (isWeak(password)) {
      throw new HttpError(
        400,
        'Password must be at least 7 characters long and must contain at last one letter and one digit',
      );
    }

    if (await this.userRepository.findOne({ where: { email: email } })) {
      throw new HttpError(400, 'Email already in use');
    }

    const newUser = {
      name: name,
      email: email.toLowerCase(),
      password: encrypt(password),
      birthDate: birthDate,
      cpf: cpf,
    };
    return this.userRepository.save(newUser);
  }
}
