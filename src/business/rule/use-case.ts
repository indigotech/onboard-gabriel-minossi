import { DataSource } from '@src/data/source/datasource';

export abstract class UseCase<TRequest, TResult> {
  protected abstract readonly dataSource: DataSource<any>;
  abstract exec(requestObject: TRequest): Promise<TResult>;
}
