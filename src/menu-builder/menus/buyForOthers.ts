import sendSMS from "../../services/sendSMS";
import { airtelMoney, initiateConsent } from '../../services/payment';
import { v4 as uuidv4 } from 'uuid';
const bcrypt = require("bcrypt");

export function buyForOthers(menu: any, args: any, db: any): void {
    const User = db.users;
    const Policy = db.policies;

    if (args.phoneNumber.charAt(0) == "+") {

        args.phoneNumber = args.phoneNumber.substring(1);
    }

    console.log("ARGS PHONE NUMBER", args.phoneNumber)


    const findUserByPhoneNumber = async (phoneNumber: any) => {
        return await User.findOne({
            where: {
                phone_number: phoneNumber,
            },
        });
    };

    const findPaidPolicyByUser = async (user: any) => {
        return await Policy.findOne({
            where: {
                user_id: user?.user_id,
                policy_status: 'paid',
            },
        });
    };

    const findPolicyByUser = async (user_id: any) => {
        return await Policy.findOne({
            where: {
                user_id: user_id,
            },
        });
    }

    //buyForOthers
    menu.state('buyForOthers', {
        run: async () => {
            const user = await findUserByPhoneNumber(args.phoneNumber);
            const policy = await findPaidPolicyByUser(user);

            // if (policy) {
            //     menu.end(`You already have an ${policy.policy_type.toUpperCase()} ACTIVE policy`);
            //     return;
            // }

            menu.con('Buy for others ' +
                '\n1. Other ' +
                '\n2. Other + Spouse or Child' +
                '\n3. Other + Spouse + 1 Children' +
                '\n01. Next' +
                '\n0.Back' +
                '\n00.Main Menu'
            )
        },
        next: {
            '1': 'buyForOthers.member',
            '2': 'buyForOthers.member',
            '3': 'buyForOthers.member',
            '01': 'buyForOthers.next',
            '0': 'account',
        }
    });

    menu.state('buyForOthers.next', {
        run: async () => {
            const user = await findUserByPhoneNumber(args.phoneNumber);
            const policy = await findPaidPolicyByUser(user);

            // if (policy) {
            //     menu.end(`You already have an ${policy.policy_type.toUpperCase()} ACTIVE policy`);
            //     return;
            // }

            menu.con('Buy for others ' +
                '\n4. Other + Spouse + 2 Children' +  
                '\n5. Other + Spouse + 3 Children' +
                '\n6. Other + Spouse + 4 Children' +
                '\n7. Other + Spouse + 5 Children' +
                '\n0.Back' +
                '\n00.Main Menu'
            )
        },
        next: {
            '4': 'buyForOthers.member',
            '5': 'buyForOthers.member',
            '6': 'buyForOthers.member',
            '7': 'buyForOthers.member',
            '0': 'buyForOthers',
            '00': 'insurance',
        }
    });

    menu.state('buyForOthers.member', {
        run: async () => {
            let member_number = menu.val;
            console.log("MEMBER NUMBER", member_number)
            if (member_number == 1) {
                member_number = 'M';
            } else if (member_number == 2) {
                member_number = 'M+1';
            } else if (member_number == 3) {
                member_number = 'M+2';
            }
            else if (member_number == 4) {
                member_number = 'M+3';
            }
            else if (member_number == 5) {
                member_number = 'M+4';
            } else if (member_number == 6) {
                member_number = 'M+5';
            } else if (member_number == 7) {
                member_number = 'M+6';
            } else {
                menu.end('Invalid option');
            }
            console.log("MEMBER NUMBER 2", member_number)

            await User.update({ total_member_number: member_number }, { where: { phone_number: args.phoneNumber } });
            if (member_number == 'M') {
                menu.con('Buy for Other' +
                '\n1. Mini – UGX 10,000' +
                '\n2. Midi - UGX 14,000' +
                '\n3. Biggie – UGX 18,000' +
                '\n0.Back' +
                '\n00.Main Menu'
            )
            } else if (member_number == 'M+1') {
                menu.con(`
                1. Mini – UGX 20,000
                2. Midi – UGX 28,000
                3. Biggie – UGX 35,000
                0. Back
                00. Main Menu`);
            }
            else if (member_number == 'M+2') {

                menu.con(`
                1. Mini – UGX 30,000
                2. Midi – UGX 40,000
                3. Biggie – UGX 50,000
                0. Back
                00. Main Menu`);

            } else if (member_number == 'M+3') {
                menu.con(`
                1. Mini – UGX 40,000
                2. Midi – UGX 50,000
                3. Biggie – UGX 65,000
                0. Back
                00. Main Menu`);

            } else if (member_number == 'M+4') {
                menu.con(`
                1. Mini – UGX 50,000
                2. Midi – UGX 63,000
                3. Biggie – UGX 77,000
                0. Back
                00. Main Menu`);
            } else if (member_number == 'M+5') {
                menu.con(`
                1. Mini – UGX 60,000
                2. Midi – UGX 75,000
                3. Biggie – UGX 93,000
                0. Back
                00. Main Menu`);
            } else if (member_number == 'M+6') {
                menu.con(`
                1. Mini – UGX 70,000
                2. Midi – UGX 88,000
                3. Biggie – UGX 108,000
                0. Back
                00. Main Menu`);
            }
            else {
                menu.end('Invalid option');
            }

        },
        next: {
            '*\\d+': 'buyForOthers.coverType',
            '0': 'account',
            '00': 'insurance'
        }
    });


    //ask for phone number and name of person to buy for
    menu.state('buyForOthers.coverType', {
        run: async () => {
            let coverType = menu.val;
            console.log("COVER TYPE", coverType)
            let { user_id, partner_id, total_member_number } = await findUserByPhoneNumber(args.phoneNumber);
            let date = new Date();
            let day = date.getDate();

            if (coverType == 1) {
                coverType = 'MINI';
            } else if (coverType == 2) {
                coverType = 'MIDI';
            } else if (coverType == 3) {
                coverType = 'BIGGIE';
            }


            await Policy.create({
                user_id: user_id,
                policy_id: uuidv4(),
                policy_type: coverType,
                beneficiary: 'OTHERS',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                policy_deduction_day: day * 1,
                partner_id: partner_id,
                country_code: "UGA",
                currency_code: "UGX",
                product_id: 'd18424d6-5316-4e12-9826-302b866a380c',
            })

            await User.update({ cover_type: coverType }, { where: { phone_number: args.phoneNumber } });
            console.log("TOTAL MEMBER NUMBER", total_member_number)
            
            menu.con('\nEnter atleast Name of spouse or 1 child' +
                    '\n0.Back' +
                    '\n00.Main Menu'
        )
            
        },
        next: {
            '*[a-zA-Z]+': 'buyForOthersPhoneNumber',
        }
    });

    menu.state('buyForOthersPhoneNumber', {
        run: async () => {
            let name = menu.val;

            let user = await findUserByPhoneNumber(args.phoneNumber);

            const newBeneficiary = await db.beneficiaries.create({
                beneficiary_id: uuidv4(),
                user_id: user?.user_id,
                full_name: name,
                first_name: name.split(" ")[0],
                middle_name: name.split(" ")[1],
                last_name: name.split(" ")[2] || name.split(" ")[1],

            });
            let uniqueId = uuidv4();
            const newUser = await User.create({
                user_id: uniqueId,
                name: name,
                first_name: name.split(" ")[0],
                middle_name: name.split(" ")[1],
                last_name: name.split(" ")[2] || name.split(" ")[1],
                password: await bcrypt.hash(`${name}`, 10),
                createdAt: new Date(),
                membership_id: Math.floor(100000 + Math.random() * 900000),
                pin: Math.floor(1000 + Math.random() * 9000),
                nationality: 'UGANDA',
                bought_for: user?.user_id,
            })

            await User.update({ bought_for : newUser.user_id }, { where: { phone_number: args.phoneNumber } });


            console.log("NEW USER", newUser)


            await Policy.update({ bought_for: newUser.user_id }, { where: { user_id: user?.user_id, beneficiary: 'OTHERS' } });
            console.log("NEW BENEFICIARY", newBeneficiary);

           
            menu.con('Enter Phone number for Other');
        },
        next: {
            '*\\d+': 'buyForFamily.selfSpousePhoneNumber',
        }
    });
    



}