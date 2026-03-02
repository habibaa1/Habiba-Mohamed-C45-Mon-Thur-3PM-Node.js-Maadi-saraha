export const ConflictException = ({ message }) => {
    const error = new Error(message);
    error.status = 409;
    return error;
};

export const NotFoundException = ({ message }) => {
    const error = new Error(message);
    error.status = 404;
    return error;
};
export const BadRequestException = ({ message, cause }) => {
    const error = new Error(message);
    error.status = 400; 
    error.cause = cause;
    return error;
};