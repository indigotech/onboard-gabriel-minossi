import { UserInputModel, UserModel } from '@src/business/model/user.model';
import { UserUseCase } from '@src/business/rule/user/user.use-case';
import { HttpError } from '@src/error';
import { Service } from 'typedi';

@Service()
export class CreateUserUseCase extends UserUseCase<UserInputModel, UserModel> {
  async exec(input: UserInputModel): Promise<UserModel> {
    const isValid = (email: string): boolean => /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
    const isWeak = (password: string): boolean =>
      !(password.length >= 7 && /^.*(([A-Z].*[a-z])|([a-z].*[A-Z]))+.*$/.test(password));

    if (!isValid(input.email)) {
      throw new HttpError(400, 'Invalid email');
    }
    if (isWeak(input.password)) {
      throw new HttpError(
        400,
        'Password must be at least 7 characters long and must contain at last one letter and one digit',
      );
    }

    try {
      if (await this.dataSource.findOne({ email: input.email })) {
        throw new HttpError(400, 'Email already in use');
      }
    } catch (error) {
      if (error.code !== 404) {
        throw error;
      }
    }

    return this.dataSource.insert(input);
  }
}
