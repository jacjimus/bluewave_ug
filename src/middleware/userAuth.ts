//importing modules
const express = require("express");
const jwt = require('jsonwebtoken');
import {db} from "../models/db";
//Assigning db.users to User variable
 const User = db.users;

//Function to check if username or email already exist in the database
//this is to avoid having two users with the same username and email
 const saveUser = async (req, res, next) => {
 //search the database to see if user exist
 try {
   const username = await User.findOne({
     where: {
       name: req.body.name,
     },
   });
   //if username exist in the database respond with a status of 409
   if (username) {
     return res.json(409).send("username already taken");
   }

   //checking if email already exist
   const emailcheck = await User.findOne({
     where: {
       email: req.body.email,
     },
   });

   //if email exist in the database respond with a status of 409
   if (emailcheck) {
     return res.json(409).send("Authentication failed");
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
      console.log(user)
      if (err) {
        return res.status(403).json({ message: 'Token is not valid' });
      }
      if (user.user) {
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
 saveUser,
};