import { CreateUserInput } from '@src/api/graphql/create-user.input';
import { LoginInput } from '@src/api/graphql/login.input';
import { Login } from '@src/api/graphql/login.type';
import { User } from '@src/api/graphql/user.type';
import { UsersInput } from '@src/api/graphql/users.input';
import { Users } from '@src/api/graphql/users.type';
import { CreateUserUseCase } from '@src/business/rule/create-user.use-case';
import { LoginUseCase } from '@src/business/rule/login.use-case';
import { UserUseCase } from '@src/business/rule/user.use-case';
import { UsersUseCase } from '@src/business/rule/users.use-case';
import { Arg, Authorized, ID, Mutation, Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';

@Service()
@Resolver(() => User)
export class UserResolver {
  constructor(
    private loginUseCase: LoginUseCase,
    private userUseCase: UserUseCase,
    private usersUseCase: UsersUseCase,
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
  @Query(() => User)
  async user(@Arg('id', () => ID) id: string): Promise<User> {
    return this.userUseCase.exec(id);
  }

  @Authorized()
  @Query(() => Users, { description: 'Busca count usuários depois de skip em ordem alfabética' })
  async users(@Arg('data') data: UsersInput): Promise<Users> {
    return this.usersUseCase.exec(data);
  }

  @Authorized()
  @Mutation(() => User, { description: 'Cria um novo usuário' })
  async createUser(@Arg('data') data: CreateUserInput): Promise<User> {
    return this.createUserUseCase.exec(data);
  }
}
