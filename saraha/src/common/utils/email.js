import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
    console.log("Email User:", process.env.EMAIL_USER);
console.log("Email Pass:", process.env.EMAIL_PASS);
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    }
});

    const info = await transporter.sendMail({
        from: `"Saraha App" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    });

    return info.accepted.length > 0;
};