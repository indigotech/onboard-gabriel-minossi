import { CreateUserInput } from '@src/api/graphql/create-user.input';
import { LoginInput } from '@src/api/graphql/login.input';
import { Login } from '@src/api/graphql/login.type';
import { User } from '@src/api/graphql/user.type';
import { UsersInput } from '@src/api/graphql/users.input';
import { Users } from '@src/api/graphql/users.type';
import { LoginModel } from '@src/business/model/user.model';
import { CreateUserUseCase } from '@src/business/rule/create-user.use-case';
import { User as RepositoryUser } from '@src/data/entity/User';
import { HttpError } from '@src/error';
import * as bcrypt from 'bcrypt';
import { Context } from 'graphql-yoga/dist/types';
import * as jwt from 'jsonwebtoken';
import { Arg, Authorized, Ctx, ID, Mutation, Query, Resolver } from 'type-graphql';
import { Container, Service } from 'typedi';
import { getRepository } from 'typeorm';

@Service()
@Resolver(() => User)
export class UserResolver {
  private createUserUseCase = Container.get(CreateUserUseCase);

  private userRepository = getRepository(RepositoryUser);

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

  @Authorized()
  @Query(() => User, { description: 'Busca o usuário que possui o id = id' })
  async user(@Arg('id', () => ID) id: string, @Ctx() context: Context) {
    const user = id && (await this.userRepository.findOne({ id }));
    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    delete user.password;
    return user;
  }

  @Authorized()
  @Query(() => Users, { description: 'Busca count usuários depois de skip em ordem alfabética' })
  async users(@Arg('data') { count, skip = 0 }: UsersInput, @Ctx() context: Context) {
    const [users, usersCount] = await this.userRepository.findAndCount({ take: count, skip, order: { name: 'ASC' } });

    const hasMore = usersCount - skip - count > 0;

    return { users, hasMore, skippedUsers: skip, totalUsers: usersCount };
  }

  @Authorized()
  @Mutation(() => User, { description: 'Cria um novo usuário' })
  async createUser(@Arg('data') data: CreateUserInput, @Ctx() context: Context) {
    return this.createUserUseCase.exec(data);
  }
}
