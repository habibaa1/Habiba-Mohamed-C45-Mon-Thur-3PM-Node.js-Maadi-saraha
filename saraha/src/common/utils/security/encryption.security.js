import crypto from 'crypto';
import { ENC_BYTE } from '../../../../config/config.service.js';

const algorithm = 'aes-256-cbc';


const key = Buffer.from(ENC_BYTE, 'utf-8'); 

const iv = Buffer.from(ENC_BYTE.substring(0, 16), 'utf-8');

export const encrypt = async (text) => {
    if (!text) return text;
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
};

export const decrypt = async (encrypted) => {
    if (!encrypted) return encrypted;
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};