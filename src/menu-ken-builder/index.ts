import { RequestBody } from './typings/global';
import languages from './lang';
import configs from './configs';
import UssdMenu from 'ussd-builder';
import {
  UserModel,
  UssdSessionModel,
  PolicyModel,
  ClaimModel,
  PaymentModel,
  ProductModel,
  TransactionModel,
  PartnerModel,
  BeneficiaryModel
} from './models';

require('dotenv').config();

const menu = new UssdMenu();

export default function handleUssd(args: RequestBody, db: any) {
  return new Promise(async (resolve, reject) => {
    try {
      // CHECK IF USER EXISTS
      const existingUser = await UserModel.findOne({ phone_number: args.phoneNumber });
      let newUser;
      console.log("existingUser", existingUser);
      if (!existingUser) {

        let userObject = {
          first_name: "Dickens2",
          middle_name: "Juma2",
          last_name: "Juma2",
          email: "dickensjuma14@gmail.com",
          phone_number: "254704868024",
          dob: "1990-12-12",
          national_id: "27885858",
          role: "user",
          is_active: true,
          is_verified: false,
          pin: 1234,
          gender: "M",
          weight: 70,
          height: 170,
          title: "Mr",
          pinzip: "00100",
          marital_status: "single",
          partner_id: 1,
          password: "$2b$10$TxYQiS3/D2/SJLO6Iz6YdeMxozUTzsb8I47BtShD.ufeG8dC8o5au",
        }
        // CREATE A NEW USER IF THEY DON'T EXIST
        newUser = await UserModel.create(userObject);
        console.log("newUser", newUser);

      } else {
        console.log("existingUser", existingUser);
      }

      // CHECK IF SESSION EXISTS
      // let session = await UssdSessionModel.findOne({ sessionId: args.sessionId });


      // BUILD INPUT VARIABLE
      let buildInput = {
        current_input: args.text,
        user_input: args.text,
        full_input: args.text,
        masked_input: args.text,
        active_state: configs.start_state,
        sid: configs.session_prefix + args.sessionId,
        language: configs.default_lang,
        phone: args.phoneNumber,
        hash: "",
        user_id: existingUser?._id || newUser?._id


      }
      console.log("ARGS", args)
      console.log("buildInput", buildInput);

      // // CHECK IF SESSION EXISTS
      // let session = await UssdSessionModel.find({
      //   where: {
      //     sid: buildInput.sid
      //   }
      // });
      // console.log("session", session);

      // if (!session) {
      //   //console.log("session2", session);

      //   // UPDATE SESSION
      //   let updatedSession = await UssdSessionModel.findOneAndUpdate({
      //     active_state: buildInput.active_state,
      //     language: buildInput.language,
      //     full_input: buildInput.full_input,
      //     masked_input: buildInput.masked_input,
      //     hash: buildInput.hash,
      //     phone_number: buildInput.phone,
      //     user_id: buildInput.user_id,
      //     user_input: buildInput.current_input
      //   }, {
      //     where: {

      //       session_id: buildInput.sid
      //     }

      //   });
      //   console.log("updatedSession", updatedSession);


      // } else {
      //   // CREATE NEW SESSION
      //   let newSession = await UssdSessionModel.create({
      //     session_id: buildInput.sid,
      //     phone_number: buildInput.phone,
      //     serviceCode: args.serviceCode,
      //     text: args.text,
      //     language: buildInput.language,
      //     user_id: buildInput.user_id,
      //     active_state: buildInput.active_state,
      //     full_input: buildInput.full_input,
      //     masked_input: buildInput.masked_input,
      //     user_input: buildInput.current_input,
      //     hash: buildInput.hash
      //   }).then((session: any) => {
      //     console.log("session", session);
      //   }).catch((err: any) => {
      //     console.log("err", err);
      //   });

      //   console.log("newSession", newSession);
      // }


      // ===============SET START MENU STATES============
      // Set the start state for the menu
      menu.startState({
        run: async () => {
          menu.con('Welcome. Choose option:' +
            '\n1. Send Money' +
            '\n2. Airtime/Bundles' +
            '\n3. Withdraw Cash' +
            '\n4. Pay Bill' +
            '\n5. Payments' +
            '\n6. School Fees' +
            '\n7. Financial Services' +
            '\n8. Wewole' +
            '\n9. AirtelMoney Pay' +
            '\n10. My account' +
            '\n11. BiZ Wallet'
          );
        },
        next: {
          '7': 'insurance',
        }
      });

      menu.state('insurance', {
        run: () => {
          menu.con('Financial Services' +
            '\n1. Banks' +
            '\n2. Group Collections' +
            '\n3. M-SACCO' +
            '\n4. ATM Withdraw' +
            '\n5. NSSF Savings' +
            '\n6. Insurance' +
            '\n7. Yassako Loans' +
            '\n8. SACCO' +
            '\n9. AirtelMoney MasterCard' +
            '\n10. Loans' +
            '\n11. Savings' +
            '\nn  Next'
          );
        },
        next: {
          '6': 'medical_cover',
        }
      });


      menu.state('medical_cover', {
        run: () => {
          menu.con('Insurance ' +
            '\n1. Medical cover' +
            '\n2. Auto Insurance' +
            '\n0. Back' +
            '\n00. Main Menu'
          );
        },
        next: {
          '1': 'account',
        }
      });

      menu.state('account', {
        run: () => {

            menu.con('Medical cover ' +
                '\n1. Buy for self' +
                '\n2. Buy (family)' +
                '\n3. Buy (others)' +
                '\n4. Admission Claim' +
                '\n5. My Account' +
                '\n6. Choose Hopital' +
                '\n7. Terms & Conditions' +
                '\n8. FAQs' +
                '\n0.Back' +
                '\n00.Main Menu'
            )
        },
        next: {
            '1': 'buyForSelf',
            '2': 'buyForFamily',
            '3': 'buyForOthers',
            '4': 'makeClaim',
            '5': 'myAccount',
            '6': 'chooseHospital',
            '7': 'termsAndConditions',
            '8': 'faqs',
        }
    });
      //=================BUY FOR SELF=================
     
      menu.state('buyForSelf', {
        run: () => {
    
    
            menu.con('Buy for self ' +
                '\n1. Bronze  – Kes 300' +
                '\n2. Silver – Kes 650' +
                '\n3. Gold – Kes 14,000' +
                '\n0.Back' +
                '\n00.Main Menu'
            )
    
        },
        next: {
            '1': 'buyForSelf.bronze',
            '2': 'buyForSelf.silver',
            '3': 'buyForSelf.gold',
            '0': 'account',
            '00': 'insurance',
        }
    });
    menu.state('buyForSelf.bronze', {
      run: async () => {
  
  
          const user =  await UserModel.findOne({ phone_number: args.phoneNumber });
          console.log("USER", user)
          let product = await PolicyModel.findOne({
              where: {
                  partner_id: 1
              }
          });

          console.log("PRODUCT", product);


          console.log("USER", user);
          console.log("PRODUCT", product);
          let first_name = user.first_name 
          let last_name = user.last_name;
          let phone_number = user.phone_number;
          console.log(user,"FIRST NAME", first_name, "LAST NAME", last_name)
         
          //capitalize first letter of name
          first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
          last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);
  
           const full_name = first_name + " " + last_name
          menu.con(`Hospital cover for ${full_name}, ${phone_number} Kes 1M a year 
                      PAY
                      1. Kes 300 deducted monthly
                      2. Kes 3,294 yearly
                      0. Back
                      00. Main Menu`);
      },
      next: {
          '1': 'buyForSelf.bronze.pay',
          '2': 'buyForSelf.bronze.pay.yearly',
          '0': 'account',
          '00': 'insurance'
      }
  });

      //=================BUY FOR FAMILY=================
      // Logic for the "Buy for Family" menu state

      //================MY ACCOUNT===================
      // Logic for the "My Account" menu state

      //==================PAY NOW===================
      // Logic for the "Pay Now" menu state

      //==================FAQS===================
      // Logic for the "FAQs" menu state

      //===================TERMS AND CONDITIONS===================
      // Logic for the "Terms and Conditions" menu state

      //==================CHOOSE HOSPITAL===================
      // Logic for the "Choose Hospital" menu state

      // ================== HOSPITAL DETAILS ===================
      // Logic for the "Hospital Details" menu state

      // RUN THE MENU
      const menuRes = await menu.run(args);

      // RETURN THE MENU RESPONSE
      resolve(menuRes);
    } catch (error) {
      console.error(error);
      // SOMETHING WENT REALLY WRONG
      reject("END " + languages[configs.default_lang].generic.fatal_error);
    }
  });
}


