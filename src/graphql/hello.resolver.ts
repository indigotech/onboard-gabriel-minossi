import { Query, Resolver } from 'type-graphql';

@Resolver()
export class HelloResolver {
  @Query(() => String)
  public static hello() {
    return 'Hello!';
  }
}
