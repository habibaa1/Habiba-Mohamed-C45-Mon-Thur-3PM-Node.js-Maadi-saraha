import { compare, hash } from "bcrypt";
import { SALT_ROUND } from "../../../../config/config.service.js";
import * as argon2 from 'argon2';
import { HashApproachEnum } from "../../enums/security.enum.js";

export const compareHash = async ({ plaintext, cipherText, approach = HashApproachEnum.bcrypt } = {}) => {
    switch (approach) {
        case HashApproachEnum.argon2:
            return await argon2.verify(cipherText, plaintext);

        case HashApproachEnum.bcrypt:
        default:
            return await compare(plaintext, cipherText);
    }
};

export const generateHash = async ({ plaintext, approach = HashApproachEnum.bcrypt } = {}) => {
    switch (approach) {
        case HashApproachEnum.argon2:
            return await argon2.hash(plaintext);

        case HashApproachEnum.bcrypt:
        default:
            return await hash(plaintext, Number(SALT_ROUND));
    }
};