import { CreateUserInput } from '@src/api/graphql/user/create-user.input';
import { GetUserInput } from '@src/api/graphql/user/get-user.input';
import { GetUsersInput } from '@src/api/graphql/user/get-users.input';
import { LoginInput } from '@src/api/graphql/user/login.input';
import { Login } from '@src/api/graphql/user/login.type';
import { User } from '@src/api/graphql/user/user.type';
import { Users } from '@src/api/graphql/user/users.type';
import { CreateUserUseCase } from '@src/business/rule/user/create-user.use-case';
import { GetUserUseCase } from '@src/business/rule/user/get-user.use-case';
import { GetUsersUseCase } from '@src/business/rule/user/get-users.use-case';
import { LoginUseCase } from '@src/business/rule/user/login.use-case';
import { Arg, Authorized, Mutation, Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';

@Service()
@Resolver(() => User)
export class UserResolver {
  constructor(
    private loginUseCase: LoginUseCase,
    private userUseCase: GetUserUseCase,
    private usersUseCase: GetUsersUseCase,
    private createUserUseCase: CreateUserUseCase,
  ) {}

  @Query(() => String, { description: 'Query básica de hello world' })
  hello() {
    return 'Hello!';
  }

  @Mutation(() => Login, { description: 'Autenticação de um usuário no sistema' })
  async login(@Arg('data') data: LoginInput): Promise<Login> {
    return this.loginUseCase.exec(data);
  }

  @Authorized()
  @Query(() => User, { description: 'Busca um usuário com um determinado id' })
  async user(@Arg('data') data: GetUserInput): Promise<User> {
    return this.userUseCase.exec(data);
  }

  @Authorized()
  @Query(() => Users, { description: 'Busca count usuários depois de skip em ordem alfabética' })
  async users(@Arg('data') data: GetUsersInput): Promise<Users> {
    return this.usersUseCase.exec(data);
  }

  @Authorized()
  @Mutation(() => User, { description: 'Cria um novo usuário' })
  async createUser(@Arg('data') data: CreateUserInput): Promise<User> {
    return this.createUserUseCase.exec(data);
  }
}
