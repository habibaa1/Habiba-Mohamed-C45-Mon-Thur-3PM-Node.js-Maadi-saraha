import joi from 'joi';

export const resetPasswordSchema = {
    body: joi.object({
        email: joi.string().email().required(),
        otp: joi.string().length(6).required(),
        newPassword: joi.string().required(),
        confirmPassword: joi.string().valid(joi.ref('newPassword')).required()
    }).required()
};

export const updatePasswordSchema = {
    body: joi.object({
        oldPassword: joi.string().required(),
        newPassword: joi.string().required(),
        confirmPassword: joi.string().valid(joi.ref('newPassword')).required()
    }).required()
};