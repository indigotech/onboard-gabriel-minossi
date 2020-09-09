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
        this.additionalInfo = error && error.message + error.stack
    }
}

export const formatError = (httpCode: number, message: string, error?: Error): HttpError => {
    return new HttpError(httpCode, message, error);
}
