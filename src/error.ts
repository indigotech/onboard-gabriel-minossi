import { GraphQLError } from 'graphql';
import { GraphQLServer } from 'graphql-yoga';

export interface HttpError {
  code: number;
  message: string;
  additionalInfo?: string;
}

export class HttpError extends Error implements HttpError {
  code: number;
  message: string;
  additionalInfo?: string

  constructor(code: number, message: string, error?: Error) {
    super();
    this.name = 'HttpError';
    this.code = code;
    this.message = message;
    this.additionalInfo = error && error.name + (error.message && `: ${error.message}`);
  }
}

export const formatError = (error: GraphQLError) => {
  if (error.originalError) {
    return error.originalError;
  } else {
    return {
      name: 'Internal server error',
      code: 500,
      message: error.name,
      additionalInfo: error.message,
    }
  }
}
