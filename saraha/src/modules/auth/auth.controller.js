import { Router } from 'express';
import { successResponse } from '../../common/utils/index.js';
import { signup, login, signupWithGmail, verifyEmail } from './auth.service.js';

const router = Router();

// 1. Signup Route
router.post("/signup", async (req, res, next) => {
    try {
        const result = await signup(req.body);
        return successResponse({
            res,
            status: 201,
            message: "User created successfully",
            data: { account: result }
        });
    } catch (error) {
        next(error);
    }
});

// 2. Login Route
router.post("/login", async (req, res, next) => {
    try {
        const result = await login(req.body, "Saraha_App_v1"); 

        return successResponse({
            res,
            message: "Logged in successfully",
            data: result 
        });
    } catch (error) {
        next(error);
    }
});

router.post("/verify-email", async (req, res, next) => {
    try {
        const result = await verifyEmail(req.body);
        return successResponse({ 
            res, 
            message: "Email verified successfully", 
            data: result 
        });
    } catch (error) {
        next(error); 
    }
});
router.post("/signup/gmail", async (req, res, next) => {
    try {
        const { idToken } = req.body;
        
        console.log("Token received in Controller:", idToken);

        const result = await signupWithGmail(idToken, `${req.protocol}://${req.get('host')}`);
        
        const { status, Credential } = result;
        return successResponse({ res, status, data: { ...Credential } });
    } catch (error) {
        next(error); 
    }
});

export default router