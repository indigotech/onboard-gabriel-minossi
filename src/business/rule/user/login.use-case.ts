import { LoginInputModel, LoginModel } from '@src/business/model/user.model';
import { UserUseCase } from '@src/business/rule/user/user.use-case';
import { User } from '@src/data/entity/User';
import { HttpError } from '@src/error';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Service } from 'typedi';

@Service()
export class LoginUseCase extends UserUseCase<LoginInputModel, LoginModel> {
  async exec(input: LoginInputModel): Promise<LoginModel> {
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
