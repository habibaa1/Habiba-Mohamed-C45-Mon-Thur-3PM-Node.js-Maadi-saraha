import { HashApproachEnum } from "../../common/enums/security.enum.js";
import { ProviderEnum, RoleEnum } from "../../common/enums/user.enum.js";
import { ConflictException, NotFoundException , BadRequestException } from "../../common/utils/error.utils.js"; 
import { encrypt } from "../../common/utils/security/encryption.security.js";
import { UserModel, findOne, createOne } from "../../DB/index.js";
import { compareHash, generateHash } from "../../common/utils/security/hash.security.js";
import { createLoginCredentials } from "../../common/utils/security/token.security.js";
import { OAuth2Client } from "google-auth-library";
import { verify } from "argon2";
import { customAlphabet } from 'nanoid';
import { sendEmail } from "../../common/utils/email.js";

export const signup = async (inputs) => {
    const { username, email, password, confirmPassword, phone } = inputs;

    const checkUserExist = await findOne({
        model: UserModel,
        filter: { email }
    });

    if (checkUserExist) {
        throw ConflictException({ message: 'Email already exists' });
    }

    const otp = customAlphabet('0123456789', 6)(); 
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); 

    const user = await createOne({
        model: UserModel,
        data: { 
            username,
            email,
            password, 
            confirmPassword, 
            phone,
            otp,        
            otpExpires, 
            provider: ProviderEnum.System,
            role: RoleEnum.User 
        }
    });

await sendEmail({
    to: email,
    subject: "Verification Code",
    html: `<h1>Welcome to Saraha!</h1>
           <p>Your verification code is: <b>${otp}</b></p>
           <p>This code is valid for 5 minutes only.</p>`
});

console.log(`[OTP Sent Successfully] To: ${email}`);

user.password = undefined;
return user;
};

export const verifyEmail = async (inputs) => {
    const { email, otp } = inputs;

    const user = await findOne({
        model: UserModel,
        filter: { email }
    });

    if (!user) throw new NotFoundException({ message: "User not found" });

    if (user.otp !== otp || user.otpExpires < Date.now()) {
        throw new BadRequestException({ message: "Invalid or expired OTP" });
    }

    await UserModel.updateOne(
        { email },
        { confirmEmail: true, $unset: { otp: "", otpExpires: "" } }
    );

    return { message: "Email verified successfully" };
};
export const login = async (inputs, issuer) => {
    const { email, password } = inputs;

    const user = await findOne({
        model: UserModel,
        filter: { email , provider: ProviderEnum.System },
        select: '+password +role' 
    });

    if (!user) {
        throw NotFoundException({ message: 'Invalid login credentials' });
    }

    const match = await compareHash({ 
        plaintext: password, 
        cipherText: user.password, 
        approach: HashApproachEnum.bcrypt 
    });

    if (!match) {
        throw NotFoundException({ message: 'Invalid login credentials' });
    }

    return await createLoginCredentials({ user, issuer });
};
/*
{
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
export const loginpWithGmail = async (idToken , issuer) => {
    const payload = await verifyGoogleAccount(idToken);
    const googlePicture = payload.picture; 

await UserModel.updateOne(
    { email: payload.email },
    { profilePicture: googlePicture } 
);
    const user = await findOne({
        model: UserModel,
        filter: { email: payload.email, provider: ProviderEnum.Google }
    });

    if (!user) {
        throw NotFoundException({ message: "Google account not found, please sign up first" });
    }
    return await createLoginCredentials({ user, issuer });
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
    username: payload.name, 
    email: payload.email,
    profilePicture: payload.picture,
    confirmEmail: true, 
    provider: ProviderEnum.Google,
}
    });

    const credentials = await createLoginCredentials({ user, issuer });
    return { status: 201, Credential: credentials };
};

