import { Field, InputType } from 'type-graphql';

export interface LoginInputModel {
  email: string;
  password: string;
  rememberMe?: boolean;
}

@InputType({ description: 'Informações para realizar login' })
export class LoginInput implements LoginInputModel {
  @Field({ description: 'E-mail' })
  email: string;

  @Field({ description: 'Senha' })
  password: string;

  @Field({ description: 'Extender a validade do token' })
  rememberMe?: boolean;
}
