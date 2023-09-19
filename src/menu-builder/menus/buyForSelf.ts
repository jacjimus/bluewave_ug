
import sendSMS from "../../services/sendSMS";
import { airtelMoney, initiateConsent } from '../../services/payment';
import { v4 as uuidv4 } from 'uuid';

export function buyForSelf(menu: any, args: any, db: any): void {

    const User = db.users;
    const Policy = db.policies;

    if (args.phoneNumber.charAt(0) == "+") {

        args.phoneNumber = args.phoneNumber.substring(1);
    }

    console.log("ARGS PHONE NUMBER", args.phoneNumber)

    async function getUser(phoneNumber: any) {
        return await User.findOne({
            where: {
                phone_number: phoneNumber
            }
        })
    }
    const findUserByPhoneNumber = async (phoneNumber: any) => {
        return await User.findOne({
            where: {
                phone_number: phoneNumber,
            },
        });
    };

    const findPendingPolicyByUser = async (user: any) => {
        return await Policy.findOne({
            where: {
                user_id: user?.user_id,
                policy_status: 'paid',
            },
        });
    };

    menu.state('buyForSelf', {
        run: async () => {

            const user = await findUserByPhoneNumber(args.phoneNumber);
            const policy = await findPendingPolicyByUser(user);

            if (policy) {
                menu.end(`You already have an ${policy.policy_type.toUpperCase()} ACTIVE policy`);
                return;
            }
            menu.con('Buy for self ' +
                '\n1. Bronze  – UGX 10,000' +
                '\n2. Silver – UGX 14,000' +
                '\n3. Gold – UGX 18,000' +
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
    //}


    //================= BUY FOR SELF BRONZE =================
    menu.state('buyForSelf.bronze', {
        run: async () => {
            let { first_name, last_name, phone_number } = await getUser(args.phoneNumber);
            console.log("USER", phone_number)

            //capitalize first letter of name
            first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
            last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);

            const full_name = first_name + " " + last_name
            menu.con(`Hospital cover for ${full_name}, ${phone_number}, Sum Insured UGX 1,500,000 a year 
                    PAY
                    1. Monthly UGX 10,000
                    2. Yearly UGX 120,000 
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

    menu.state('buyForSelf.bronze.pay', {
        run: () => {
            menu.con('Pay UGX 10,000  deducted monthly.' +
                '\nTerms&Conditions - www.airtel.com' +
                '\nEnter PIN or Membership ID to Agree and Pay' +
                '\n0.Back' +
                '\n00.Main Menu'
            )
        },
        next: {
            '*\\d+': 'buyForSelf.bronze.confirm',
            '0': 'account',
            '00': 'insurance'
        }
    });

    menu.state('buyForSelf.bronze.pay.yearly', {
        run: () => {
            menu.con('Pay UGX 120,000 deducted yearly.' +
                '\nTerms&Conditions - www.airtel.com' +
                '\nEnter PIN or Membership ID to Agree and Pay' +
                '\n0.Back' +
                '\n00.Main Menu'
            )
        },
        next: {
            '*\\d+': 'buyForSelf.bronze.yearly.confirm',
            '0': 'account',
            '00': 'insurance'
        }
    });


    menu.state('buyForSelf.bronze.confirm', {
        run: async () => {
            let user_pin = Number(menu.val);
            const { pin, user_id, partner_id, membership_id } = await getUser(args.phoneNumber);
            console.log("user_pin", user_pin)
            console.log("pin", pin)
            console.log("membership_id", membership_id)
            if (user_pin !== pin && user_pin !== membership_id) {
                menu.con('Sorry incorrect PIN or Membership ID. Please Try again');
            }
            let date = new Date();
            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1);
            let installment_alert_date = new Date(date.getFullYear(), date.getMonth() + 1, date.getDate() - 3);
            //today day of month
            let day = date.getDate();
            let countryCode = 'UGA'
            let currencyCode = 'UGX';
            let policy = {
                policy_d: uuidv4(),
                policy_type: 'bronze',
                beneficiary: 'self',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                policy_deduction_day: day * 1,
                policy_deduction_amount: 10000,
                policy_next_deduction_date: nextDeduction,
                user_id: user_id,
                product_id: 'd18424d6-5316-4e12-9826-302b866a380c',
                premium: 120000,
                installment_order: 1,
                installment_date: nextDeduction,
                installment_alert_date: installment_alert_date,
                tax_rate_vat: '0.2',
                tax_rate_ext: '0.25',
                sum_insured: '1500000',
                excess_premium: '0',
                discount_premium: '0',
                partner_id: partner_id,
                country_code: countryCode,
                currency_code: currencyCode,
                policy_pending_premium: 10000,
            }

            let newPolicy = await Policy.create(policy);

            console.log(newPolicy)
            console.log("NEW POLICY BRONZE SELF", newPolicy)
            const allPolicy = await Policy.findAll(
                {
                    where: {
                        user_id: user_id
                    }
                }

            );
            let numberOfPolicies = allPolicy.length;

            console.log("NUMBER OF POLICIES", numberOfPolicies)
            await User.update({ number_of_policies: numberOfPolicies }, { where: { user_id: user_id } });



            const message = `PAID UGX 10,000 to AAR UGANDA for Bronze Cover Cover Charge UGX 0. Bal UGX 10,000. TID: 715XXXXXXXX. Date: ${new Date().toLocaleDateString()}. `


            menu.con(`Confirm, Deduct 10,000, Next deduction will be on ${nextDeduction} 
             1.Confirm 
             0.Back 
             00.Main Menu`
            );

        },
        next: {
            '1': 'confirmation',
            '0': 'account',
            '00': 'insurance'

        }
    });

    menu.state('buyForSelf.bronze.yearly.confirm', {
        run: async () => {
            let user_pin = Number(menu.val);
            const { pin, user_id, partner_id, membership_id } = await getUser(args.phoneNumber);
            if (user_pin !== pin && user_pin !== membership_id) {
                menu.con('Sorry incorrect PIN or Membership ID. Please Try again');
            }
            let date = new Date();
            let day = date.getDate();
            let installment_alert_date = new Date(date.getFullYear() + 1, date.getMonth(), day - 3)
            let countryCode = 'UGA'
            let currencyCode = 'UGX';

            //save policy details
            let policy = {
                policy_d: uuidv4(),
                policy_type: 'bronze',
                beneficiary: 'self',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                policy_deduction_day: day * 1,
                policy_deduction_amount: 120000,
                policy_next_deduction_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                product_id: 'd18424d6-5316-4e12-9826-302b866a380c',
                premium: 120000,
                installment_order: 0,
                installment_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                installment_alert_date: installment_alert_date,
                tax_rate_vat: '0.2',
                tax_rate_ext: '0.25',
                sum_insured: '1500000',
                excess_premium: '0',
                discount_premium: '0',
                user_id: user_id,
                partner_id: partner_id,
                country_code: countryCode,
                currency_code: currencyCode,
                policy_pending_premium: 120000,
            }

            let newPolicy = await Policy.create(policy);
            console.log(newPolicy)
            console.log("NEW POLICY BRONZE SELF", newPolicy)

            const allPolicy = await Policy.findAll(
                {
                    where: {
                        user_id: user_id
                    }
                }

            );
            let numberOfPolicies = allPolicy.length;

            console.log("NUMBER OF POLICIES", numberOfPolicies)
            await User.update({ number_of_policies: numberOfPolicies }, { where: { user_id: user_id } });




            menu.con('Confirm \n' +
                ` Deduct UGX 120,0000, Next deduction will be on ${policy.policy_end_date} \n` +
                '\n1.Confirm \n' +
                '\n0.Back ' + ' 00.Main Menu'
            );
        },
        next: {
            '1': 'confirmation',
            '0': 'account',
            '00': 'insurance'
        }
    });


    //================= BUY FOR SELF SILVER =================
    menu.state('buyForSelf.silver', {
        run: async () => {
            let { first_name, last_name, phone_number } = await getUser(args.phoneNumber);
            first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
            last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);
            let full_name = first_name + " " + last_name;
            menu.con(`Hospital cover for ${full_name}, ${phone_number} UGX 3,000,00 a year 
                    PAY' +
                    1. UGX 14,000 deducted monthly 
                    2. UGX 167,000 yearly
                    0.Back
                    00.Main Menu`
            )
        },
        next: {
            '1': 'buyForSelf.silver.pay',
            '2': 'buyForSelf.silver.yearly.pay',
            '0': 'account',
            '00': 'insurance'
        }
    });
    menu.state('buyForSelf.silver.pay', {
        run: () => {
            menu.con('Pay UGX 14,000 deducted monthly.' +
                '\nTerms&Conditions - www.airtel.com' +
                '\nEnter PIN or Membership ID to Agree and Pay' +
                '\n0.Back' +
                '\n00.Main Menu'
            )
        },
        next: {
            '*\\d+': 'buyForSelf.silver.confirm',
            '0': 'account',
            '00': 'insurance'
        }
    });
    menu.state('buyForSelf.silver.yearly.pay', {
        run: () => {
            menu.con('Pay UGX 167,000 deducted yearly.' +
                '\nTerms&Conditions - www.airtel.com' +
                '\nEnter PIN or Membership ID to Agree and Pay' +
                '\n0.Back' +
                '\n00.Main Menu'
            )
        },
        next: {
            '*\\d+': 'buyForSelf.silver.confirm',
            '0': 'account',
            '00': 'insurance'
        }
    });



    menu.state('buyForSelf.silver.confirm', {
        run: async () => {

            let user_pin = Number(menu.val);
            const { pin, user_id, partner_id, membership_id } = await getUser(args.phoneNumber);
            if (user_pin !== pin && user_pin !== membership_id) {
                menu.con('Sorry incorrect PIN or Membership ID. Please Try again');
            }
            let date = new Date();
            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1);
            let day = date.getDate();
            let countryCode = 'UGA'
            let currencyCode = 'UGX';
            //save policy details
            let policy = {
                policy_d: uuidv4(),
                policy_type: 'silver',
                beneficiary: 'self',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                policy_deduction_day: day * 1,
                policy_deduction_amount: 14000,
                policy_next_deduction_date: nextDeduction,
                product_id: 'd18424d6-5316-4e12-9826-302b866a380c',
                premium: 167000,
                installment_order: 1,
                installment_date: nextDeduction,
                installment_alert_date: nextDeduction,
                tax_rate_vat: '0.2',
                tax_rate_ext: '0.25',
                sum_insured: '3000000',
                excess_premium: '0',
                discount_premium: '0',
                user_id: user_id,
                partner_id: partner_id,
                country_code: countryCode,
                currency_code: currencyCode,
                policy_pending_premium: 14000,
            }


            console.log("POLICY: ", policy)

            let newPolicy = await Policy.create(policy);
            console.log(newPolicy)
            console.log("NEW POLICY SILVER SELF", newPolicy)
            const allPolicy = await Policy.findAll(
                {
                    where: {
                        user_id: user_id
                    }
                }

            );
            let numberOfPolicies = allPolicy.length;

            console.log("NUMBER OF POLICIES", numberOfPolicies)
            await User.update({ number_of_policies: numberOfPolicies }, { where: { user_id: user_id } });



            menu.con('Confirm \n' +

                ` Deduct UGX 14,000, Next deduction will be on ${nextDeduction} \n` +
                '\n1.Confirm \n' +
                '\n0.Back ' + ' 00.Main Menu'
            );
        },
        next: {
            '1': 'confirmation',
            '0': 'account',
            '00': 'insurance'
        }
    });


    menu.state('buyForSelf.silver.yearly.confirm', {
        run: async () => {
            let user_pin = Number(menu.val);
            const { pin, user_id, partner_id, membership_id } = await getUser(args.phoneNumber);
            if (user_pin !== pin && user_pin !== membership_id) {
                menu.con('Sorry incorrect PIN or Membership ID. Please Try again');
            }
            let date = new Date();

            //today day of month
            let day = date.getDate();
            let countryCode = 'UGA'
            let currencyCode = 'UGX';
            //save policy details
            let policy = {
                policy_d: uuidv4(),
                policy_type: 'silver',
                beneficiary: 'self',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                policy_deduction_day: day * 1,
                policy_deduction_amount: 167000,
                policy_next_deduction_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                product_id: 'd18424d6-5316-4e12-9826-302b866a380c',
                premium: 167000,
                installment_order: 0,
                installment_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                installment_alert_date: new Date(date.getFullYear() + 1, date.getMonth(), day - 3),
                tax_rate_vat: '0.2',
                tax_rate_ext: '0.25',
                sum_insured: '3000000',
                excess_premium: '0',
                discount_premium: '0',
                user_id: user_id,
                partner_id: partner_id,
                country_code: countryCode,
                currency_code: currencyCode,
                policy_pending_premium: 167000,
            }

            let newPolicy = await Policy.create(policy);
            console.log(newPolicy)
            console.log("NEW POLICY SILVER SELF", newPolicy)
            const allPolicy = await Policy.findAll(
                {
                    where: {
                        user_id: user_id
                    }
                }

            );
            let numberOfPolicies = allPolicy.length;

            console.log("NUMBER OF POLICIES", numberOfPolicies)
            await User.update({ number_of_policies: numberOfPolicies }, { where: { user_id: user_id } });


            menu.con('Confirm \n' +
                ` Deduct UGX 167,000  Next deduction will be on ${policy.policy_end_date} \n` +
                '\n1.Confirm \n' +
                '\n0.Back ' + ' 00.Main Menu'
            );
        },
        next: {
            '1': 'confirmation',
            '0': 'account',
            '00': 'insurance'

        }
    });


    //================= BUY FOR SELF GOLD =================

    menu.state('buyForSelf.gold', {
        run: async () => {
            let { first_name, last_name, phone_number } = await getUser(args.phoneNumber);
            first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
            last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);
            let full_name = first_name + ' ' + last_name;
            menu.con(`Hospital cover for ${full_name}, ${phone_number} UGX 5,000,000 a year 
                        PAY
                        1. UGX 18,000 deducted monthly 
                        2. UGX 208,000 yearly
                        0.Back
                        00.Main Menu`
            )
        },
        next: {
            '1': 'buyForSelf.gold.pay',
            '2': 'buyForSelf.gold.yearly.pay',
            '0': 'account',
            '00': 'insurance'
        }
    });
    menu.state('buyForSelf.gold.pay', {
        run: () => {
            menu.con('Pay UGX 18,000  deducted monthly.' +
                '\nTerms&Conditions - www.airtel.com' +
                '\nEnter PIN or Membership ID to Agree and Pay' +
                '\n0.Back' +
                '\n00.Main Menu'
            )
        },
        next: {
            '*\\d+': 'buyForSelf.gold.confirm',
            '0': 'account',
            '00': 'insurance'
        }
    });


    menu.state('buyForSelf.gold.confirm', {
        run: async () => {
            let user_pin = Number(menu.val);
            const { pin, user_id, partner_id, membership_id } = await getUser(args.phoneNumber);
            if (user_pin !== pin && user_pin !== membership_id) {
                menu.con('Sorry incorrect PIN or Membership ID. Please Try again');
            }
            let date = new Date();
            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1);
            //today day of month
            let day = date.getDate();
            let countryCode = 'UGA'
            let currencyCode = 'UGX';

            let policy = {
                policy_d: uuidv4(),
                policy_type: 'gold',
                beneficiary: 'self',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                policy_deduction_day: day * 1,
                policy_deduction_amount: 18000,
                policy_next_deduction_date: nextDeduction,
                product_id: 'd18424d6-5316-4e12-9826-302b866a380c',
                premium: 208000,
                installment_order: 1,
                installment_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                installment_alert_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                tax_rate_vat: '0.2',
                tax_rate_ext: '0.25',
                sum_insured: '5000000',
                excess_premium: '0',
                discount_premium: '0',
                user_id: user_id,
                partner_id: partner_id,
                country_code: countryCode,
                currency_code: currencyCode,
                policy_pending_premium: 18000,
            }

            let newPolicy = await Policy.create(policy);
            console.log(newPolicy)
            console.log("NEW POLICY GOLD SELF", newPolicy)

            const user = await User.findOne({ where: { user_id: user_id } });
            console.log("USER", user)
            let numberOfPolicies = user.number_of_policies;
            numberOfPolicies = numberOfPolicies + 1;
            console.log("NUMBER OF POLICIES", numberOfPolicies)
            await User.update({ number_of_policies: numberOfPolicies }, { where: { user_id: user_id } });
            console.log("USER UPDATED", user)

            menu.con('Confirm \n' +
                ` Deduct UGX 18,000, Next deduction will be on ${nextDeduction} \n` +
                '\n1.Confirm \n' +
                '\n0.Back ' + ' 00.Main Menu'
            );
        },
        next: {
            '1': 'confirmation',
            '0': 'account',
            '00': 'insurance'
        }
    });

    menu.state('buyForSelf.gold.yearly.pay', {
        run: () => {
            menu.con('Pay UGX 208,000 deducted yearly.' +
                '\nTerms&Conditions - www.airtel.com' +
                '\nEnter PIN or Membership ID to Agree and Pay' +
                '\n0.Back' +
                '\n00.Main Menu'
            )
        },
        next: {
            '*\\d+': 'buyForSelf.gold.yearly.confirm',
            '0': 'account',
            '00': 'insurance'
        }
    });

    menu.state('buyForSelf.gold.yearly.confirm', {
        run: async () => {
            let user_pin = Number(menu.val);
            const { pin, user_id, partner_id, membership_id } = await getUser(args.phoneNumber);
            if (user_pin !== pin && user_pin !== membership_id) {
                menu.con('Sorry incorrect PIN or Membership ID. Please Try again');
            }
            let date = new Date();
            //today day of month
            let day = date.getDate();
            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1);
            let countryCode = 'UGA'
            let currencyCode = 'UGX';
            //save policy details
            let policy = {
                policy_d: uuidv4(),
                policy_type: 'gold',
                beneficiary: 'self',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                policy_deduction_day: day * 1,
                policy_deduction_amount: 208000,
                policy_next_deduction_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                product_id: 'd18424d6-5316-4e12-9826-302b866a380c',
                premium: 208000,
                installment_order: 0,
                installment_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                installment_alert_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                tax_rate_vat: '0.2',
                tax_rate_ext: '0.25',
                sum_insured: '50000000',
                excess_premium: '0',
                discount_premium: '0',
                user_id: user_id,
                partner_id: partner_id,
                country_code: countryCode,
                currency_code: currencyCode,
                policy_pending_premium: 208000,
            }

            let newPolicy = await Policy.create(policy);
            console.log("NEW POLICY GOLD SELF", newPolicy)

            const allPolicy = await Policy.findAll(
                {
                    where: {
                        user_id: user_id
                    }
                }

            );
            let numberOfPolicies = allPolicy.length;

            console.log("NUMBER OF POLICIES", numberOfPolicies)
            await User.update({ number_of_policies: numberOfPolicies }, { where: { user_id: user_id } });


            menu.con('Confirm \n' +
                ` Deduct UGX 16,800, Next deduction will be on ${policy.policy_end_date} \n` +
                '\n1.Confirm \n' +
                '\n0.Back ' + ' 00.Main Menu'
            );
        },
        next: {
            '1': 'confirmation',
            '0': 'account',
            '00': 'insurance'

        }
    });



   

}