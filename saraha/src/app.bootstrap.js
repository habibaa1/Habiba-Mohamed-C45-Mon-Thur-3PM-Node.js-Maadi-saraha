import { NODE_ENV, port } from '../config/config.service.js'
import { connectDB } from './DB/index.js'
import { authRouter, userRouter } from './modules/index.js'
import cors from 'cors'
import express from 'express'
import path from 'path';

async function bootstrap() {
    const app = express()

    // 1. Middlewares
    app.use(cors() ,express.json()) 
    app.use('/uploads', express.static('../uploads'));
    // 2. Database Connection
    await connectDB()

    // 3. Application Routing
    app.get('/', (req, res) => res.send('Hello World!'))
    app.use('/auth', authRouter)
    app.use('/user', userRouter)

    // 4. Handle Invalid Routing (404)
    app.use('{/*dummy}', (req, res) => {

        return res.status(404).json({ message: "Invalid application routing" })

    })

    // 5. Global Error-handling Middleware
    app.use((error, req, res, next) => {
        const status = error.status || error.cause?.status || 500
        
        return res.status(status).json({
            error_message: status === 500 ? 'something went wrong' : error.message,
            stack: NODE_ENV === "development" ? error.stack : undefined
        })
    })
    
    // 6. Start Server
    app.listen(port, () => {
        console.log(`🚀 Server is running on port ${port} in ${NODE_ENV} mode!`)
    })
}

export default bootstrap