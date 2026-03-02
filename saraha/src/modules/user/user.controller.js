import { Router } from "express";
import { authorization } from "../../middlewares/authorization.middleware.js";
import { successResponse } from "../../common/utils/index.js";
import { authentication } from "../../middlewares/authentication.middleware.js";
import { TokenTypeEnum } from "../../common/enums/security.enum.js";
import { endpoint } from "./user.authorization.js";
import { upload } from "../../common/utils/multer.js"; 
import { profile, rotateToken, updateProfilePicture } from "./user.service.js"; 

const router = Router()

router.get(
    "/profile",
    authentication(), 
    authorization(endpoint.profile),
    async (req, res, next) => {
        const account = await profile(req.user)
        return successResponse({ res, data: { account } })
    })

router.get("/rotate-token",
    authentication(TokenTypeEnum.Refresh),
    async (req, res, next) => {
        const credentials = await rotateToken(req.user, `${req.protocol}://${req.host}`)
        return successResponse({ res, data: { credentials } })
    })
router.patch(
    "/profile-picture",
    authentication(), 
    upload.single('image'), 
    async (req, res, next) => {
        const account = await updateProfilePicture(req.user, req.file);
        return successResponse({ res, data: { account } });
    }
);
export default router