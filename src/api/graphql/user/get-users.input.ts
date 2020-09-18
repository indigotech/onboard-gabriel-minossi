import { GetUsersInputModel } from '@src/business/model/user.model';
import { Field, InputType, Int } from 'type-graphql';

@InputType({ description: 'Objeto de entrada para users' })
export class GetUsersInput implements GetUsersInputModel {
  @Field(() => Int, { description: 'Número de usuários', defaultValue: 10 })
  count: number;

  @Field(() => Int, { description: 'Quantos usuários devem ser pulados', defaultValue: 0 })
  skip: number;
}
