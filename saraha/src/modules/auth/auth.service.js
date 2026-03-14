import { HashApproachEnum } from "../../common/enums/security.enum.js";
import { ProviderEnum, RoleEnum , GenderEnum } from "../../common/enums/user.enum.js";
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

    const userObj = user.toObject();

    const finalResponse = {
        username: userObj.username, 
        email: userObj.email,
        password: userObj.password,
        confirmPassword: userObj.password, 
        phone: userObj.phone,
        gender: userObj.gender,    
        provider: userObj.provider, 
        role: userObj.role,
        confirmEmail: userObj.confirmEmail,
        _id: userObj._id,
        createdAt: userObj.createdAt,
        updatedAt: userObj.updatedAt
    };

    await sendEmail({
        to: email,
        subject: "Verification Code",
        html: `<h1>Welcome to Saraha!</h1><p>Your code: <b>${otp}</b></p>`
    });

    return finalResponse; 
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

    return { message: "Email verified successfully. You can login now!" };
};
export const login = async (inputs, deviceName) => {
    const { email, password } = inputs;

    const user = await UserModel.findOne({ email }).select("+password");

    if (!user) throw new Error("Invalid credentials");

    if (!user.confirmEmail) {
        throw new Error("Please verify your email first");
    }

    const isMatch = await compareHash({ 
        plaintext: password,    
        cipherText: user.password 
    });

    if (!isMatch) throw new Error("Invalid credentials");

const token = generateToken({ 
        payload: { sub: user._id, role: user.role } 
    });

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
export const updatePassword = async (inputs, user) => {
    const { oldPassword, newPassword } = inputs;


    const dbUser = await UserModel.findById(user._id).select("+password");

    const isMatch = await compareHash({ 
        plaintext: oldPassword, 
        cipherText: dbUser.password 
    });
    
    if (!isMatch) throw new Error("Old password is incorrect");

    dbUser.password = newPassword;
    dbUser.confirmPassword = newPassword; 
    await dbUser.save();

    return { message: "Password updated successfully" };
};
export const resetPassword = async (inputs) => {
    const { email, otp, newPassword } = inputs;

    const redisOtp = await redisClient.get(`password_otp:${email}`);
    
    if (!redisOtp || redisOtp != otp) {
        throw new Error("Invalid or expired OTP");
    }

    const user = await UserModel.findOne({ email });
    if (!user) throw new Error("User not found");

    user.password = newPassword;
    user.confirmPassword = newPassword;
    await user.save();

    await redisClient.del(`password_otp:${email}`);

    const userObj = user.toObject();
    
    return {
        username: userObj.username, 
        email: userObj.email,
        gender: userObj.gender == "0" ? "male" : "female", 
        provider: userObj.provider == "0" ? "system" : "google",
        message: "Password reset successfully"
    };
};