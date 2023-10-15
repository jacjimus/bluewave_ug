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
const utils_1 = require("../../services/utils");
const claimMenu = (args, db) => __awaiter(void 0, void 0, void 0, function* () {
    let { response, currentStep, userText, allSteps } = args;
    if (currentStep === 1) {
        response = "CON Make Claim " +
            "\n1. Inpatient Claim" +
            "\n2. Death Claim" +
            "\n0. Back" +
            "\n00. Main Menu";
    }
    else if (currentStep === 2) {
        switch (userText) {
            case "1":
                // CREATE CLAIM
                let claim_type = "Inpatient Claim";
                let user = yield db.users.findOne({
                    where: {
                        phone_number: args.phoneNumber,
                    },
                });
                const policy = yield db.policies.findOne({
                    where: {
                        user_id: user.user_id,
                        policy_status: "paid",
                    },
                });
                if (!policy) {
                    response = "END No policy found";
                    return response;
                }
                const claimId = (0, utils_1.generateClaimId)();
                const newClaim = yield db.claims.create({
                    claim_number: claimId,
                    policy_id: policy.policy_id,
                    user_id: user.user_id,
                    claim_date: new Date(),
                    claim_status: "pending",
                    partner_id: user.partner_id,
                    claim_description: `${claim_type} ID: ${claimId} for Member ID: ${user.membership_id}  ${policy.policy_type.toUpperCase()} ${policy.beneficiary.toUpperCase()} policy`,
                    claim_type: claim_type,
                    claim_amount: policy.sum_insured,
                });
                response = "END Proceed to the preferred Hospital reception and mention your Airtel Phone number to verify your detail and get service";
                break;
            case "2":
                response = "CON Enter Name of deceased";
                break;
        }
    }
    else if (currentStep === 3) {
        response = "CON Enter your Relationship to the deceased";
    }
    else if (currentStep === 4) {
        response = "CON Enter Date of death in the format DDMMYYYY e.g 01011990";
    }
    else if (currentStep === 5) {
        const deathData = {
            claim: allSteps[1],
            relationship: allSteps[2],
            // convert ddmmyyyy to valid date
            day: userText.substring(0, 2),
            month: userText.substring(2, 4),
            year: userText.substring(4, 8),
            date_of_death: ''
        };
        // CREATE CLAIM
        let claim_type = "Death Claim";
        let user = yield db.users.findOne({
            where: {
                phone_number: args.phoneNumber,
            },
        });
        const policy = yield db.policies.findOne({
            where: {
                user_id: user.user_id,
                policy_status: "paid",
            },
        });
        if (!policy) {
            response = "END No policy found";
            return response;
        }
        const claimId = (0, utils_1.generateClaimId)();
        const newClaim = yield db.claims.create({
            claim_number: claimId,
            policy_id: policy.policy_id,
            user_id: user.user_id,
            claim_date: new Date(),
            claim_status: "pending",
            partner_id: user.partner_id,
            claim_description: `${claim_type} ID: ${claimId} for Member ID: ${user.membership_id}  ${policy.policy_type.toUpperCase()} ${policy.beneficiary.toUpperCase()} policy`,
            claim_type: claim_type,
            claim_amount: policy.sum_insured,
        });
    }
    return response;
});
/*

      menu.state("makeClaim", {
        run: () => {
          console.log("* MAKE CLAIM");

          menu.con(
            "Make Claim " +
            "\n1. Inpatient Claim" +
            "\n2. Death Claim" +
            "\n0. Back" +
            "\n00. Main Menu"
          );
        },
        next: {
          "1": "inpatientClaim",
          "2": "deathClaim",
          "0": "account",
          "00": "insurance",
        },
      });
      //==================INPATIENT CLAIM===================

      menu.state("inpatientClaim", {
        run: async () => {
          let claim_type = menu.val.toString();

          let existingUser = await findUserByPhoneNumber(args.phoneNumber);
          menu.session.set('user', existingUser)

          console.log("USER DATA SESSION", existingUser);

          const {
            policy_id,
            policy_type,
            beneficiary,
            sum_insured,
            last_expense_insured,
          } = await Policy.findOne({
            where: {
              user_id: existingUser?.user_id,
              policy_status: "paid",
            },
          });

          const claimId = generateClaimId();
          console.log(claimId);
          let claim_amount: any;
          if (claim_type == "1") {
            claim_type = "Inpatient Claim";
            claim_amount = sum_insured;
          } else {
            claim_type = "Death Claim";
            claim_amount = last_expense_insured;
          }

          let userClaim = await Claim.findOne({
            where: {
              user_id: existingUser?.user_id,
              claim_type: claim_type,
              claim_status: "paid",
            },
          });

          if (userClaim) {
            menu.end(`Discharge Claim already made for this policy`);
            return;
          }

          const newClaim = await Claim.create({
            claim_number: claimId,
            policy_id: policy_id,
            user_id: existingUser?.user_id,
            claim_date: new Date(),
            claim_status: "pending",
            partner_id: existingUser.partner_id,
            claim_description: `${claim_type} ID: ${claimId} for Member ID: ${existingUser.membership_id
              }  ${policy_type.toUpperCase()} ${beneficiary.toUpperCase()} policy`,
            claim_type: claim_type,
            claim_amount: claim_amount,
          });
          console.log("CLAIM", newClaim);

          menu.end(
            `Proceed to the preferred Hospital reception and mention your Airtel Phone number to verify your detail and get service`
          );
        },
        next: {
          "0": "account",
          "00": "account",
        },
      });

      menu.state("deathClaim", {
        run: async () => {
          menu.con(`Enter phone of next of Kin `);
        },
        next: {
          "*\\d+": "deathClaimPhoneNumber",
          "0": "inpatientClaim",
          "00": "account",
        },
      });

      menu.state("deathClaimPhoneNumber", {
        run: async () => {
          let existingUser = await menu.session.get('user')

          console.log("USER DATA SESSION", existingUser);


          const nextOfKinPhoneNumber = menu.val;

          await Beneficiary.findOne({
            where: {
              user_id: existingUser?.user_id,
              beneficiary_type: "NEXTOFKIN",
            },
          });

          const newKin = await Beneficiary.create({
            beneficiary_id: uuidv4(),
            user_id: existingUser?.user_id,
            phone_number: nextOfKinPhoneNumber,
            beneficiary_type: "NEXTOFKIN",
          });
          console.log("NEXT OF KIN PHONE NUMBER", nextOfKinPhoneNumber);
          console.log("NEW KIN", newKin);

          menu.con(`Enter Name of deceased
                    0.Back 00.Main Menu  `);
        },
        next: {
          "*\\w+": "deathClaimName",
          "0": "deathClaim",
          "00": "account",
        },
      });

      menu.state("deathClaimName", {
        run: async () => {
          let existingUser = await menu.session.get('user')

          console.log("USER DATA SESSION", existingUser);


          const deceasedName = menu.val;
          console.log("DECEASED NAME", deceasedName);

          const firstName = deceasedName.split(" ")[0];
          const middleName = deceasedName.split(" ")[1];
          const lastName =
            deceasedName.split(" ")[2] || deceasedName.split(" ")[1];

          await Beneficiary.update(
            {
              full_name: deceasedName,
              first_name: firstName,
              middle_name: middleName,
              last_name: lastName,
            },
            { where: { user_id: existingUser?.user_id, beneficiary_type: "NEXTOFKIN" } }
          );

          menu.con(`Enter your Relationship to the deceased
                   0.Back 00.Main Menu `);
        },
        next: {
          "*\\w+": "deathClaimRelationship",
          "0": "deathClaimName",
          "00": "insurance",
        },
      });

      menu.state("deathClaimRelationship", {
        run: async () => {
          const relationship = menu.val;
          console.log("RELATIONSHIP", relationship);
            let existingUser = await menu.session.get('user')

          console.log("USER DATA SESSION", existingUser);


          await Beneficiary.update(
            { relationship: relationship },
            { where: { user_id: existingUser?.user_id, beneficiary_type: "NEXTOFKIN" } }
          );

          menu.con(`Enter Date of death in the format DDMMYYYY e.g 01011990"


          0.Back 00.Main Menu
           `);
        },
        next: {
          "*\\w+": "deathClaimDate",
          "0": "account",
          "00": "account",
        },
      });

      menu.state("deathClaimDate", {
        run: async () => {
          let dateOfDeath = menu.val;
            let existingUser = await menu.session.get('user')

          console.log("USER DATA SESSION", existingUser);


          // convert ddmmyyyy to valid date
          let day = dateOfDeath.substring(0, 2);
          let month = dateOfDeath.substring(2, 4);
          let year = dateOfDeath.substring(4, 8);
          let date = new Date(Number(year), Number(month) - 1, Number(day));
          console.log("date", date);
          let thisYear = new Date().getFullYear();

          dateOfDeath = date.toISOString().split("T")[0];

          await Beneficiary.update(
            { date_of_death: dateOfDeath, age: thisYear - date.getFullYear() },
            { where: { user_id: existingUser?.user_id, beneficiary_type: "NEXTOFKIN" } }
          );

          menu.con(`Send Death certificate or Burial permit and Next of Kin's ID via Whatsapp No. 0759608107
                   0.Back 00.Main Menu
          `);

          const sms = `Your claim have been submitted. Send Death certificate or Burial permit and Next of Kin's ID via Whatsapp No. 0759608107 `;

          await sendSMS(existingUser.phone_number, sms);
        },
        next: {
          "0": "deathClaimRelationship",
          "00": "account",
        },
      });

*/ 
