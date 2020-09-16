import { Field, InputType } from 'type-graphql';

@InputType({ description: 'Informações para realizar login' })
export class LoginInput {
  @Field({ description: 'E-mail' })
  email: string;

  @Field({ description: 'Senha' })
  password: string;

  @Field({ description: 'Extender a validade do token', nullable: true })
  rememberMe?: boolean;
}
