import { RequestBody } from "../menu-builder/typings/global";
import sendSMS from "../services/sendSMS";
import { v4 as uuidv4 } from "uuid";
import { generateClaimId } from "../services/utils";
import { registerDependant, fetchMemberStatusData } from "../services/aar";
import { getAirtelUser, getUserByPhoneNumber } from "../services/getAirtelUser";
import { airtelMoney } from "../services/payment";
import { db } from "../models/db";
import configs from "../menu-builder/configs";

require("dotenv").config();

const Session = db.sessions;
const User = db.users;
const Policy = db.policies;
const Beneficiary = db.beneficiaries;
const Transaction = db.transactions;
const Payment = db.payments;
const Hospitals = db.hospitals;
const Claim = db.claims;
const UserHospital = db.user_hospitals;

export default function (args: RequestBody, db: any) {
  return new Promise(async (resolve, reject) => {

    try {
        console.log("USSD ARGS", args)
      let user, user_policy;

      if (args.phoneNumber.charAt(0) == "+") {
        args.phoneNumber = args.phoneNumber.substring(1);
      }
      if (args.phoneNumber.length > 9) {
        args.phoneNumber = args.phoneNumber.substring(3);
      }

      // Check if session exists
      let session = await Session.findOne({
        where: {
          sid: configs.session_prefix + args.sessionId,
        },
      });

      if (!session) {
        // Create new session
        session = await Session.create({
          current_input: args.text,
          full_input: args.text,
          masked_input: args.text,
          active_state: configs.start_state,
          sid: configs.session_prefix + args.sessionId,
          language: configs.default_lang,
          phone_number: args.phoneNumber,
          hash: "",
          partner_id: 2,
        });
      } else {
        // Update existing session
        await Session.update(
          {
            current_input: args.text,
            full_input: args.text,
            masked_input: args.text,
          },
          {
            where: {
              sid: configs.session_prefix + args.sessionId,
            },
          }
        );
      }
      console.log(session.active_state)
      if(args.text == "1"){
        session.active_state = "buyForSelf";
        await session.save();
       
      }

      if(args.text == "1*1"){
        session.active_state = "buyForSelf.coverType";
        await session.save();
    }

    if(args.text == "1*1*1"){
        session.active_state = "buyForSelf.paymentOption";
        await session.save();
    }

    if(args.text == "1*1*2"){
        session.active_state = "buyForSelf.paymentOption";
        await session.save();
    }
    if(args.text == "1*1*2*1"){
        session.active_state = "buyForSelf.confirm";
        await session.save();
    }
    if(args.text == "1*1*1*1"){
        session.active_state = "buyForSelf.confirm";
        await session.save();
    }

        if(args.text == "2"){
            session.active_state = "buyForFamily";
            await session.save();
        }

        if(args.text == "2*1"){
            session.active_state = "buyForFamily.spouseOrChild";
            await session.save();
        }
        if(args.text == "2*2"){
            session.active_state = "buyForFamily.spouseAndChild";
            await session.save();
        }


        if(args.text == "3"){
            session.active_state = "buyForOthers";
            await session.save();
        }

        if(args.text == "4"){
            session.active_state = "makeClaim";
            await session.save();
        }

        if(args.text == "5"){
            session.active_state = "myPolicy";
            await session.save();
        }

        if(args.text == "6"){
            session.active_state = "viewHospital";
            await session.save();
        }

        if(args.text == "7"){
            session.active_state = "termsAndConditions";
            await session.save();
        }

        if(args.text == "8"){
            session.active_state = "faqs";
            await session.save();
        }

        if(args.text == "0"){
            session.active_state = "start_state";
            await session.save();
        }
      

      // Handle USSD menu states
      switch (session.active_state) {
        case "start_state":
          resolve("Ddwaliro Care\n1. Buy for self\n2. Buy (family)\n3. Buy (others)\n4. Make Claim\n5. My Policy\n6. View Hospital\n7. Terms & Conditions\n8. FAQs");
          break;

        case "buyForSelf":
          // Handle the "buyForSelf" state
          // Parse user input, validate, and perform actions
          // Then resolve with the appropriate USSD response
          // For example:
          resolve("1. Mini – UGX 10,000\n2. Midi - UGX 14,000\n3. Biggie – UGX 18,000\n0.Back\n00.Main Menu");
          break;

        case "buyForSelf.coverType":
        let sum_insured = "3M"
        let premium = 10000;
        let yearly_premium =    120000;
        let monthly_premium = 10000;
        let msisdn = args.phoneNumber;
        let first_name = "John";
        let last_name = "Doe";

        resolve(`Inpatient cover for ${msisdn},${first_name.toUpperCase()} ${last_name.toUpperCase()} UGX ${sum_insured} a year \nPAY\n1-UGX ${premium} monthly\n2-UGX ${yearly_premium} yearly\n\n0. Back 00. Main Menu`);
          
          break;

        case "buyForSelf.paymentOption":

    
            resolve("Pay UGX 10,000 payable monthly.\nTerms&Conditions - www.airtel.com\nEnter PIN to Agree and Pay \n\n0 .Back\n00 .Main Menu");
          break;

        case "buyForSelf.confirm":
            // Congratulations! You are now covered for Inpatient benefit of UGX ${si} and Funeral benefit of UGX ${lei}.
            // Cover valid till ${policy_end_date.toDateString()}`
            resolve("Congratulations! You are now covered for Inpatient benefit of UGX 3M and Funeral benefit of UGX 1M.\nCover valid till 31/12/2021\n\n0. Back\n00. Main Menu")
          break;

        case "buyForSelf.success":
            // Handle the "buyForSelf.success" state
            // Parse user input, validate, and perform actions
            // Then resolve with the appropriate USSD response
            break;

        case "buyForFamily":
            resolve(   "Buy for family " +
            "\n1. Self + Spouse or Child" +
            "\n2. Self + Spouse + 1 Child" +
            "\n3. Self + Spouse + 2 Children" +
            "\n01. Next" +
            "\n0.Back" +
            "\n00.Main Menu")
            break;

        case "buyForFamily.spouseOrChild":
        resolve(
            "\nEnter atleast Name of spouse or 1 child" +
              "\n0.Back" +
              "\n00.Main Menu"
          );
             break;

        case "buyForFamily.spouseAndChild":
            resolve(
                "\nEnter atleast Name of spouse and 1 child" +
                  "\n0.Back" +
                  "\n00.Main Menu"
              );
                 break;

        case "buyForFamily.coverType":
            // Handle the "buyForFamily.coverType" state
            // Parse user input, validate, and perform actions
            // Then resolve with the appropriate USSD response
            break;

        case "buyForFamily.paymentOption":
            // Handle the "buyForFamily.paymentOption" state
            // Parse user input, validate, and perform actions
            // Then resolve with the appropriate USSD response
            break;

        case "buyForFamily.confirm":
            // Handle the "buyForFamily.confirm" state
            // Parse user input, validate, and perform actions
            // Then resolve with the appropriate USSD response
            break;

        case "buyForFamily.success":
            // Handle the "buyForFamily.success" state
            // Parse user input, validate, and perform actions
            // Then resolve with the appropriate USSD response
            break;

        case "buyForOthers":
            // Handle the "buyForOthers" state
            // Parse user input, validate, and perform actions
            // Then resolve with the appropriate USSD response
            resolve( "Buy for others " +
            "\n4. Other + Spouse + 2 Children" +
            "\n5. Other + Spouse + 3 Children" +
            "\n6. Other + Spouse + 4 Children" +
            "\n7. Other + Spouse + 5 Children" +
            "\n0.Back" +
            "\n00.Main Menu")
            break;

        case "buyForOthers.coverType":
            // Handle the "buyForOthers.coverType" state
            // Parse user input, validate, and perform actions
            // Then resolve with the appropriate USSD response
            break;

        case "buyForOthers.paymentOption":
            // Handle the "buyForOthers.paymentOption" state
            // Parse user input, validate, and perform actions
            // Then resolve with the appropriate USSD response
            break;

        case "buyForOthers.confirm":
            // Handle the "buyForOthers.confirm" state
            // Parse user input, validate, and perform actions
            // Then resolve with the appropriate USSD response
            break;

        case "buyForOthers.success":
            // Handle the "buyForOthers.success" state
            // Parse user input, validate, and perform actions
            // Then resolve with the appropriate USSD response
            break;

        case "makeClaim":
            // Handle the "makeClaim" state
            // Parse user input, validate, and perform actions
            // Then resolve with the appropriate USSD response
            break;

        case "makeClaim.policyNumber":
            // Handle the "makeClaim.policyNumber" state
            // Parse user input, validate, and perform actions
            // Then resolve with the appropriate USSD response
            break;

        case "makeClaim.policyNumber.confirm":
            // Handle the "makeClaim.policyNumber.confirm" state
            // Parse user input, validate, and perform actions
            // Then resolve with the appropriate USSD response
            break;

        case "makeClaim.policyNumber.success":
            // Handle the "makeClaim.policyNumber.success" state
            // Parse user input, validate, and perform actions
            // Then resolve with the appropriate USSD response
            break;

        case "makeClaim.policyNumber.success":
            // Handle the "makeClaim.policyNumber.success" state
            // Parse user input, validate, and perform actions
            // Then resolve with the appropriate USSD response
            break;

        case "myPolicy":
            // Handle the "myPolicy" state
            // Parse user input, validate, and perform actions
            // Then resolve with the appropriate USSD response
            break;

       

        default:
          resolve("Invalid input. Please try again.");
          break;
      }
    } catch (error) {
      console.error("Error:", error);
      reject("An error occurred. Please try again later.");
    }
  });
}
