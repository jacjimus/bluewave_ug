//importing modules
const bcrypt = require("bcrypt");
import {db} from "../models/db";
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv').config()


// Assigning users to the variable User
const User = db.users;

//signing a user up
//hashing users password before its saved to the database with bcrypt
const signup = async (req, res) => {
 try {
   const { name, email, password, phone_number, national_id } = req.body;
   const data = {
     name,
     email,
     phone_number,
     national_id,
     password: await bcrypt.hash(password, 10),
     createdAt: new Date(),
      updatedAt: new Date(),
      pin: Math.floor(1000 + Math.random() * 9000)

   };
   //saving the user
   const user = await User.create(data);
  

   //if user details is captured
   //generate token with the user's id and the secretKey in the env file
   // set cookie with the token generated
   if (user) {
     let token = jwt.sign({ id: user.id }, process.env.secretKey || "apple123", {
       expiresIn: 1 * 24 * 60 * 60 * 1000,
     });

     res.cookie("jwt", token, { maxAge: 1 * 24 * 60 * 60, httpOnly: true });
     console.log("user", JSON.stringify(user, null, 2));
     console.log(token);
     //send users details
     return res.status(201).send(user);
   } else {
     return res.status(409).send("Details are not correct");
   }
 } catch (error) {
   console.log(error);
 }
};


//login authentication

const login = async (req, res) => {
 try {
const { email, password } = req.body;

   //find a user by their email
   const user = await User.findOne({
     where: {
     email: email
   } 
     
   });

   //if user email is found, compare password with bcrypt
   if (user) {
     const isSame = await bcrypt.compare(password, user.password);

     //if password is the same
      //generate token with the user's id and the secretKey in the env file

     if (isSame) {
       let token = jwt.sign({ id: user.id }, process.env.secretKey || "apple123", {
         expiresIn: 1 * 24 * 60 * 60 * 1000,
       });

       //if password matches wit the one in the database
       //go ahead and generate a cookie for the user
       res.cookie("jwt", token, { maxAge: 1 * 24 * 60 * 60, httpOnly: true });
       console.log("user", JSON.stringify(user, null, 2));
       console.log(token);
   
       //send user data
       return res.status(201).send(user);
     } else {
       return res.status(401).send("Authentication failed");
     }
   } else {
     return res.status(401).send("Authentication failed");
   }
 } catch (error) {
   console.log(error);
 }
};

const getUsers = (req:any, res:any) => {
  User.findAll().then((users:any) => {
    res.status(200).json(users);
});
  
}

const getUser = (req:any, res:any) => {
  console.log(req.params)
  let user_id = parseInt(req.params.user_id)
  User.findAll({
    where: {
      id: user_id

    }
  }).then((user:any) => {
    res.status(200).json(user);
  }
  )


}




module.exports = {
 signup,
 login,
  getUsers,
  getUser
};