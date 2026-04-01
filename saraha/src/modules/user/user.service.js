import { UserModel, findOne } from '../../DB/index.js';
import fs from 'fs';
import path from 'path';
export const profile = async (id) => {
    const user = await findOne({
        model: UserModel,
        filter: { _id: id }
    });
    
    return user;
};
export const rotateToken = async (user, issuer) => {
};

export const updateProfilePicture = async (user, file) => {
    if (!file) {
        throw new Error("Please upload an image");
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
        user._id,
        { profilePicture: file.filename },
        { new: true }
    );

    return updatedUser;
};

export const uploadCoverImages = async (req) => {
    const user = await UserModel.findById(req.user._id);
    const existingCount = user.coverPictures?.length || 0;
    const newCount = req.files?.length || 0;

    if (existingCount + newCount !== 2) {
        throw new Error(`Total cover images must be exactly 2. (Current: ${existingCount}, New: ${newCount})`);
    }

    const paths = req.files.map(file => file.path);
    user.coverPictures.push(...paths);
    await user.save();
    return { message: "Covers uploaded successfully", covers: user.coverPictures };
};

export const updateProfilePic = async (req) => {
    const user = await UserModel.findById(req.user._id);
    
    if (user.profilePicture) {
        user.gallery.push(user.profilePicture);
    }

    user.profilePicture = req.file.path; 
    await user.save();
    return { message: "Profile picture updated", gallery: user.gallery };
};
export const deleteProfilePic = async (req) => {
    const user = await UserModel.findById(req.user._id);
    if (!user.profilePicture) throw new Error("No image to delete");

    const fullPath = path.resolve(user.profilePicture);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }

    user.profilePicture = null;
    await user.save();
    return { message: "Image deleted from server and database" };
};

export const getProfile = async (req) => {
    const { profileId } = req.params;
    const user = await UserModel.findById(profileId);

    if (req.user._id.toString() !== profileId) {
        await UserModel.updateOne(
            { _id: profileId },
            { $addToSet: { viewers: { userId: req.user._id } } }
        );
    }

    const userObj = user.toObject();
    if (req.user.role !== 'admin') {
        delete userObj.viewers;
    } else {
        userObj.viewCount = user.viewers.length;
    }

    return userObj;
};

export const sendResetLink = async (email) => {
    const token = customAlphabet('1234567890abcdef', 30)();
    await redisClient.setEx(`resetToken:${token}`, 3600, email);

    const link = `http://localhost:3000/auth/reset-password/${token}`;
    await sendEmail({ 
        to: email, 
        subject: "Reset Password Link", 
        html: `<p>Click <a href="${link}">here</a> to reset your password. Valid for 1 hour.</p>` 
    });
};

export const resetWithLink = async (token, newPassword) => {
    const email = await redisClient.get(`resetToken:${token}`);
    if (!email) throw new Error("Invalid or expired reset link");

    await UserModel.updateOne({ email }, { password: newPassword });
    await redisClient.del(`resetToken:${token}`); 
    return { message: "Password updated successfully" };
};