import { UserModel, findOne } from '../../DB/index.js';

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