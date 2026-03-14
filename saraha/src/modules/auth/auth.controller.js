import { Router } from 'express';
import { successResponse } from '../../common/utils/index.js';
import * as authService from './auth.service.js';
import * as validators from './auth.validation.js';
import { authentication } from '../../middlewares/authentication.middleware.js';
import { validation } from '../../middlewares/validation.middleware.js';

const router = Router();

// 1. Signup Route

router.post("/signup", async (req, res, next) => {
    try {
        const signupResult = await authService.signup(req.body); 
        
        return successResponse({
            res,
            status: 201,
            message: "User created successfully",
            data: { account: signupResult }
        });
    } catch (error) {
        next(error);
    }
});

// 2. Login Route
router.post("/login", async (req, res, next) => {
    try {
        const result = await authService.login(req.body, "Saraha_App_v1"); 
        return successResponse({
            res, message: "Logged in successfully", data: result 
        });
    } catch (error) { next(error); }
});

// 3. Verify Email
router.post("/verify-email", async (req, res, next) => {
    try {
        const result = await authService.verifyEmail(req.body);
        return successResponse({ res, message: "Email verified successfully", data: result });
    } catch (error) { next(error); }
});
// 3.5 Forget Password 
router.post("/forget-password", async (req, res, next) => {
    try {
        const result = await authService.forgetPassword(req.body.email);
        return successResponse({ res, message: "OTP sent successfully", data: result });
    } catch (error) { next(error); }
});
// 4. Update Password 
router.patch("/update-password", 
    authentication(), 
    validation(validators.updatePasswordSchema), 
    async (req, res, next) => {
        try {
            const result = await authService.updatePassword(req.body, req.user);
            return successResponse({
                res,
                message: "Password updated successfully",
                data: result
            });
        } catch (error) { next(error); }
    }
);
//reset password
router.patch("/reset-password", 
    validation(validators.resetPasswordSchema),
    async (req, res, next) => {
        try {
            const result = await authService.resetPassword(req.body);
            return successResponse({
                res,
                message: "Password reset successfully",
                data: result
            });
        } catch (error) { next(error); }
    }
);
// 5. Signup with Gmail
router.post("/signup/gmail", async (req, res, next) => {
    try {
        const { idToken } = req.body;
        const result = await authService.signupWithGmail(idToken, `${req.protocol}://${req.get('host')}`);
        const { status, Credential } = result;
        return successResponse({ res, status, data: { ...Credential } });
    } catch (error) { next(error); }
});

export default router;