import { Router } from "express";
import { authorization } from "../../middlewares/authorization.middleware.js";
import { successResponse } from "../../common/utils/index.js";
import { authentication } from "../../middlewares/authentication.middleware.js";
import { TokenTypeEnum } from "../../common/enums/security.enum.js";
import { endpoint } from "./user.authorization.js";
import { upload } from "../../common/utils/multer.js"; 
import * as userService from "./user.service.js"; 

const router = Router();

router.get(
    "/profile/:profileId", 
    authentication(), 
    async (req, res, next) => {
        try {
            const account = await userService.getProfile(req);
            return successResponse({ res, data: { account } });
        } catch (error) { next(error); }
    }
);

router.get("/rotate-token",
    authentication(TokenTypeEnum.Refresh),
    async (req, res, next) => {
        try {
            const credentials = await userService.rotateToken(req.user, `${req.protocol}://${req.host}`);
            return successResponse({ res, data: { credentials } });
        } catch (error) { next(error); }
    }
);

router.patch(
    "/profile-picture",
    authentication(), 
    upload.single('image'), 
    async (req, res, next) => {
        try {
            const account = await userService.updateProfilePicture(req.user, req.file);
            return successResponse({ res, message: "Profile picture updated successfully", data: { account } });
        } catch (error) { next(error); }
    }
);

router.patch(
    "/cover-pictures",
    authentication(), 
    upload.array('covers', 2), 
    async (req, res, next) => {
        try {
            const result = await userService.uploadCoverImages(req);
            return successResponse({ res, data: result });
        } catch (error) { next(error); }
    }
);

router.delete(
    "/profile-picture",
    authentication(),
    async (req, res, next) => {
        try {
            const result = await userService.deleteProfilePic(req.user);
            return successResponse({ res, data: result });
        } catch (error) { next(error); }
    }
);

export default router;