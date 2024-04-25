import nodemailer from "nodemailer"
import { google } from "googleapis"
const OAuth2 = google.auth.OAuth2;
import dotenv from 'dotenv'
import welcomeTemplate from "./emailTemplates/welcome";
import forgotPasswordTemplate from "./emailTemplates/forgotPassword";

dotenv.config()


async function getAccessToken() {
    return new Promise((resolve, reject) => {
        const oauth2Client = new OAuth2(
            process.env.OAUTH_CLIENTID,
            process.env.OAUTH_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground" // Redirect URL
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.OAUTH_REFRESH_TOKEN
        });

        oauth2Client.getAccessToken((err, token) => {
            if (err) {
                reject("Failed to create access token :(");
            }
            resolve(token);
        });
    });


}
const sendEmail= async (email, subject, emailHtml)=> {
    const accessToken = await getAccessToken();

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
            clientId: process.env.OAUTH_CLIENTID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
            refreshToken: process.env.OAUTH_REFRESH_TOKEN,
            accessToken: accessToken,

        },
        tls: {
            rejectUnauthorized: false
        }
    });

    let mailOptions = {
        from: process.env.MAIL_USERNAME,
        to: email,
       // cc: "admin@bluewave.insure",
        subject: subject,
        html: emailHtml   // text
    };
   // console.log("mailOptions ",mailOptions)

    transporter.sendMail(mailOptions, function (err, data) {
        if (err) {
            console.log("Error " + err);
        } else {
            console.log("Email sent successfully");
        }
    });

}


const sendWelcomeEmail= async(user: any, subject: string, message: any) =>{
    try {

        const { email, name } = user
        const emailData = {
            name: name,
            email: email,
            login_url: process.env.DASHBOARD_LOGIN,
            message: message,
            // ... other dynamic values
        };

        const emailHtml = welcomeTemplate(emailData);

        await sendEmail(email, subject, emailHtml)

    }
    catch (err) {
        console.log(err)
    }
}


//forgot password email
const sendForgotPasswordEmail= async(user: any, subject: string, message: any) =>{
       try {
            
            const { email, name } = user
            const emailData = {
                name: name,
                email: email,
                //reset_url: process.env.RESET_URL || "http://localhost:3000/reset-password",
                message: message,
                
            };
    
            const emailHtml = forgotPasswordTemplate(emailData);
            await sendEmail(email, subject, emailHtml)

        }
        catch (err) {
            console.log(err)
        }
    }


    




export { sendWelcomeEmail , sendEmail ,sendForgotPasswordEmail}