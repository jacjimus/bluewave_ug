import sendSMS from "../../services/sendSMS";
import { generateClaimId } from "../../services/utils";
import { v4 as uuidv4 } from 'uuid';

export function makeClaim(menu: any, args: any, db: any): void {

    const User = db.users;
    const Policy = db.policies;
    const Claim = db.claims;
    const Beneficiary = db.beneficiaries;

    if (args.phoneNumber.charAt(0) == "+") {

        args.phoneNumber = args.phoneNumber.substring(1);
    }


    const findUserByPhoneNumber = async (phoneNumber: any) => {
        return await User.findOne({
            where: {
                phone_number: phoneNumber,
            },
        });
    }
    //==================MAKE CLAIM===================
    menu.state('makeClaim', {
        run: async () => {
            console.log("* MAKE CLAIM", args.phoneNumber)

            menu.con('Make Claim ' +
                '\n1. Inpatient Claim' +
                '\n2. Death Claim' +
                '\n0. Back' +
                '\n00. Main Menu'
            );
        }
        ,
        next: {
            '1': 'inpatientClaim',
            '2': 'deathClaim',
            '0': 'account',
            '00': 'insurance'
        }
    })
    //==================INPATIENT CLAIM===================

    menu.state('inpatientClaim', {
        run: async () => {
            let claim_type = menu.val;

            let user = await User.findOne({
                where: {
                    phone_number: args.phoneNumber
                }
            })
            console.log("USER", user);
            const { policy_id, policy_type, beneficiary, sum_insured, last_expense_insured } = await Policy.findOne({
                where: {
                    user_id: user?.user_id,
                    policy_status: 'paid'
                }
            });

            const claimId = generateClaimId();
            console.log(claimId);
            let claim_amount: any;
            if (claim_type == 1) {
                claim_type = 'Inpatient Claim'
                claim_amount = sum_insured;
            }
            else {
                claim_type = 'Death Claim'
                claim_amount = last_expense_insured
            }

            let userClaim = await Claim.findOne({
                where: {
                    user_id: user?.user_id,
                    claim_type: claim_type,
                    claim_status: 'paid'
                }
            })

            if (userClaim) {
                menu.end(`Discharge Claim already made for this policy`);
                return;
            }


            const newClaim = await Claim.create({
                claim_number: claimId,
                policy_id: policy_id,
                user_id: user?.user_id,
                claim_date: new Date(),
                claim_status: 'pending',
                partner_id: user.partner_id,
                claim_description: `${claim_type} ID: ${claimId} for Member ID: ${user.membership_id}  ${policy_type.toUpperCase()} ${beneficiary.toUpperCase()} policy`,
                claim_type: claim_type,
                claim_amount: claim_amount

            });
            console.log("CLAIM", newClaim);

            menu.end(`Proceed to the preferred Hospital reception and mention your Airtel Phone number to verify your detail and get service`)

        }
        ,
        next: {
            '0': 'account',
            '00': 'insurance'
        }
    })

    menu.state('deathClaim', {
        run: async () => {

            menu.con(`Enter phone of next of Kin `)

        },
        next: {
            '*\\d+': 'deathClaimPhoneNumber',
            '0': 'account',
            '00': 'insurance'
        }
    })

    menu.state('deathClaimPhoneNumber', {
        run: async () => {
            const nextOfKinPhoneNumber = menu.val;
            const user = await findUserByPhoneNumber(args.phoneNumber);
            const nextOfKin = await Beneficiary.findOne({
                where: {
                    user_id: user?.user_id,
                    beneficiary_type: 'NEXTOFKIN'
                }
            })

            const newKin = await Beneficiary.create({
                beneficiary_id: uuidv4(),
                user_id: user?.user_id,
                phone_number: nextOfKinPhoneNumber,
                beneficiary_type: 'NEXTOFKIN'
            })
            console.log("NEXT OF KIN PHONE NUMBER", nextOfKinPhoneNumber);
            console.log("NEW KIN", newKin);

            menu.con(`Enter Name of deceased
                      0.Back 00.Main Menu  `)

        },
        next: {
            "*\\w+": 'deathClaimName',
            '0': 'account',
            '00': 'insurance'
        }
    })

    menu.state('deathClaimName', {
        run: async () => {
            const deceasedName = menu.val;
            console.log("DECEASED NAME", deceasedName);
            const user = await findUserByPhoneNumber(args.phoneNumber);
            const firstName = deceasedName.split(" ")[0];
            const middleName = deceasedName.split(" ")[1];
            const lastName = deceasedName.split(" ")[2] || deceasedName.split(" ")[1];

            await Beneficiary.update({ full_name: deceasedName, first_name: firstName, middle_name: middleName, last_name: lastName }, { where: { user_id: user?.user_id, beneficiary_type: 'NEXTOFKIN' } });

            menu.con(`Enter your Relationship to the deceased
                     0.Back 00.Main Menu `)

        },
        next: {
            "*\\w+": 'deathClaimRelationship',
            '0': 'account',
            '00': 'insurance'
        }
    })

    menu.state('deathClaimRelationship', {
        run: async () => {
            const relationship = menu.val;
            console.log("RELATIONSHIP", relationship);
            const user = await findUserByPhoneNumber(args.phoneNumber);

            await Beneficiary.update({ relationship: relationship }, { where: { user_id: user?.user_id, beneficiary_type: 'NEXTOFKIN' } });

            menu.con(`Enter Date of death in the format DDMMYYYY e.g 01011990"


            0.Back 00.Main Menu
             `)

        },
        next: {
            "*\\w+": 'deathClaimDate',
            '0': 'account',
            '00': 'insurance'
        }
    })


    menu.state('deathClaimDate', {
        run: async () => {
            let dateOfDeath = menu.val;
            console.log("DATE OF DEATH", dateOfDeath);

            // convert ddmmyyyy to valid date
            let day = dateOfDeath.substring(0, 2);
            let month = dateOfDeath.substring(2, 4);
            let year = dateOfDeath.substring(4, 8);
            let date = new Date(year, month - 1, day);
            console.log("date", date);
            let thisYear = new Date().getFullYear();

            dateOfDeath = date.toISOString().split('T')[0];


            const user = await findUserByPhoneNumber(args.phoneNumber);
            await Beneficiary.update({ date_of_death: dateOfDeath, age: thisYear - date.getFullYear() }, { where: { user_id: user?.user_id, beneficiary_type: 'NEXTOFKIN' } });

            menu.con(`Send Death certificate or Burial permit and Next of Kin's ID via Whatsapp No. 0759608107
                     0.Back 00.Main Menu
            `)

            const sms = `Your claim have been submitted. Send Death certificate or Burial permit and Next of Kin's ID via Whatsapp No. 0759608107 `

            await sendSMS(args.phoneNumber, sms);

        },
        next: {
            '0': 'account',
            '00': 'insurance'
        }
    })



}