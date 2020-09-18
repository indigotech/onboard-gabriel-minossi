import { UserModel } from '@src/business/model/user.model';
import { UseCase } from '@src/business/rule/use-case';
import { UserDbDataSource } from '@src/data/source/user.db.datasource';
import { Service } from 'typedi';

@Service()
export abstract class UserUseCase<TRequest, TResponse> implements UseCase<TRequest, TResponse, UserModel> {
  constructor(readonly dataSource: UserDbDataSource) {
    this.dataSource = dataSource;
  }

  abstract async exec(input: TRequest): Promise<TResponse>;
}
