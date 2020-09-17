import { UserModel } from '@src/business/model/user.model';
import { UseCase } from '@src/business/rule/use-case';
import { UserDbDataSource } from '@src/data/source/user.db.datasource';
import { Container, Service } from 'typedi';
import { HttpError } from '@src/error';

@Service()
export class UserUseCase extends UseCase<string, UserModel> {
  protected readonly dataSource = Container.get(UserDbDataSource);

  async exec(id: string): Promise<UserModel> {
    if (!id.length) {
      throw new HttpError(400, 'Bad user id');
    }
    const user = await this.dataSource.findOne({ id });
    delete user.password;
    return user;
  }
}
