import { resolve } from 'node:path'
import { config } from 'dotenv'

export const NODE_ENV = process.env.NODE_ENV || 'development'

const envPath = {
    development: `.env.development`,
    production: `.env.production`,
}

config({ path: resolve(`./config/${envPath[NODE_ENV]}`) })

export const port = process.env.PORT ?? 7000
export const DB_URI = process.env.DB_URI

export const ENC_BYTE = process.env.ENC_BYTE

export const User_TOKEN_SECRET_KEY = process.env.User_TOKEN_SECRET_KEY
export const System_TOKEN_SECRET_KEY = process.env.System_TOKEN_SECRET_KEY

export const User_REFRESH_TOKEN_SECRET_KEY = process.env.User_REFRESH_TOKEN_SECRET_KEY
export const System_REFRESH_TOKEN_SECRET_KEY = process.env.System_REFRESH_TOKEN_SECRET_KEY

export const ACCESS_EXPIRES_IN = parseInt(process.env.ACCESS_EXPIRES_IN || '1800')
export const REFRESH_EXPIRES_IN = parseInt(process.env.REFRESH_EXPIRES_IN || '31536000')

export const SALT_ROUND = parseInt(process.env.SALT_ROUND || '10')