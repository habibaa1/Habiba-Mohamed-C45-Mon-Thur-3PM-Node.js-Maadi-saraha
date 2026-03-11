import { createClient } from 'redis';
import { REDIS_URI } from '../../config/config.service.js';

export const redisClient = createClient({
    url: REDIS_URI
});

redisClient.on('error', (err) => console.log('❌ Redis Client Error', err));

export const connectRedis = async () => {
    try {
        if (!redisClient.isOpen) { 
            await redisClient.connect();        
            console.log("✅ Connected to Redis (Upstash) successfully");
        }
    } catch (error) {
        console.error("❌ Failed to connect to Redis:", error);
    }
};


export const saveOTP = async (email, otp) => {
    try {
        await redisClient.setEx(`otp:${email}`, 300, otp); 
    } catch (error) {
        console.error("Redis SaveOTP Error:", error);
    }
};

export const getOTP = async (email) => {
    return await redisClient.get(`otp:${email}`);
};

export const deleteOTP = async (email) => {
    await redisClient.del(`otp:${email}`);
};

export const deleteToken = async (userId, deviceName) => {
    await redisClient.del(`token:${userId}:${deviceName}`);
};