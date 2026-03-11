import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    }
});

export const sendEmail = async ({ to, subject, html }) => {
    try {
        const info = await transporter.sendMail({
            from: `"Saraha App" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });

        console.log(`[Email Sent] MessageID: ${info.messageId}`);
        
        return info.accepted.length > 0;
    } catch (error) {
        console.error("❌ Email Error:", error);
        return false;
    }
};