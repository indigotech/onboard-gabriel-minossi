import { UsersInputModel } from '@src/model/user.model';
import { Field, InputType, Int } from 'type-graphql';

@InputType()
export class UsersInput implements UsersInputModel {
  @Field(() => Int, { description: 'User name' })
  count: number;

  @Field(() => Int, { description: 'User name' })
  skip: number;
}
