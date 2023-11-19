import nodemailer from "nodemailer"
import { google } from "googleapis"
const OAuth2 = google.auth.OAuth2;
import dotenv from 'dotenv'
import welcomeTemplate from "./emailTemplates/welcome";
dotenv.config()




async function sendEmail(user: any, subject: string, message: any) {
    try {

        const {email, name}= user
        const emailData = {
            name: name,
            email: email,
            login_url: 'http://mainboard.s3-website-us-east-1.amazonaws.com/login',
            // ... other dynamic values
          };
          
          const emailHtml = welcomeTemplate(emailData);
          
        
        
        const oauth2Client = new OAuth2(
            process.env.OAUTH_CLIENTID,
            process.env.OAUTH_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground" // Redirect URL
        );
        
        oauth2Client.setCredentials({
            refresh_token: process.env.OAUTH_REFRESH_TOKEN
        });
        
        const accessToken = await oauth2Client.getAccessToken()
      
        
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
            from: "admin@bluewave.insure",
            to: email,
            subject: subject,
            html: emailHtml   // text
        };

        transporter.sendMail(mailOptions, function (err, data) {
            if (err) {
                console.log("Error " + err);
            } else {
                console.log("Email sent successfully");
            }
        });
    }
    catch (err) {
        console.log(err)
    }
}


export default sendEmail