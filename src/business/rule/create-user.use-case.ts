import { UserInputModel, UserModel } from '@src/business/model/user.model';
import { UseCase } from '@src/business/rule/use-case';
import { UserDbDataSource } from '@src/data/source/user.db.datasource';
import { HttpError } from '@src/error';
import { encrypt } from '@src/helpers';
import { Inject, Service } from 'typedi';

@Service()
export class CreateUserUseCase extends UseCase<UserInputModel, UserModel> {
  @Inject()
  protected readonly dataSource: UserDbDataSource;

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

    const password = encrypt(input.password);

    return this.dataSource.insert({ ...input, password });
  }
}
