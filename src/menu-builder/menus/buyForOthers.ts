import sendSMS from "../../services/sendSMS";
import { airtelMoney, initiateConsent } from '../../services/payment';
import { v4 as uuidv4 } from 'uuid';

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
                '\n1. Other +Spouse or Child' +
                '\n2. Other + Spouse + 1 Child' +
                '\n3. Other + Spouse + 2 Children' +
                '\n01 Next' +
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
                '\n4. Other + Spouse + 3 Child' +
                '\n5. Other + Spouse + 4 Child' +
                '\n6. Other + Spouse + 5 Children' +
                '\n0.Back' +
                '\n00.Main Menu'
            )
        },
        next: {
            '4': 'buyForOthers.member',
            '5': 'buyForOthers.member',
            '6': 'buyForOthers.member',
            '0': 'account',
            '00': 'insurance',
        }
    });

    menu.state('buyForOthers.member', {
        run: async () => {
            const member_number = menu.val;
            console.log("MEMBER NUMBER", member_number)
            await User.update({ total_member_number: member_number }, { where: { phone_number: args.phoneNumber } });

            menu.con(`
                    1. Mini – UGX 20,000
                    2. Midi – UGX 28,000
                    3. Biggie – UGX 35,000
                    0. Back
                    00. Main Menu`);
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
            let { user_id, partner_id } = await findUserByPhoneNumber(args.phoneNumber);
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

            menu.con('Enter at least Name of spouse or 1 child');
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
            console.log("NEW BENEFICIARY", newBeneficiary)
           
            menu.con('Enter Phone number for Other');
        },
        next: {
            '*\\d+': 'buyForFamily.selfSpousePhoneNumber',
        }
    });
    



}