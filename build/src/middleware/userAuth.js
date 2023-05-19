"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
//importing modules
const express = require("express");
const jwt = require('jsonwebtoken');
const db_1 = require("../models/db");
//Assigning db.users to User variable
const User = db_1.db.users;
//Function to check if username or email already exist in the database
//this is to avoid having two users with the same username and email
const saveUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    //search the database to see if user exist
    try {
        //checking if email already exist
        const emailcheck = yield User.findOne({
            where: {
                email: req.body.email,
            },
        });
        //if email exist in the database respond with a status of 409
        if (emailcheck) {
            return res.status(409).json({ message: "Email already exist" });
        }
        next();
    }
    catch (error) {
        console.log(error);
    }
});
//only admin middleware
function isAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            console.log("USER: ", user);
            if (err) {
                return res.status(403).json({ message: 'Token is not valid' });
            }
            if (user.role === 'admin') {
                req.user = user;
                next();
            }
            else {
                return res.status(401).json({ message: 'You are not authorized to access this resource' });
            }
        });
    }
    else {
        return res.status(401).json({ message: 'Authorization header is required' });
    }
}
function isUser(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            console.log("USER: ", user);
            if (err) {
                return res.status(403).json({ message: 'Token is not valid' });
            }
            if (user.role === 'user' || user.role === 'admin' || user.role === 'postgres') {
                req.user = user;
                next();
            }
            else {
                return res.status(401).json({ message: 'You are not authorized to access this resource' });
            }
        });
    }
    else {
        return res.status(401).json({ message: 'Authorization header is required' });
    }
}
//exporting module
module.exports = {
    isAdmin,
    isUser,
    saveUser,
};
