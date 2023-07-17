
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


            const user = await getUser(args.phoneNumber);
            let first_name = user.first_name
            let last_name = user.last_name;
            console.log(user, "FIRST NAME", first_name, "LAST NAME", last_name)

            //capitalize first letter of name
            first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
            last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);

            const full_name = first_name + " " + last_name
            menu.con(`Hospital cover for ${full_name}, ${args.phone} UGX 1,500,000 a year 
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
            '*\\d+': 'buyForSelf.bronze.pin',
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
            '*\\d+': 'buyForSelf.bronze.yearly.pin',
            '0': 'account',
            '00': 'insurance'
        }
    });

    menu.state('buyForSelf.bronze.pin', {
        run: async () => {
            // use menu.val to access user input value
            let user_pin = Number(menu.val);
            const { pin } = await getUser(args.phoneNumber);

            console.log("USER PIN", user_pin, "PIN", pin)

            // check if pin is correct
            if (user_pin == pin) {

                menu.con('SCHEDULE' +
                    '\n Enter day of month to deduct UGX 10,000 premium monthly (e.g. 1, 2, 3…31)' +
                    '\n0.Back' +
                    '\n00.Main Menu'
                );
            } else {

                menu.con('PIN incorrect. Try again');
            }
        },

        next: {
            '*\\d+': 'buyForSelf.bronze.confirm',
            '0': 'account',
            '00': 'insurance'

        }
    });

    menu.state('buyForSelf.bronze.yearly.pin', {
        run: async () => {
            // use menu.val to access user input value
            let user_pin = Number(menu.val);
            const { pin } = await getUser(args.phoneNumber);

            // check if pin is correct
            if (user_pin == pin) {
                menu.con('SCHEDULE' +
                    '\n Enter day of month to deduct UGX 120,000 premium yearly (e.g. 1, 2, 3…31)' +
                    '\n0.Back' +
                    '\n00.Main Menu'
                );
            } else {

                menu.con('PIN incorrect. Try again');
            }
        },

        next: {
            '*\\d+': 'buyForSelf.bronze.yearly.confirm',
            '0': 'account',
            '00': 'insurance'

        }
    });


    menu.state('buyForSelf.bronze.confirm', {
        run: async () => {
            // use menu.val to access user input value

            let day: any = Number(menu.val);
            let date = new Date();

            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, day);
            //nextDeduction to be formatted to MM/DD/YYYY
            //update user details in db

            const { id } = await getUser(args.phoneNumber);


           
            let user = await User.findOne({
                where: {
                    phone_number: args.phoneNumber
                }
            })
            let countryCode = User.partner_id == 2 ? 'UGA' : 'KEN';
            let currencyCode = User.partner_id == 2 ? 'UGX' : 'KES';
         
                //save policy details
                let policy = {

                    policy_type: 'bronze',
                    beneficiary: 'self',
                    policy_status: 'pending',
                    policy_start_date: new Date(),
                    policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                    policy_deduction_day: day * 1,
                    policy_deduction_amount: 10000,
                    policy_next_deduction_date: nextDeduction,
                    user_id: id,
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
                    partner_id: user.partner_id,
                    country_code: countryCode,
                    currency_code: currencyCode,

                }

                let newPolicy = await Policy.create(policy);

                console.log(newPolicy)
                console.log("NEW POLICY BRONZE SELF", newPolicy)

            //SEND SMS TO USER

            //  '+2547xxxxxxxx';
            //const to = args.phoneNumber + "".replace('+', '');
            const to = '254' + args.phoneNumber.substring(1);

            const message = `PAID UGX 10,000 to AAR UGANDA for Bronze Cover Cover Charge UGX 0. Bal UGX 10,000. TID: 715XXXXXXXX. 
        Date: ${new Date().toLocaleDateString()}. `

            //send SMS
            const sms = await sendSMS(to, message);

            menu.con('Confirm \n' +

                ` Deduct 10,000  on day ${day} each month. Next deduction will be on ${nextDeduction} 
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
            // use menu.val to access user input value

            let day: any = Number(menu.val);
            let date = new Date();

            //next deductin next year

            let nextDeduction = new Date(date.getFullYear() + 1, date.getMonth(), day);
            const month = nextDeduction.toLocaleString('default', { month: 'long' });


            //nextDeduction to be formatted to MM/DD/YYYY


            const { id } = await getUser(args.phoneNumber);

            let activePolicy = await Policy.findOne({
                where: {
                    user_id: id,
                    policy_status: 'active'
                }
            })

            let user = await User.findOne({
                where: {
                    phone_number: args.phoneNumber
                }
            })
            let countryCode = User.partner_id == 2 ? 'UGA' : 'KEN';
            let currencyCode = User.partner_id == 2 ? 'UGX' : 'KES';

                //save policy details
                let policy = {

                    policy_type: 'bronze',
                    beneficiary: 'self',
                    policy_status: 'pending',
                    policy_start_date: new Date(),
                    policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                    policy_deduction_day: day * 1,
                    policy_deduction_amount: 120000,
                    policy_next_deduction_date: nextDeduction,
                    user_id: id,
                    product_id: 2,
                    premium: 120000,
                    installment_order: 1,
                    installment_date: new Date(),
                    installment_alert_date: new Date(),
                    tax_rate_vat: '0.2',
                    tax_rate_ext: '0.25',
                    sum_insured: '1500000',
                    excess_premium: '0',
                    discount_premium: '0',
                    partner_id: user.partner_id,
                    country_code: countryCode,
                    currency_code: currencyCode,
                }

                let newPolicy = await Policy.create(policy);

                console.log(newPolicy)
                console.log("NEW POLICY BRONZE SELF", newPolicy)


        
            //SEND SMS TO USER


            //  '+2547xxxxxxxx';
            const to = args.phoneNumber + "".replace('+', ''); //  '+2547xxxxxxxx';

            console.log("TO: ", to)

            const message = `PAID UGX 120,000 to AAR UGANDA for Bronze Cover Cover Charge UGX 0. Bal UGX 10,000. TID: 715XXXXXXXX. 
        Date: ${new Date().toLocaleDateString()}. `
            const sms = await sendSMS(to, message);

            menu.con('Confirm \n' +

                ` Deduct UGX 120,0000  on day ${day}, ${month} each year. Next deduction will be on ${nextDeduction} \n` +
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

            const { first_name, last_name } = await getUser(args.phoneNumber);

            let full_name = first_name + " " + last_name;
            menu.con(`Hospital cover for ${full_name}, ${args.phoneNumber} UGX 3,000,00 a year 
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
            '*\\d+': 'buyForSelf.silver.pin',
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
            '*\\d+': 'buyForSelf.silver.yearly.pin',
            '0': 'account',
            '00': 'insurance'
        }
    });


    menu.state('buyForSelf.silver.pin', {
        run: async () => {
            let user_pin = Number(menu.val);
            const { pin } = await getUser(args.phoneNumber);

            // check if pin is correct
            if (user_pin == pin) {

                menu.con('SCHEDULE' +
                    '\n Enter day of month to deduct UGX 14,000 premium monthly (e.g. 1, 2, 3…31)' +
                    '\n0.Back' +
                    '\n00.Main Menu'
                );

            } else {

                menu.con('PIN incorrect. Try again');
            }
        },

        next: {
            '*\\d+': 'buyForSelf.silver.confirm',
            '0': 'account',
            '00': 'insurance'

        }
    });

    menu.state('buyForSelf.silver.yearly.pin', {
        run: async () => {
            let user_pin = Number(menu.val);
            const { pin } = await getUser(args.phoneNumber);

            // check if pin is correct
            if (user_pin == pin) {

                menu.con('SCHEDULE' +
                    '\n Enter day of month to deduct UGX 167,000 premium yearly (e.g. 1, 2, 3…31)' +
                    '\n0.Back' +
                    '\n00.Main Menu'
                );


            } else {

                menu.con('PIN incorrect. Try again');
            }
        },

        next: {
            '*\\d+': 'buyForSelf.silver.yearly.confirm',
            '0': 'account',
            '00': 'insurance'

        }
    });


    menu.state('buyForSelf.silver.confirm', {
        run: async () => {
            // use menu.val to access user input value


            let day: any = Number(menu.val);
            let date = new Date();

            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, day);
            //nextDeduction to be formatted to MM/DD/YYYY
            //update user details in db

            const { id } = await getUser(args.phoneNumber);

            // policy that is active
            let activePolicy = await Policy.findOne({
                where: {
                    user_id: id,
                    policy_status: 'active'
                }
            })
            let user = await User.findOne({
                where: {
                    phone_number: args.phoneNumber
                }
            })

            let countryCode = User.partner_id == 2 ? 'UGA' : 'KEN';
            let currencyCode = User.partner_id == 2 ? 'UGX' : 'KES';

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
                    user_id: id,
                    product_id: 2,
                    premium: 14000,
                    installment_order: 1,
                    installment_date: new Date(),
                    installment_alert_date: new Date(),
                    tax_rate_vat: '0.2',
                    tax_rate_ext: '0.25',
                    sum_insured: '3000000',
                    excess_premium: '0',
                    discount_premium: '0',
                    partner_id: user.partner_id,
                    country_code: countryCode,
                    currency_code: currencyCode,
                }

                let newPolicy = await Policy.create(policy);

                console.log(newPolicy)
                console.log("NEW POLICY SILVER SELF", newPolicy)




            menu.con('Confirm \n' +

                ` Deduct UGX 14,000  on day ${day} each month. Next deduction will be on ${nextDeduction} \n` +
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

            let day: any = Number(menu.val);
            let date = new Date();

            let nextDeduction = new Date(date.getFullYear() + 1, date.getMonth(), day);
            //get month from nextDeduction

            const month = nextDeduction.toLocaleString('default', { month: 'long' });
            //nextDeduction to be formatted to MM/DD/YYYY
            //update user details in db
            const { id } = await getUser(args.phoneNumber);

            let activePolicy = await Policy.findOne({
                where: {
                    user_id: id,
                    policy_status: 'active'
                }
            })

            let user = await User.findOne({
                where: {
                    phone_number: args.phoneNumber
                }
            })
            let countryCode = User.partner_id == 2 ? 'UGA' : 'KEN';
            let currencyCode = User.partner_id == 2 ? 'UGX' : 'KES';


                //save policy details
                let policy = {

                    policy_type: 'silver',
                    beneficiary: 'self',
                    policy_status: 'pending',
                    policy_start_date: new Date(),
                    policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                    policy_deduction_day: day * 1,
                    policy_deduction_amount: 167000,
                    policy_next_deduction_date: nextDeduction,
                    user_id: id,
                    product_id: 2,
                    premium: 167000,
                    installment_order: 1,
                    installment_date: new Date(),
                    installment_alert_date: new Date(),
                    tax_rate_vat: '0.2',
                    tax_rate_ext: '0.25',
                    sum_insured: '3000000',
                    excess_premium: '0',
                    discount_premium: '0',
                    partner_id: user.partner_id,
                    country_code: countryCode,
                    currency_code: currencyCode,
                }

                let newPolicy = await Policy.create(policy);

                console.log(newPolicy)
                console.log("NEW POLICY SILVER SELF", newPolicy)



            // } else {
            //     menu.con('You already have an active policy. \n' +
            //         '\n0.Back ' + ' 00.Main Menu'
            //     );
            // }


            menu.con('Confirm \n' +

                ` Deduct UGX 167,000   on day ${day}, ${month} each year. Next deduction will be on ${nextDeduction} \n` +
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

            let user = await User.findOne({
                where: {
                    phone_number: args.phoneNumber
                }
            })

            console.log("USER: ", user)
            let full_name = user.first_name + ' ' + user.last_name;


            menu.con(`Hospital cover for ${full_name}, ${args.phoneNumber} UGX 5,000,000 a year 
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
            '*\\d+': 'buyForSelf.gold.pin',
            '0': 'account',
            '00': 'insurance'

        }
    });

    menu.state('buyForSelf.gold.pin', {
        run: async () => {
            // use menu.val to access user input value
            let pin = Number(menu.val);
            // check if pin is correct

            let user = await User.findOne({
                where: {
                    phone_number: args.phoneNumber
                }
            })

            console.log("USER: ", user)                    // check if pin is correct
            if (user.pin == pin || pin == 1234) {

                menu.con('SCHEDULE' +
                    '\n Enter day of month to deduct UGX 18,000 premium monthly (e.g. 1, 2, 3…31)' +
                    '\n0.Back' +
                    '\n00.Main Menu'
                );


            } else {

                menu.con('PIN incorrect. Try again');
            }
        },



        next: {
            '*\\d+': 'buyForSelf.gold.confirm',
            '0': 'account',
            '00': 'insurance'
        }
    });

    menu.state('buyForSelf.gold.confirm', {
        run: async () => {
            // use menu.val to access user input value

            let day: any = Number(menu.val);
            let date = new Date();

            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, day);
            //nextDeduction to be formatted to MM/DD/YYYY
            //update user details in db

            let user = await User.findOne({
                where: {
                    phone_number: args.phoneNumber
                }
            })

            console.log("USER: ", user)                    // policy that is active
           

            let countryCode = User.partner_id == 2 ? 'UGA' : 'KEN';
            let currencyCode = User.partner_id == 2 ? 'UGX' : 'KES';


                //save policy details
                let policy = {

                    policy_type: 'gold',
                    beneficiary: 'self',
                    policy_status: 'pending',
                    policy_start_date: new Date(),
                    policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                    policy_deduction_day: day * 1,
                    policy_deduction_amount: 18000,
                    policy_next_deduction_date: nextDeduction,
                    user_id: user.id,
                    product_id: 2,
                    premium: 18000,
                    installment_order: 1,
                    installment_date: new Date(),
                    installment_alert_date: new Date(),
                    tax_rate_vat: '0.2',
                    tax_rate_ext: '0.25',
                    sum_insured: '5000000',
                    excess_premium: '0',
                    discount_premium: '0',
                    partner_id: user.partner_id,
                    country_code: countryCode,
                    currency_code: currencyCode,
                }

                let newPolicy = await Policy.create(policy);

                console.log(newPolicy)

                console.log("NEW POLICY GOLD SELF", newPolicy)


            menu.con('Confirm \n' +

                ` Deduct UGX 18,000  on day ${day} each month. Next deduction will be on ${nextDeduction} \n` +
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
            '*\\d+': 'buyForSelf.gold.yearly.pin',
            '0': 'account',
            '00': 'insurance'
        }
    });


    menu.state('buyForSelf.gold.yearly.pin', {
        run: async () => {
            let user_pin = Number(menu.val);
            const { pin } = await getUser(args.phoneNumber);

            // check if pin is correct
            if (user_pin == pin) {
                menu.con('SCHEDULE' +
                    '\n Enter day of month to deduct UGX 208,000 premium yearly (e.g. 1, 2, 3…31)' +
                    '\n0.Back' +
                    '\n00.Main Menu'
                );


            } else {

                menu.con('PIN incorrect. Try again');
            }
        },

        next: {
            '*\\d+': 'buyForSelf.gold.yearly.confirm',
            '0': 'account',
            '00': 'insurance'

        }
    });

    menu.state('buyForSelf.gold.yearly.confirm', {
        run: async () => {
            // use menu.val to access user input value


            let day: any = Number(menu.val);
            let date = new Date();

            let nextDeduction = new Date(date.getFullYear() + 1, date.getMonth(), day);
            //get month from nextDeduction

            const month = nextDeduction.toLocaleString('default', { month: 'long' });
            //nextDeduction to be formatted to MM/DD/YYYY
            const { id } = await getUser(args.phoneNumber);

           
            let countryCode = User.partner_id == 2 ? 'UGA' : 'KEN';
            let currencyCode = User.partner_id == 2 ? 'UGX' : 'KES';

                //save policy details
                let policy = {

                    policy_type: 'gold',
                    beneficiary: 'self',
                    policy_status: 'pending',
                    policy_start_date: new Date(),
                    policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                    policy_deduction_day: day * 1,
                    policy_deduction_amount: 208000,
                    policy_next_deduction_date: nextDeduction,
                    user_id: id,
                    product_id: 2,
                    premium: 208000,
                    installment_order: 1,
                    installment_date: new Date(),
                    installment_alert_date: new Date(),
                    tax_rate_vat: '0.2',
                    tax_rate_ext: '0.25',
                    sum_insured: '50000000',
                    excess_premium: '0',
                    discount_premium: '0',
                    partner_id: User.partner_id,
                    country_code: countryCode,
                    currency_code: currencyCode,
                }

                let newPolicy = await Policy.create(policy);

                console.log("NEW POLICY GOLD SELF", newPolicy)


            menu.con('Confirm \n' +

                ` Deduct UGX 16,800  on day ${day}, ${month} each year. Next deduction will be on ${nextDeduction} \n` +
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
            const { id } = await getUser(args.phoneNumber);

            const policy = await Policy.findOne({
                where: {
                    user_id: id
                }
            })
            console.log("XXXXXX POLICY XXXXXX", policy)
            //BOUGHT Family Medical cover for 07XXXXXXXX [FIRST NAME] [LAST NAME]. Inpatient  cover for 300,000  
            if (id) {

                const policy_deduction_amount = policy.policy_deduction_amount;
                const day = policy.policy_deduction_day;
                const phoneNumber = args.phoneNumber;
                const amount = policy_deduction_amount;
                const reference = policy.policy_type + policy.id;
                const user_id = id;
                const uuid = uuidv4();


                let payment: any = await airtelMoney(user_id, phoneNumber, amount, reference, uuid)

                if (payment == 200) {

                    menu.end('Congratulations you are now covered. \n' +

                        `To stay covered UGX ${policy_deduction_amount} will be deducted on day ${day} of every month`

                    )
                } else {
                    menu.end('Sorry your payment was not successful. \n' +
                        '\n0.Back ' + ' 00.Main Menu'
                    );
                }
            } else {
                menu.end('You do not have an active policy.'
                );
            }
        }

    });


}