export interface httpError {
    code: number;
    message: string;
    additionalInfo?: string;
}

export class httpError extends Error implements httpError {
    code: number;
    message: string;
    additionalInfo?: string

    constructor(code: number, message: string, error?: Error) {
        super();
        this.name = 'httpError';
        this.code = code;
        this.message = message;
        this.additionalInfo = error && error.message + error.stack
    }
}

export const formatError = (httpCode: number, message: string, error?: Error): httpError => {
    return new httpError(httpCode, message, error);
}
