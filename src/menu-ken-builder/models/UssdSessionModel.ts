import mongoose, {  Schema } from 'mongoose';


const ussdSessionSchema = new Schema({
  session_id: { type: String, required: true},
  phone_number: { type: String, required: true },
  user_input: { type: String, required: true },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',

  },
  active_state: { type: String },
  serviceCode: { type: String },
  language: { type: String },
  full_input: { type: String },
  masked_input: { type: String },
  hash: { type: String },
},
{ timestamps: true });

const UssdSessionModel = mongoose.model('UssdSession', ussdSessionSchema);

export default UssdSessionModel;

//example of a ussd session object
// {
//   "session_id": "ATUid_1c2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b",
//   "phone_number": "+256782820782",
//   "serviceCode": "*284*1#",
//   "text": "1",
//   "language": "en"
//   "user_id": "5f8f1b3b2b2b2b2b2b2b2b2b",
//   "active_state": "1",
//   "full_input": "*284*1*1#",
//   "masked_input": "*284*1*1#",
//  "user_input": "1",
//   "hash": ""
// }

