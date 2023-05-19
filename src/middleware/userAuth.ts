//importing modules
const express = require("express");
const jwt = require('jsonwebtoken');
import {db} from "../models/db";
//Assigning db.users to User variable
 const User = db.users;

//Function to check if username or email already exist in the database
//this is to avoid having two users with the same username and email
 const saveUser = async (req:any, res:any, next:any) => {
 //search the database to see if user exist
 try {

   //checking if email already exist
   const emailcheck = await User.findOne({
     where: {
       email: req.body.email,
     },
   });

   //if email exist in the database respond with a status of 409
   if (emailcheck) {
     return res.status(409).json({message: "Email already exist"});
   }

   next();
 } catch (error) {
   console.log(error);
 }
};

//only admin middleware


function isAdmin(req:any, res:any, next:any) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      console.log("USER: ",user)
      if (err) {
        return res.status(403).json({ message: 'Token is not valid' });
      }
      if (user.role === 'admin') {
        req.user = user;
        next();
      } else {
        return res.status(401).json({ message: 'You are not authorized to access this resource' });
      }
    });
  } else {
    return res.status(401).json({ message: 'Authorization header is required' });
  }
}
function isUser(req:any, res:any, next:any) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      console.log("USER: ",user)
      if (err) {
        return res.status(403).json({ message: 'Token is not valid' });
      }
      if (user.role === 'user' || user.role === 'admin' || user.role === 'postgres') {
        req.user = user;
        next();
      } else {
        return res.status(401).json({ message: 'You are not authorized to access this resource' });
      }
    });
  } else {
    return res.status(401).json({ message: 'Authorization header is required' });
  }
}





//exporting module
 module.exports = {
    isAdmin,
    isUser,
 saveUser,
};