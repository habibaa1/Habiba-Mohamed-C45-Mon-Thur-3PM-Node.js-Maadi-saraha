import { TokenTypeEnum } from "../common/enums/index.js";
import { decodeToken } from "../common/utils/security/token.security.js"; 
import { UserModel } from "../DB/models/user.model.js";

export const authentication = (tokenType = TokenTypeEnum.Access) => {
    return async (req, res, next) => {
        try {
            const [schema, credentials] = req.headers.authorization?.split(" ") || [];

            if (!schema || !credentials) {
                return res.status(401).json({ message: "Please login first" });
            }

            if (schema === 'Bearer') {
                const signature = tokenType === TokenTypeEnum.Access 
                    ? "kcfrioeyifmn4ui3tr8_User" 
                    : "kcfrioeyifmn4ui3tr8_User_RE"; 

                const payload = decodeToken({ token: credentials, signature });
                
                if (!payload || !payload.sub) { 
                    return res.status(401).json({ message: "Invalid or expired token" });
                }

                const user = await UserModel.findById(payload.sub); 
                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }

                req.user = user; 
                return next(); 
            }

            return res.status(400).json({ message: "Invalid authentication schema" });

        } catch (error) {
            return res.status(500).json({ message: "Internal Auth Error", error: error.message });
        }
    }
}

export const authorization = (accessRoles = []) => {
    return async (req, res, next) => {
        if (!req.user || !accessRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "You are not authorized" });
        }
        next();
    }
}