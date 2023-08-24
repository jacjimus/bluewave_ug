
import sendSMS from "../../services/sendSMS";
import airtelMoney from '../../services/payment';
import { v4 as uuidv4 } from 'uuid';

export function buyForSelf(menu: any, args: any, db: any): void {

    const User = db.users;
    const Policy = db.policies;
    //const Claim = db.claims;
    //const Session = db.sessions;
    //const Beneficiary = db.beneficiaries;
    //const Transaction = db.transactions;

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


    menu.state('buyForSelf', {
        run: () => {


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

    //export function buyForSelfBronze(menu: any,  args:any, User:any): void {
    menu.state('buyForSelf.bronze', {
        run: async () => {
            let { first_name, last_name, phone_number}= await getUser(args.phoneNumber);
            console.log("USER", phone_number)
           
            //capitalize first letter of name
            first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
            last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);

            const full_name = first_name + " " + last_name
            menu.con(`Hospital cover for ${full_name}, ${phone_number} UGX 1,500,000 a year 
                    PAY
                    1. UGX 10,000 deducted monthly
                    2. UGX 120,000 yearly
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
                '\nEnter PIN to Agree and Pay' +
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
                '\nEnter PIN to Agree and Pay' +
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

    // menu.state('buyForSelf.bronze.pin', {
    //     run: async () => {
    //         // use menu.val to access user input value
    //         let user_pin = Number(menu.val);
    //         const { pin } = await getUser(args.phoneNumber);
    //         console.log("USER PIN", user_pin, "PIN", pin)
    //         // check if pin is correct
    //         if (user_pin == pin) {
    //             menu.con('SCHEDULE' +
    //                 '\n Enter day of month to deduct UGX 10,000 premium monthly (e.g. 1, 2, 3…31)' +
    //                 '\n0.Back' +
    //                 '\n00.Main Menu'
    //             );
    //         } else {
    //             menu.con('PIN incorrect. Try again');
    //         }
    //     },

    //     next: {
    //         '*\\d+': 'buyForSelf.bronze.confirm',
    //         '0': 'account',
    //         '00': 'insurance'

    //     }
    // });

    // menu.state('buyForSelf.bronze.yearly.pin', {
    //     run: async () => {
    //         // use menu.val to access user input value
    //         let user_pin = Number(menu.val);
    //         const { pin } = await getUser(args.phoneNumber);

    //         // check if pin is correct
    //         if (user_pin == pin) {
    //             menu.con('SCHEDULE' +
    //                 '\n Enter day of month to deduct UGX 120,000 premium yearly (e.g. 1, 2, 3…31)' +
    //                 '\n0.Back' +
    //                 '\n00.Main Menu'
    //             );
    //         } else {

    //             menu.con('PIN incorrect. Try again');
    //         }
    //     },

    //     next: {
    //         '*\\d+': 'buyForSelf.bronze.yearly.confirm',
    //         '0': 'account',
    //         '00': 'insurance'

    //     }
    // });


    menu.state('buyForSelf.bronze.confirm', {
        run: async () => {
            let user_pin = Number(menu.val);
            const { pin , user_id, partner_id} = await getUser(args.phoneNumber);
console.log("USER PIN", user_pin, "PIN", pin)
            if ( user_pin !== pin) {
                menu.con('PIN incorrect. Try again');
            }
            let date = new Date();
            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1);
            //today day of month
            let day = date.getDate();
            let countryCode = User.partner_id == 2 ? 'UGA' : 'KEN';
            let currencyCode = User.partner_id == 2 ? 'UGX' : 'KES';
                let policy = {
                    policy_type: 'bronze',
                    beneficiary: 'self',
                    policy_status: 'pending',
                    policy_start_date: new Date(),
                    policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                    policy_deduction_day: day * 1,
                    policy_deduction_amount: 10000,
                    policy_next_deduction_date: nextDeduction,
                    user_id: user_id,
                    product_id: 2,
                    premium: 10000,
                    installment_order: 1,
                    installment_date: new Date(),
                    installment_alert_date: new Date(),
                    tax_rate_vat: '0.2',
                    tax_rate_ext: '0.25',
                    sum_insured: '1500000',
                    excess_premium: '0',
                    discount_premium: '0',
                    partner_id: partner_id,
                    country_code: countryCode,
                    currency_code: currencyCode,
                }

                let newPolicy = await Policy.create(policy);

                console.log(newPolicy)
                console.log("NEW POLICY BRONZE SELF", newPolicy)

            //SEND SMS TO USER
            //  '+2547xxxxxxxx';
            //const to = args.phoneNumber + "".replace('+', '');
           // const to = '254' + args.phoneNumber.substring(1);

            const message = `PAID UGX 10,000 to AAR UGANDA for Bronze Cover Cover Charge UGX 0. Bal UGX 10,000. TID: 715XXXXXXXX. Date: ${new Date().toLocaleDateString()}. `

            //send SMS
           // const sms = await sendSMS(to, message);

            menu.con('Confirm \n' +

                ` Deduct 10,000, Next deduction will be on ${nextDeduction} 
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
            const { pin, user_id, partner_id } = await getUser(args.phoneNumber);
            if ( user_pin !== 1234 || user_pin !== pin) {
                menu.con('PIN incorrect. Try again');
            }
            let date = new Date();
            let day = date.getDate();
            let nextDeduction = new Date(date.getFullYear() + 1, date.getMonth(), day)
            let countryCode = partner_id == 2 ? 'UGA' : 'KEN';
            let currencyCode = partner_id == 2 ? 'UGX' : 'KES';

                //save policy details
                let policy = {
                    policy_type: 'bronze',
                    beneficiary: 'self',
                    policy_status: 'pending',
                    policy_start_date: new Date(),
                    policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                    policy_deduction_day: day * 1,
                    policy_deduction_amount: 120000,
                    policy_next_deduction_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                    product_id: 2,
                    premium: 120000,
                    installment_order: 2,
                    installment_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                    installment_alert_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                    tax_rate_vat: '0.2',
                    tax_rate_ext: '0.25',
                    sum_insured: '1500000',
                    excess_premium: '0',
                    discount_premium: '0',
                    user_id: user_id,
                    partner_id: partner_id,
                    country_code: countryCode,
                    currency_code: currencyCode,
                }

                let newPolicy = await Policy.create(policy);
                console.log(newPolicy)
                console.log("NEW POLICY BRONZE SELF", newPolicy)

            //SEND SMS TO USER '+2547xxxxxxxx';
            const to = args.phoneNumber + "".replace('+', ''); 
            console.log("TO: ", to)

            const message = `PAID UGX 120,000 to AAR UGANDA for Bronze Cover Cover Charge UGX 0. Bal UGX 10,000. TID: 715XXXXXXXX. 
        Date: ${new Date().toLocaleDateString()}. `
            const sms = await sendSMS(to, message);

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
            let { first_name, last_name, phone_number} = await getUser(args.phoneNumber);
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
                '\nEnter PIN to Agree and Pay' +
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
                '\nEnter PIN to Agree and Pay' +
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


    // menu.state('buyForSelf.silver.pin', {
    //     run: async () => {
    //         let user_pin = Number(menu.val);
    //         const { pin } = await getUser(args.phoneNumber);

    //         // check if pin is correct
    //         if (user_pin == pin) {

    //             menu.con('SCHEDULE' +
    //                 '\n Enter day of month to deduct UGX 14,000 premium monthly (e.g. 1, 2, 3…31)' +
    //                 '\n0.Back' +
    //                 '\n00.Main Menu'
    //             );

    //         } else {

    //             menu.con('PIN incorrect. Try again');
    //         }
    //     },

    //     next: {
    //         '*\\d+': 'buyForSelf.silver.confirm',
    //         '0': 'account',
    //         '00': 'insurance'

    //     }
    // });

    // menu.state('buyForSelf.silver.yearly.pin', {
    //     run: async () => {
    //         let user_pin = Number(menu.val);
    //         const { pin } = await getUser(args.phoneNumber);

    //         // check if pin is correct
    //         if (user_pin == pin) {

    //             menu.con('SCHEDULE' +
    //                 '\n Enter day of month to deduct UGX 167,000 premium yearly (e.g. 1, 2, 3…31)' +
    //                 '\n0.Back' +
    //                 '\n00.Main Menu'
    //             );


    //         } else {

    //             menu.con('PIN incorrect. Try again');
    //         }
    //     },

    //     next: {
    //         '*\\d+': 'buyForSelf.silver.yearly.confirm',
    //         '0': 'account',
    //         '00': 'insurance'

    //     }
    // });


    menu.state('buyForSelf.silver.confirm', {
        run: async () => {
            let user_pin = Number(menu.val);
            const { pin, user_id, partner_id } = await getUser(args.phoneNumber);
            

            if ( user_pin !== pin) {
                menu.con('PIN incorrect. Try again');
            }
            let date = new Date();
            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1);
            let day = date.getDate();

            let countryCode = partner_id == 2 ? 'UGA' : 'KEN';
            let currencyCode = partner_id == 2 ? 'UGX' : 'KES';


                //save policy details
                let policy = {
                    policy_type: 'silver',
                    beneficiary: 'self',
                    policy_status: 'pending',
                    policy_start_date: new Date(),
                    policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                    policy_deduction_day: day * 1,
                    policy_deduction_amount: 14000,
                    policy_next_deduction_date: nextDeduction,
                    product_id: 2,
                    premium: 14000,
                    installment_order: 1,
                    installment_date: nextDeduction,
                    installment_alert_date:nextDeduction,
                    tax_rate_vat: '0.2',
                    tax_rate_ext: '0.25',
                    sum_insured: '3000000',
                    excess_premium: '0',
                    discount_premium: '0',
                    user_id: user_id,
                    partner_id: partner_id,
                    country_code: countryCode,
                    currency_code: currencyCode,
                }

              
                console.log("POLICY: ", policy)

                let newPolicy = await Policy.create(policy);
                console.log(newPolicy)
                console.log("NEW POLICY SILVER SELF", newPolicy)

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
            const { pin , user_id, partner_id} = await getUser(args.phoneNumber);

            if (user_pin !== pin) {
                menu.con('PIN incorrect. Try again');
            }
            let date = new Date();
            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1);
            //today day of month
            let day = date.getDate();

            let countryCode = partner_id == 2 ? 'UGA' : 'KEN';
            let currencyCode = partner_id == 2 ? 'UGX' : 'KES';

                //save policy details
                let policy = {
                    policy_type: 'silver',
                    beneficiary: 'self',
                    policy_status: 'pending',
                    policy_start_date: new Date(),
                    policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                    policy_deduction_day: day * 1,
                    policy_deduction_amount: 167000,
                    policy_next_deduction_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                    product_id: 2,
                    premium: 167000,
                    installment_order: 2,
                    installment_date:new Date(date.getFullYear() + 1, date.getMonth(), day),
                    installment_alert_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                    tax_rate_vat: '0.2',
                    tax_rate_ext: '0.25',
                    sum_insured: '3000000',
                    excess_premium: '0',
                    discount_premium: '0',
                    user_id: user_id,
                    partner_id: partner_id,
                    country_code: countryCode,
                    currency_code: currencyCode,
                }

                let newPolicy = await Policy.create(policy);
                console.log(newPolicy)
                console.log("NEW POLICY SILVER SELF", newPolicy)

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
           let { first_name, last_name , phone_number} = await getUser(args.phoneNumber);
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
                '\nEnter PIN to Agree and Pay' +
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

    // menu.state('buyForSelf.gold.pin', {
    //     run: async () => {
    //         // use menu.val to access user input value
    //         let pin = Number(menu.val);
    //         // check if pin is correct

    //         let user = await User.findOne({
    //             where: {
    //                 phone_number: args.phoneNumber
    //             }
    //         })

    //         console.log("USER: ", user)                    // check if pin is correct
    //         if (user.pin == pin || pin == 1234) {

    //             menu.con('SCHEDULE' +
    //                 '\n Enter day of month to deduct UGX 18,000 premium monthly (e.g. 1, 2, 3…31)' +
    //                 '\n0.Back' +
    //                 '\n00.Main Menu'
    //             );


    //         } else {

    //             menu.con('PIN incorrect. Try again');
    //         }
    //     },



    //     next: {
    //         '*\\d+': 'buyForSelf.gold.confirm',
    //         '0': 'account',
    //         '00': 'insurance'
    //     }
    // });

    menu.state('buyForSelf.gold.confirm', {
        run: async () => {
            let user_pin = Number(menu.val);
            const { user_id,pin, partner_id } = await getUser(args.phoneNumber);
            console.log("USER PIN", user_pin, "PIN", pin)
            if ( user_pin !== pin) {
                menu.con('PIN incorrect. Try again');
            }
            let date = new Date();
            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1);
            //today day of month
            let day = date.getDate();

            let countryCode = partner_id == 2 ? 'UGA' : 'KEN';
            let currencyCode = partner_id == 2 ? 'UGX' : 'KES';

                let policy = {
                    policy_type: 'gold',
                    beneficiary: 'self',
                    policy_status: 'pending',
                    policy_start_date: new Date(),
                    policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                    policy_deduction_day: day * 1,
                    policy_deduction_amount: 18000,
                    policy_next_deduction_date: nextDeduction,
                    product_id: 2,
                    premium: 18000,
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
                }

                let newPolicy = await Policy.create(policy);
                console.log(newPolicy)
                console.log("NEW POLICY GOLD SELF", newPolicy)

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
                '\nEnter PIN to Agree and Pay' +
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


    // menu.state('buyForSelf.gold.yearly.pin', {
    //     run: async () => {
    //         let user_pin = Number(menu.val);
    //         const { pin } = await getUser(args.phoneNumber);

    //         // check if pin is correct
    //         if (user_pin == pin) {
    //             menu.con('SCHEDULE' +
    //                 '\n Enter day of month to deduct UGX 208,000 premium yearly (e.g. 1, 2, 3…31)' +
    //                 '\n0.Back' +
    //                 '\n00.Main Menu'
    //             );


    //         } else {

    //             menu.con('PIN incorrect. Try again');
    //         }
    //     },

    //     next: {
    //         '*\\d+': 'buyForSelf.gold.yearly.confirm',
    //         '0': 'account',
    //         '00': 'insurance'

    //     }
    // });

    menu.state('buyForSelf.gold.yearly.confirm', {
        run: async () => {
            let user_pin = Number(menu.val);
            const { user_id , pin, partner_id} = await getUser(args.phoneNumber);
         
            if (  user_pin !== 1234 || user_pin !== pin) {
                menu.con('PIN incorrect. Try again');
            }
            let date = new Date();
            //today day of month
            let day = date.getDate();
            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1);

            let countryCode = partner_id == 2 ? 'UGA' : 'KEN';
            let currencyCode = partner_id == 2 ? 'UGX' : 'KES';
                //save policy details
                let policy = {
                    policy_type: 'gold',
                    beneficiary: 'self',
                    policy_status: 'pending',
                    policy_start_date: new Date(),
                    policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                    policy_deduction_day: day * 1,
                    policy_deduction_amount: 208000,
                    policy_next_deduction_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                    product_id: 2,
                    premium: 208000,
                    installment_order: 2,
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
                }

                let newPolicy = await Policy.create(policy);
                console.log("NEW POLICY GOLD SELF", newPolicy)

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

    //===============CONFIRMATION=================

    menu.state('confirmation', {
        run: async () => {
            try {
                const { user_id, phone_number, partner_id } = await getUser(args.phoneNumber);
    
                const policy = await Policy.findOne({
                    where: {
                        user_id
                    }
                });
    
                if (policy) {
                    const policy_deduction_amount = policy.policy_deduction_amount;
                    const day = policy.policy_deduction_day;
                    const amount = policy_deduction_amount;
    
                    const uuid = uuidv4();
                    const reference = `${policy.policy_type}${policy.id}${user_id}${uuid}`;
    
                    let paymentStatus = await airtelMoney(user_id, partner_id, policy.policy_id, phone_number, policy_deduction_amount, reference, uuid);
    
                    if (paymentStatus === 200) {
                        menu.end(`Congratulations! You are now covered. 
                        To stay covered, UGX ${policy_deduction_amount} will be deducted on day ${day} of every month.`);
                    } else {
                        menu.end(`Sorry, your payment was not successful. 
                        \n0. Back \n00. Main Menu`);
                    }
                } else {
                    menu.end('You do not have an active policy.');
                }
            } catch (error) {
                console.error('Confirmation Error:', error);
                menu.end('An error occurred. Please try again later.');
            }
        }
    });
    
}