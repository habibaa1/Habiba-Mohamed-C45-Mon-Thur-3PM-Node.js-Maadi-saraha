import Joi from 'joi';

export const updatePasswordSchema = Joi.object({
    body: Joi.object({
        email: Joi.string().email().required(),
        otp: Joi.string().length(6).required(),
        newPassword: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(), // مثال لتعقيد الباسورد
        confirmPassword: Joi.valid(Joi.ref('newPassword')).required()
            .messages({ 'any.only': 'Confirm password must match new password' })
    }).required()
});