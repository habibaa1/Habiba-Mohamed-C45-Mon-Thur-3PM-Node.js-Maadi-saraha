import jwt from 'jsonwebtoken';
import * as config from '../../../../config/config.service.js';
import {RoleEnum} from '../../enums/user.enum.js';
import {TokenTypeEnum , AudienceEnum} from '../../enums/security.enum.js';


export const generateToken = ({
    payload = {},
    secret = config.User_TOKEN_SECRET_KEY,
    options = {}
} = {}) => {
    return jwt.sign(payload, secret, options);
};

export const verifyToken = ({ token, secret, options = {} }) => {
    try {
        return jwt.verify(token, secret, options);
    } catch (error) {
        return null;
    }
};


export const getTokenSignature = async (role) => {
    let accessSignature = config.User_TOKEN_SECRET_KEY;
    let refreshSignature = config.User_REFRESH_TOKEN_SECRET_KEY;
    let audience = AudienceEnum.User;

    if (role === RoleEnum.Admin) {
        accessSignature = config.System_TOKEN_SECRET_KEY;
        refreshSignature = config.System_REFRESH_TOKEN_SECRET_KEY;
        audience = AudienceEnum.Admin;
    }

    return { accessSignature, refreshSignature, audience };
};


export const createLoginCredentials = async ({ user, issuer }) => {
    const { accessSignature, refreshSignature, audience } = await getTokenSignature(user.role);

    const accessToken = await generateToken({
        payload: { sub: user._id, role: user.role },
        secret: accessSignature,
        options: {
            issuer,
            audience: String(audience),
            expiresIn: config.ACCESS_EXPIRES_IN 
        }
    });

    const refreshToken = await generateToken({ 
        payload: { sub: user._id },
        secret: refreshSignature,
        options: {
            issuer,
            audience: String(audience),
            expiresIn: config.REFRESH_EXPIRES_IN 
        }
    });

    return { accessToken, refreshToken };
};

export const decodeToken = ({ token, signature }) => {
    try {
        return jwt.verify(token, signature); 
    } catch (error) {
        console.log("JWT Error:", error.message);
        return null;
    }
}; 