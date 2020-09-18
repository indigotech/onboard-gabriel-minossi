import { GetUserInputModel } from '@src/business/model/user.model';
import { Field, ID, InputType } from 'type-graphql';

@InputType({ description: 'Objeto de entrada para users' })
export class GetUserInput implements GetUserInputModel {
  @Field(() => ID, { description: 'Número de usuários', defaultValue: 10 })
  id: string;
}
