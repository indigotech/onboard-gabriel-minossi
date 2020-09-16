import { Field, InputType, Int } from 'type-graphql';

@InputType()
export class UsersInput {
  @Field(() => Int, { description: 'User name', nullable: true })
  count: number;

  @Field(() => Int, { description: 'User name', nullable: true })
  skip: number;
}
