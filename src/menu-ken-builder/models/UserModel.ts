import mongoose, { Schema } from 'mongoose';


const userSchema = new Schema({
  first_name: { type: String, required: true },
  middle_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone_number: { type: String, required: true, unique: true },
  dob: { type: Date },
  gender: { type: String },
  marital_status: { type: String },
  addressline: { type: String },
  nationality: { type: String },
  title: { type: String },
  pinzip: { type: String },
  weight: { type: Number },
  height: { type: Number },
  password: { type: String },
  national_id: { type: String },
  role: { type: String, default: "user" },
  is_active: { type: Boolean, default: false },
  is_verified: { type: Boolean, default: false },
  pin: { type: Number },
  partner_id:{ type: Number, required: true},
  biometric: { type: String }
}, { timestamps: true

});

const UserModel = mongoose.model('User', userSchema);

export default UserModel;

//example of a user object
// {
//   "first_name": "John",
//   "middle_name": "Doe",
//   "last_name": "Doe",
//   "email": "johndoe@gmail",
//   "phone_number": "0700000000",
//   "dob": "1990-01-01",
//   "gender": ""

