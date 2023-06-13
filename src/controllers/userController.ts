const bcrypt = require("bcrypt");
import {db} from "../models/db";
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv').config()
import {isValidKenyanPhoneNumber, getRandomInt, isValidEmail} from "../services/utils";


// Assigning users to the variable User
const User = db.users;

async function getUserFunc(user_id:any) {
  let user = await User.findOne({
    where: {
      id: user_id,
    },
  });
  //remove password from the response
  if(user) {
    delete user.dataValues.password;
    delete user.dataValues.pin;

  }
  return user;
    
  }

/** @swagger
	* /api/v1/users/signup:
	*   post:
	*     tags:
	*       - Users
	*     description: Register User
	*     operationId: registerUser
	*     summary: Register User
	*     requestBody:
	*       content:
	*         application/json:
	*           schema:
	*             type: object
	*             example: { "first_name":"John", "middle_name":"White",  "last_name":"Doe", "email":"test@gmail.com", "password": "test123", "phone_number":"0754546568","national_id":"27885858",  "dob": "1990-12-12", "gender": "M","marital_status": "single","addressline": "Nairobi", "nationality": "Kenyan","title": "Mr","pinzip": "00100","weight": 70,"height": 170 }
	*     responses:
	*       200:
	*         description: Information fetched succussfully
	*       400:
	*         description: Invalid request
	*/

const signup = async (req:any, res:any) => {

 try {
   const { first_name,middle_name, last_name, email, password, phone_number, national_id, dob, gender,marital_status,addressline,nationality, title,pinzip,weight,height } = req.body;
   

   if(!first_name || !last_name || !email || !password || !phone_number || !national_id ) {
     return res.status(400).json({ message: "Please provide all fields" });
    
    }

   
    if(!isValidKenyanPhoneNumber(phone_number)) {
      return res.status(400).json({ message: "Please enter a valid phone number" });
    }
    if(!isValidEmail(email)) {

      return res.status(400).json({ message: "Please enter a valid email" });
    }
 let nationalId = national_id.toString();
    if(nationalId.length !== 8) {
      return res.status(400).json({ message: "National ID should be 8 digits" });
    }
  //create a user interface 
  interface Person {
    id: number;
    first_name: string;
    middle_name: string;
    last_name:  string;
    email: string;
    phone_number: string;
    national_id: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
    pin: number;
    role: string;
    dob: Date;
    gender: string
    marital_status: string;
    addressline: string;
    nationality: string;
    title: string;
    pinzip: string;
    weight: number;
    height:  number;

  }

  // Generate a random integer for the primary key
  const randomId = getRandomInt(10000000, 99999999);

    const userData: Person= {
      id: randomId,
      first_name,
      middle_name,
      last_name,
      email,
      phone_number,
      national_id,
      password: await bcrypt.hash(password, 10),
      createdAt: new Date(),
      updatedAt: new Date(),
      pin: Math.floor(1000 + Math.random() * 9000),
      role: "user",
      dob,
      gender,
      marital_status,
      addressline,
      pinzip,
      weight,
      height,
      nationality,
      title,
  

   };
   //checking if the user already exists
   let user:any =await User.findAll({ where: { email: email } })
   //check if national id exists
    let nationalIdExists:any = await User.findAll({ where: { national_id: national_id } })
    //check if phone number exists
    let phoneNumberExists:any = await User.findAll({ where: { phone_number: phone_number } })
    if(nationalIdExists && nationalIdExists.length > 0) {
      return res.status(409).json({ message: "National ID already exists" });
    }
    if(phoneNumberExists && phoneNumberExists.length > 0) {
      return res.status(409).json({ message: "Phone number already exists" });
    }


   if(user && user.length > 0) {

      return res.status(409).json({ message: "User already exists" });

    }

    console.log("USER DATA",userData);

   //saving the user
   const newUser:any = await User.create(userData);
   
   // set cookie with the token generated
   if (newUser) {
     let token = jwt.sign({ id: newUser.id, role: newUser.role }, process.env.JWT_SECRET || "apple123", {
       expiresIn: 1 * 24 * 60 * 60 * 1000,
      });
      
      res.cookie("jwt", token, { maxAge: 1 * 24 * 60 * 60, httpOnly: true });
      console.log(token);
      //send users details
    
      return res.status(201).json({ message: "User login successfully", token: token, user: newUser });
    } 
  } catch (error) {
    console.log(error);
  
      return res.status(409).send("Details are not correct");
    
  }
};



/**
 * @swagger
  * /api/v1/users/login:
  *   post:
  *     tags:
  *      - Users
  *     summary: Authenticate user
  *     description: Returns a JWT token upon successful login
  *     security:
  *       - bearerAuth: []
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             example: {  "email":"dickens@bluewaveinsurance.co.ke", "password": "test123" }
  *     responses:
  *       200:
  *         description: Successful authentication
  */


const login = async (req:any, res:any) => {
  console.log("I WAS CALLED",req.body)
 try {
const { email, password } = req.body;

if(!email || !password) {
  return res.status(400).json({ message: "Please provide an email and password" });
}


   //find a user by their email
   const user = await User.findOne({
     where: {
     email: email
   } 
     
   });
   //console.log("USER",user)
   console.log(!user , user.length == 0 )
   if (!user || user.length === 0) {
     return res.status(401).json({ message: "Invalid credentials" });
   }

   //if user email is found, compare password with bcrypt
   if (user) {
     const isSame = await bcrypt.compare(password, user.password);
     //if password is the same
      //generate token with the user's id and the secretKey in the env file

     if (isSame) {
       let token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || "apple123", {
         expiresIn: 1 * 24 * 60 * 60 * 1000,
       });

       //if password matches wit the one in the database
       //go ahead and generate a cookie for the user
       res.cookie("jwt", token, { maxAge: 1 * 24 * 60 * 60, httpOnly: true });
     
       console.log(token);
   
       //send user data
       return res.status(201).json({ message: "User login successfully", token: token});
     } 
      
   }
 } catch (error) {
   console.log(error);
   return res.status(400).json({ message: "Invalid credentials" });
    
 }
};

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Retrieve a list of users
 *     security:
 *       - ApiKeyAuth: []
 *     description: Retrieve a list of users from the database
 *     responses:
 *       200:
 *         description: Successful response
 */
const getUsers = async(req:any, res:any) => {
  try {
   await User.findAll().then((users:any) => {
      //remove password from the response
      users.forEach((user:any) => {
        delete user.dataValues.password;
        delete user.dataValues.pin;
      });
  
     return res.status(200).json(users);
  });
    
  } catch (error) {
    return res.status(404).json({message: "No users found"});
    
  }
 
  
}

/**
	* @swagger
	* /api/v1/users/{user_id}:
	*   get:
	*     tags:
	*       - Users
	*     description: Get User
	*     operationId: getUser
	*     summary: Get User
	*     security:
	*       - ApiKeyAuth: []
	*     parameters:
	*       - name: user_id
	*         in: path
	*         required: true
	*         schema:
	*           type: string
	*     responses:
	*       200:
	*         description: Information fetched succussfuly
	*       400:
	*         description: Invalid request
	*/
const getUser = async(req:any, res:any) => {
  try {
    let user_id = parseInt(req.params.user_id)


 
   let user:any = await getUserFunc(user_id);
   console.log(user)

   
    if(!user || user.length === 0) {
      return res.status(404).json({message: "No user found"});
    }


    return res.status(200).json(user);

    
  } catch (error) {
    
   return res.status(404).json({message: "No user found"});
  }
}



/** @swagger
	* /api/v1/users/{user_id}:
	*   put:
	*     tags:
	*       - Users
	*     description: Update User
	*     operationId: updateUser
	*     summary: update User
  *     parameters:
	*       - name: user_id
	*         in: path
	*         required: true
	*         schema:
	*           type: string
	*     requestBody:
	*       content:
	*         application/json:
	*           schema:
	*             type: object
	*             example: { "first_name":"John", "last_name":"Doe", "email":"test@gmail.com", "password": "test123", "phone_number":"25475454656","national_id":278858583,  "dob": "1990-12-12", "gender": "M","marital_status": "single","addressline": "Nairobi", "nationality": "Kenyan","title": "Mr","pinzip": "00100","weight": 70,"height": 170}
	*     responses:
	*       200:
	*         description: Information fetched succussfully
	*       400:
	*         description: Invalid request
	*/

const updateUser = async (req:any, res:any) => {
 try {
  const { first_name,middle_name, last_name, email, password, phone_number, national_id, dob, gender,marital_status,addressline,nationality, title,pinzip,weight,height } = req.body;

   let user:any = getUserFunc(req.params.user_id);

    //check if user exists
    if(!user || user.length === 0) {
      return res.status(404).json({message: "No user found"});
    }

   const data = {
      first_name,
      middle_name,
      last_name,
      email,
      phone_number,
      national_id,
      password: await bcrypt.hash(password, 10),
      createdAt: new Date(),
      updatedAt: new Date(),
      dob,
      gender,
      marital_status,
      addressline,
      nationality,
      title,
      pinzip,
      weight,
      height

   };
   //saving the user
   const updatedUser = await User.update(data, {
     where: {
       id: req.params.user_id,
     },
   });
   //send users details
   return res.status(201).json({message: "User updated successfully", user: updatedUser});
 } catch (error) {
   console.log(error);
   return res.status(409).json({message: "Details are not correct"});
 }
};

// //deleting a user
const deleteUser = async (req:any, res) => {
 try {
    await User.destroy({
     where: {
       id: req.params.user_id,
     },
   });
   //send users details
   return res.status(201).json({ message: "User deleted successfully"})
 } catch (error) {
   console.log(error);
   return res.status(409).send("Details are not correct");
 }
};


module.exports = {
 signup,
 login,
  getUsers,
  getUser,
  updateUser,
  deleteUser

};