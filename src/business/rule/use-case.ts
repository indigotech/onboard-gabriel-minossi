import { DataSource } from '@src/data/source/datasource';

export interface UseCase<TRequest, TResult, TSource> {
  readonly dataSource: DataSource<TSource>;
  exec(requestObject: TRequest): Promise<TResult>;
}
