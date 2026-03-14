import mongoose from "mongoose";
import { GenderEnum, ProviderEnum } from "../../common/enums/index.js";
import { encrypt } from '../../common/utils/security/encryption.security.js';
import { generateHash } from "../../common/utils/security/hash.security.js";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minLength: [2, `firstName cannot be less than 2 char but you have entered a {VALUE}`],
        maxLength: 25,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 25,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: function () { return this.provider == ProviderEnum.System }
    },
    passwordHistory: {
    type: [String], 
    default: []
},
    otp: String,
    otpExpires: Date,
    phone: {
        type: String
    },
    gender: {
        type: String,
        enum: Object.values(GenderEnum),
        default: GenderEnum.Male
    },
    provider: {
        type: String,
        enum: Object.values(ProviderEnum),
        default: ProviderEnum.System
    },
    role: {
        type: String,
        enum: ['User', 'Admin'], 
        default: 'User'
    },
    profilePicture: String,
    coverprofilePicture: [String],
    confirmEmail: {
        type: Boolean,
        default: false
    },
    changeCredentialsTime: Date,
}, {
    collection: "Route_Users",
    timestamps: true, 
    strict: true,
    strictQuery: true,
    optimisticConcurrency: true,
    autoIndex: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});


userSchema.pre("save", async function () { 
    try {
        if (this.isModified("password")) {
            if (this.provider === ProviderEnum.System) {
                if (!this.confirmPassword) {
                    throw new Error("Please confirm your password");
                }
                if (this.password !== this.confirmPassword) {
                    throw new Error("Passwords do not match!");
                }
            }

            this.password = await generateHash({ plaintext: this.password });
            this.changeCredentialsTime = Date.now();
        }

        if (this.isModified("phone") && this.phone) {
            this.phone = await encrypt(this.phone);
        }
        
    } catch (error) {
        throw error; 
    }
});

// --- Virtuals ---

userSchema.virtual("username").set(function (value) {
    const parts = value.split(' ');
    this.firstName = parts[0] || '';
    this.lastName = parts.slice(1).join(' ') || '';
}).get(function () {
    return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual("confirmPassword")
    .set(function (value) {
        this._confirmPassword = value; 
    })
    .get(function () {
        return undefined;
    });
userSchema.virtual("profilePictureLink").get(function () {
    if (this.profilePicture && this.profilePicture.startsWith('http')) {
        return this.profilePicture;
    }
    if (this.profilePicture) {
        return `http://localhost:3000/uploads/users/${this.profilePicture}`;
    }
    return null; 
});

export const UserModel = mongoose.models.User || mongoose.model("User", userSchema);