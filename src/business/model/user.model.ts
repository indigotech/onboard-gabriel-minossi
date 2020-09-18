export interface UserInputModel {
  name: string;
  email: string;
  password: string;
  birthDate: string;
  cpf: string;
}

export interface UserModel {
  id: string;
  name: string;
  birthDate: string;
  email: string;
  cpf: string;
}

export interface GetUsersInputModel {
  count: number;
  skip: number;
}

export interface UsersModel {
  users: UserModel[];
  hasMore: boolean;
  skippedUsers: number;
  totalUsers: number;
}

export interface GetUserInputModel {
  id: string;
}

export interface UserTokenData {
  id: string;
}

export interface LoginInputModel {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginModel {
  token: string;
  user: UserModel;
}
