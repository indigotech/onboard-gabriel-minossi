import { GetUserInputModel, UserModel } from '@src/business/model/user.model';
import { UserUseCase } from '@src/business/rule/user/user.use-case';
import { HttpError } from '@src/error';
import { Service } from 'typedi';

@Service()
export class GetUserUseCase extends UserUseCase<GetUserInputModel, UserModel> {
  async exec(input: GetUserInputModel): Promise<UserModel> {
    if (!input.id.length) {
      throw new HttpError(400, 'Bad user id');
    }
    return await this.dataSource.findOne(input);
  }
}
