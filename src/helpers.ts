import { HttpError } from '@src/error';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

export const encrypt = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(6));
};

export const getVerification = ({ context }) => {
  const auth = context.request.get('Authorization');
  if (!auth) {
    throw new HttpError(401, 'You must be logged in', new jwt.JsonWebTokenError(''));
  }

  const token = auth.replace('Bearer ', '');
  try {
    return !!jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new HttpError(401, 'Invalid token. Try logging in again', error);
  }
};
