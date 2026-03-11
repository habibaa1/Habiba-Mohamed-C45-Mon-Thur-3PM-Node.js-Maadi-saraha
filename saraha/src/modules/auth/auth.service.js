import { HashApproachEnum } from "../../common/enums/security.enum.js";
import { ProviderEnum, RoleEnum } from "../../common/enums/user.enum.js";
import { ConflictException, NotFoundException , BadRequestException } from "../../common/utils/error.utils.js"; 
import { encrypt } from "../../common/utils/security/encryption.security.js";
import { UserModel, findOne, createOne } from "../../DB/index.js";
import { compareHash, generateHash } from "../../common/utils/security/hash.security.js";
import { createLoginCredentials , generateToken  } from "../../common/utils/security/token.security.js";
import { OAuth2Client } from "google-auth-library";
import { verify } from "argon2";
import { customAlphabet } from 'nanoid';
import { sendEmail } from "../../common/utils/email.js";
import { redisClient , saveOTP } from "../../DB/radis.connection.js";

export const signup = async (inputs) => {
    const { username, email, password, confirmPassword, phone } = inputs;

    const otp = customAlphabet('0123456789', 6)(); 

    await redisClient.setEx(`otp:${email}`, 300, otp);

    const user = await createOne({
        model: UserModel,
        data: { 
            firstName: username.split(' ')[0], 
            lastName: username.split(' ')[1] || '',
            email,
            password, 
            confirmPassword, 
            phone,
            provider: ProviderEnum.System
        }
    });

    await sendEmail({
        to: email,
        subject: "Verification Code",
        html: `<h1>Welcome to Saraha!</h1><p>Your code: <b>${otp}</b></p>`
    });

    return user; 
};

export const verifyEmail = async (inputs) => {
    const { email, otp } = inputs;

    const user = await findOne({ model: UserModel, filter: { email } });
    if (!user) throw NotFoundException({ message: "User not found" });

    const cachedOtp = await redisClient.get(`otp:${email}`);

    if (!cachedOtp || cachedOtp !== otp) {
        throw BadRequestException({ message: "Invalid or expired OTP" });
    }

    await UserModel.updateOne({ email }, { confirmEmail: true });
    await redisClient.del(`otp:${email}`);

    return { message: "Email verified successfully" };
};
export const login = async (inputs, deviceName) => {
    const { email, password } = inputs;
    const user = await findOne({ model: UserModel, filter: { email } });

    if (!user) throw NotFoundException({ message: "Invalid credentials" });

    if (!user.confirmEmail) {
        throw BadRequestException({ message: "Please verify your email first" });
    }

    const isMatch = await compareHash({ password, hashedValue: user.password });
    if (!isMatch) throw BadRequestException({ message: "Invalid credentials" });

    const token = generateToken({ payload: { id: user._id, role: user.role } });

await redisClient.setEx(`token:${user._id}:${deviceName}`, 1800, token); 

    return { token };
};

export const logout = async (userId, deviceName, allDevices = false) => {
    if (allDevices) {
        const keys = await redisClient.keys(`token:${userId}:*`);
        if (keys.length > 0) await redisClient.del(keys);
    } else {
        await redisClient.del(`token:${userId}:${deviceName}`);
    }
    return { message: "Logged out successfully" };
};
/*
    iss: 'https://accounts.google.com',
    azp: '274006089540-up03ov50h5ogtb6eem6e40n9istrst06.apps.googleusercontent.com',
    aud: '274006089540-up03ov50h5ogtb6eem6e40n9istrst06.apps.googleusercontent.com',
    sub: '110401125912574728717',
    email: 'habibamo942@gmail.com',
    email_verified: true,
    nbf: 1772409281,
    name: 'Habiba Mohamed',
    picture: 'https://lh3.googleusercontent.com/a/ACg8ocIK9jXIXrd4sQMhRMSf01ZpQ5Cvzhjd6wq7IZTqGpYx2qBQXRY=s96-c',
    given_name: 'Habiba',
    family_name: 'Mohamed',
    iat: 1772409581,
    exp: 1772413181,
    jti: '49c3e3150e961699db8764ffa84101fe681b10ed'
}
 */
async function verifyGoogleAccount(idToken) {
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
        idToken,
        audience: '274006089540-up03ov50h5ogtb6eem6e40n9istrst06.apps.googleusercontent.com',
    });
    return ticket.getPayload(); 
}
export const loginpWithGmail = async (idToken, issuer, deviceName = 'web') => {
    const payload = await verifyGoogleAccount(idToken);

    const user = await UserModel.findOneAndUpdate(
        { email: payload.email, provider: ProviderEnum.Google },
        { profilePicture: payload.picture },
        { new: true } 
    );

    if (!user) {
        throw NotFoundException({ message: "Google account not found, please sign up first" });
    }

    const credentials = await createLoginCredentials({ user, issuer });


    await redisClient.setEx(
        `token:${user._id}:${deviceName}`, 
        1800, 
        credentials.accessToken
    );

    return credentials;
}

export const signupWithGmail = async (idToken, issuer) => {
    const payload = await verifyGoogleAccount(idToken);
    
    const checkExist = await findOne({
        model: UserModel,
        filter: { email: payload.email }
    });

    if (checkExist) {
        if (checkExist.provider !== ProviderEnum.Google) {
            throw ConflictException({ message: "Invalid login provider" });
        }
        const credentials = await loginpWithGmail(idToken, issuer);
        return { status: 200, Credential: credentials }; 
    }

    const user = await createOne({
        model: UserModel,
data: {
    firstName: payload.given_name,
    lastName: payload.family_name,
    email: payload.email,
    profilePicture: payload.picture,
    confirmEmail: true, 
    provider: ProviderEnum.Google,
}
    });

    const credentials = await createLoginCredentials({ user, issuer });
    return { status: 201, Credential: credentials };
};
export const forgetPassword = async (email) => {
    const user = await findOne({ model: UserModel, filter: { email } });
    if (!user) throw NotFoundException({ message: "User not found" });

    const otp = customAlphabet('0123456789', 6)();
    await redisClient.setEx(`password_otp:${email}`, 300, otp);

    await sendEmail({
        to: email,
        subject: "Reset Password Code",
        html: `<p>Your code is: <b>${otp}</b></p>`
    });

    return { message: "OTP sent to email" };
};
export const updatePassword = async (inputs) => {
    const { email, otp, newPassword, confirmPassword } = inputs;

    if (newPassword !== confirmPassword) {
        throw BadRequestException({ message: "Passwords do not match" });
    }

    const cachedOtp = await redisClient.get(`password_otp:${email}`);
    if (!cachedOtp || cachedOtp !== otp) {
        throw BadRequestException({ message: "Invalid or expired OTP" });
    }

    const user = await findOne({ model: UserModel, filter: { email } });
    if (!user) throw NotFoundException({ message: "User not found" });

    const allOldPasswords = [user.password, ...user.passwordHistory];
    
    for (const oldPass of allOldPasswords) {
        const isRepeated = await compareHash({ password: newPassword, hashedValue: oldPass });
        if (isRepeated) {
            throw BadRequestException({ message: "New password cannot be any of your last 3 passwords" });
        }
    }

    const hashedNewPassword = await generateHash({ payload: newPassword });

    const newHistory = [user.password, ...user.passwordHistory].slice(0, 2);

    await UserModel.updateOne(
        { email },
        { 
            password: hashedNewPassword,
            passwordHistory: newHistory
        }
    );

    await redisClient.del(`password_otp:${email}`);
    const keys = await redisClient.keys(`token:${user._id}:*`);
    if (keys.length > 0) await redisClient.del(keys);

    return { message: "Password updated successfully" };
};
