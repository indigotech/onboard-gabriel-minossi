import { User } from '@src/entity/User';
import { HttpError } from '@src/error';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Arg, Mutation, Query, Resolver } from 'type-graphql';
import { getRepository, Repository } from 'typeorm';
import { LoginInput } from './login.input';
import { Login, LoginModel } from './login.type';

@Resolver()
export class UserResolver {
  @Query(() => String)
  public static hello() {
    return 'Hello!';
  }

  @Mutation(() => Login, { description: 'Authenticate' })
  public static async login(@Arg('data') data: LoginInput): Promise<LoginModel> {
    const { email, password, rememberMe } = data;

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
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: rememberMe ? '1w' : '1h' });
    return { user, token };
  }
}
