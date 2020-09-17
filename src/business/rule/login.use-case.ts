import { LoginInput } from '@src/api/graphql/login.input';
import { LoginModel } from '@src/business/model/user.model';
import { UseCase } from '@src/business/rule/use-case';
import { User } from '@src/data/entity/User';
import { UserDbDataSource } from '@src/data/source/user.db.datasource';
import { HttpError } from '@src/error';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Inject, Service } from 'typedi';

@Service()
export class LoginUseCase extends UseCase<LoginInput, LoginModel> {
  @Inject()
  protected readonly dataSource: UserDbDataSource;

  async exec(input: LoginInput): Promise<LoginModel> {
    const isValid = (email: string): boolean => /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
    if (!isValid(input.email)) {
      throw new HttpError(400, 'Invalid email');
    }

    let user: User;
    try {
      user = await this.dataSource.findOne({ email: input.email });
    } catch (error) {
      if (error.code == 404) {
        throw new HttpError(401, 'Invalid Credentials');
      }
    }
    if (!bcrypt.compareSync(input.password, user.password)) {
      throw new HttpError(401, 'Invalid Credentials');
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: input.rememberMe ? '1w' : '1h' });
    return { user, token };
  }
}
