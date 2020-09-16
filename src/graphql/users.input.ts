import { Field, InputType, Int } from 'type-graphql';

@InputType()
export class UsersInput {
  @Field(() => Int, { description: 'User name', defaultValue: 10 })
  count: number;

  @Field(() => Int, { description: 'User name', defaultValue: 0 })
  skip: number;
}
