import { airtelMoney } from '../../services/payment';
import { v4 as uuidv4 } from 'uuid';

export function buyForFamily(menu: any, args: any, db: any): void {

    const Policy = db.policies;
    const Beneficiary = db.beneficiaries;
    const User = db.users;

    if (args.phoneNumber.charAt(0) == "+") {
        args.phoneNumber = args.phoneNumber.substring(1);
    }

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

    const findPaidPolicyByUser = async (user: any) => {
        return await Policy.findOne({
            where: {
                user_id: user?.user_id,
                policy_status: 'paid',
            },
        });
    };

    //============  BUY FOR FAMILY ===================

    //Buy for family
    menu.state('buyForFamily', {
        run: async () => {
            const user = await findUserByPhoneNumber(args.phoneNumber);
            const policy = await findPaidPolicyByUser(user);

            if (policy) {
                menu.end(`You already have an ${policy.policy_type.toUpperCase()} ACTIVE policy`);
                return;
            }

            menu.con('Buy for family ' +
                '\n1. Self  – UGX 10,000' +
                '\n2. Self + Spouse – UGX 20,000' +
                '\n3. Self + Spouse + 1 Child - UGX 30,000' +
                '\n4. Self + Spouse + 2 children – UGX 40,000' +
                '\n0.Back' +
                '\n00.Main Menu'
            )

        },
        next: {
            '1': 'buyForFamily.self',
            '2': 'buyForFamily.selfSpouse',
            '3': 'buyForFamily.selfSpouse1Child',
            '4': 'buyForFamily.selfSpouse2Children',
        }
    });




    //================BUY FOR FAMILY SELF=================

    menu.state('buyForFamily.self', {
        run: async () => {
            let { first_name, last_name, phone_number } = await findUserByPhoneNumber(args.phoneNumber);
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
            '1': 'buyForFamily.self.pay',
            '2': 'buyForFamily.self.pay.yearly',
            '0': 'account',
            '00': 'insurance'
        }
    });



    //buy for family self confirm
    menu.state('buyForFamily.self.pay', {
        run: async () => {
            // use menu.val to access user input value
            let day: any = Number(menu.val);
            let date = new Date();
            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, day);
            const { user_id, partner_id } = await findUserByPhoneNumber(args.phoneNumber);

            let countryCode = 'UGA'
            let currencyCode = 'UGX';

            //save policy details
            let policy = {
                policy_d: uuidv4(),
                policy_type: 'FAMILY',
                beneficiary: 'self',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                policy_deduction_day: day * 1,
                policy_deduction_amount: 10000,
                policy_next_deduction_date: nextDeduction,
                premium: 120000,
                policy_pending_premium: 10000,
                installment_order: 1,
                installment_date: nextDeduction,
                installment_alert_date: nextDeduction,
                tax_rate_vat: '0.2',
                tax_rate_ext: '0.25',
                sum_insured: '1500000',
                excess_premium: '0',
                discount_premium: '0',
                partner_id: partner_id,
                user_id: user_id,
                country_code: countryCode,
                currency_code: currencyCode,
                product_id: 'd18424d6-5316-4e12-9826-302b866a380c',
            }

            let newPolicy = await Policy.create(policy);
            console.log("NEW POLICY FAMILY SELF", newPolicy)
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
                ` Deduct UGX 10,000 , Next deduction will be on ${nextDeduction} \n` +
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

    //buy for family self 
    menu.state('buyForFamily.self.pay.yearly', {
        run: async () => {
            // use menu.val to access user input value
            let day: any = Number(menu.val);
            let date = new Date();
            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, day);
            const { user_id, partner_id } = await findUserByPhoneNumber(args.phoneNumber);

            //save policy details
            let policy = {
                policy_d: uuidv4(),
                policy_type: 'FAMILY',
                beneficiary: 'familySelf',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                policy_deduction_day: day * 1,
                policy_deduction_amount: 120000,
                policy_next_deduction_date: nextDeduction,
                premium: 120000,
                policy_pending_premium: 120000,
                installment_order: 0,
                installment_date: nextDeduction,
                installment_alert_date: nextDeduction,
                tax_rate_vat: '0.2',
                tax_rate_ext: '0.25',
                sum_insured: '1500000',
                excess_premium: '0',
                discount_premium: '0',
                partner_id: partner_id,
                user_id: user_id,
                country_code: "UGA",
                currency_code: "UGX",
                product_id: 'd18424d6-5316-4e12-9826-302b866a380c',
            }

            let newPolicy = await Policy.create(policy);
            console.log("NEW POLICY FAMILY SELF", newPolicy)
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
                ` Deduct UGX 120,000 , Next deduction will be on ${nextDeduction} \n` +
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


    //=============BUY FOR FAMILY SELF SPOUSE================

    menu.state('buyForFamily.selfSpouse', {
        run: () => {
            menu.con('\nEnter Spouse name' +
                '\n0.Back' +
                '\n00.Main Menu'
            )
        },
        next: {
            '*[a-zA-Z]+': 'buyForFamily.selfSpouseName',
            '0': 'buyForFamily',
            '00': 'insurance'
        }
    });


    menu.state('buyForFamily.selfSpouseName', {
        run: async () => {
            let { user_id, first_name, last_name, phone_number } = await findUserByPhoneNumber(args.phoneNumber);
            let spouse = menu.val;
            //split name into first name and last name
            let names = spouse.split(" ");
            let ben_first_name = names[0];
            let ben_last_name = names[1];


            let beneficiary = {
                beneficiary_id: uuidv4(),
                first_name: ben_first_name,
                last_name: ben_last_name,
                full_name: spouse,
                relationship: 'spouse',
                user_id: user_id
            }

            let newBeneficiary = await Beneficiary.create(beneficiary);
            console.log("new beneficiary selfSpouse", newBeneficiary)

            first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
            last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);

            const full_name = first_name + " " + last_name
            menu.con(`Hospital cover for ${full_name}, ${phone_number}, Sum Insured UGX 1,500,000 a year 
                    PAY
                    1. Monthly UGX 20,000
                    2. Yearly UGX 240,000 
                    0. Back
                    00. Main Menu`);
        },
        next: {
            '1': 'buyForFamily.selfSpouse.pay',
            '2': 'buyForFamily.selfSpouse.pay.yearly',
            '0': 'account',
            '00': 'insurance'
        }
    });



    //buyForFamily.selfSpouse.spouse
    menu.state('buyForFamily.selfSpouse.pay', {
        run: async () => {
            const { user_id, partner_id } = await findUserByPhoneNumber(args.phoneNumber);
            let date = new Date();
            // the day today
            let day = date.getDate();
            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, 1);

            const policy = {
                policy_d: uuidv4(),
                policy_type: 'FAMILY',
                beneficiary: 'selfSpouse',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), date.getDate()),
                policy_next_deduction_date: nextDeduction,
                policy_deduction_day: day * 1,
                policy_deduction_amount: 20000,
                premium: 240000,
                policy_pending_premium: 20000,
                installment_order: 1,
                installment_date: nextDeduction,
                installment_alert_date: nextDeduction,
                tax_rate_vat: '0.2',
                tax_rate_ext: '0.25',
                sum_insured: '1500000',
                excess_premium: '0',
                discount_premium: '0',
                partner_id: partner_id,
                user_id: user_id,
                country_code: "UGA",
                currency_code: "UGX",
                product_id: 'd18424d6-5316-4e12-9826-302b866a380c',
            }

            let newPolicy = await Policy.create(policy)
            console.log("NEW POLICY FAMILY SELFSPOUSE", newPolicy)

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
                ` Deduct UGX 20,000, Next deduction will be on ${nextDeduction} \n` +
                '\n1.Confirm \n' +
                '\n0.Back ' + ' 00.Main Menu'
            );
        },
        next: {
            '1': 'confirmation',
            '0': 'buyForFamily',
            '00': 'insurance'
        }

    });

    //buyForFamily.selfSpouse.pay.yearly
    menu.state('buyForFamily.selfSpouse.pay.yearly', {
        run: async () => {
            const { user_id, partner_id } = await findUserByPhoneNumber(args.phoneNumber);
            let date = new Date();
            // the day today
            let day = date.getDate();
            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, 1);

            const policy = {
                policy_d: uuidv4(),
                policy_type: 'FAMILY',
                beneficiary: 'selfSpouse',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), date.getDate()),
                policy_next_deduction_date: nextDeduction,
                policy_deduction_day: day * 1,
                policy_deduction_amount: 240000,
                premium: 240000,
                policy_pending_premium: 240000,
                installment_order: 0,
                installment_date: nextDeduction,
                installment_alert_date: nextDeduction,
                tax_rate_vat: '0.2',
                tax_rate_ext: '0.25',
                sum_insured: '1500000',
                excess_premium: '0',
                discount_premium: '0',
                partner_id: partner_id,
                user_id: user_id,
                country_code: "UGA",
                currency_code: "UGX",
                product_id: 'd18424d6-5316-4e12-9826-302b866a380c',
            }

            let newPolicy = await Policy.create(policy)
            console.log("NEW POLICY FAMILY SELFSPOUSE", newPolicy)

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
                ` Deduct UGX 240,000, Next deduction will be on ${nextDeduction} \n` +
                '\n1.Confirm \n' +
                '\n0.Back ' + ' 00.Main Menu'
            );
        },
        next: {
            '1': 'confirmation',
            '0': 'buyForFamily',
            '00': 'insurance'
        }

    });




    //=============BUY FOR FAMILY SELF SPOUSE 1 CHILD================
    menu.state('buyForFamily.selfSpouse1Child', {
        run: () => {
            menu.con('\nEnter your Spouse name' +
                '\n0.Back' +
                '\n00.Main Menu'
            )
        },
        next: {
            '*[a-zA-Z]+': 'buyForFamily.selfSpouse1Child.spouse',
            '0': 'buyForFamily',
            '00': 'insurance'
        }
    });

    menu.state('buyForFamily.selfSpouse1Child.spouse', {
        run: async () => {
            let { user_id } = await findUserByPhoneNumber(args.phoneNumber);

            let spouse = menu.val;
            let names = spouse.split(" ");
            let ben_first_name = names[0];
            let ben_last_name = names[1];


            let beneficiary = {
                beneficiary_id: uuidv4(),
                first_name: ben_first_name,
                last_name: ben_last_name,
                full_name: spouse,
                relationship: 'spouse',
                user_id: user_id
            }

            let newBeneficiary = await Beneficiary.create(beneficiary);
            console.log("new beneficiary selfSpouse1Child spouse", newBeneficiary)

            menu.con('\nEnter your Child s name' +
                '\n0.Back' +
                '\n00.Main Menu'
            )
        },
        next: {
            '*[a-zA-Z]+': 'buyForFamily.selfSpouse1Child.child',
            '2': 'buyForFamily.selfSpouse1Child.pay.yearly',
            '0': 'account',
            '00': 'insurance'
        }
    });


    menu.state('buyForFamily.selfSpouse1Child.child', {
        run: async () => {
            let { user_id, first_name, last_name, phone_number } = await findUserByPhoneNumber(args.phoneNumber);

            const child = menu.val;

            let names = child.split(" ");
            let ben_first_name = names[0];
            let ben_last_name = names[1];

            let beneficiary = {
                beneficiary_id: uuidv4(),
                full_name: child,
                relationship: 'child',
                first_name: ben_first_name,
                last_name: ben_last_name,
                user_id: user_id
            }

            let newBeneficiary = await Beneficiary.create(beneficiary);
            console.log("new beneficiary selfSpouse1Child child", newBeneficiary)


            //capitalize first letter of name
            first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
            last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);

            const full_name = first_name + " " + last_name
            menu.con(`Hospital cover for ${full_name}, ${phone_number}, Sum Insured UGX 1,500,000 a year 
                    PAY
                    1. Monthly UGX 30,000
                    2. Yearly UGX 360,000 
                    0. Back
                    00. Main Menu`);
        },
        next: {
            '*[a-zA-Z]+': 'buyForFamily.selfSpouse1Child.pay',
            '2': 'buyForFamily.selfSpouse1Child.pay.yearly',
            '0': 'account',
            '00': 'insurance'
        }
    });




    //buy for family selfSpouse1Child spouse
    menu.state('buyForFamily.selfSpouse1Child.pay', {
        run: async () => {
            const { user_id, partner_id } = await findUserByPhoneNumber(args.phoneNumber);
            let date = new Date();
            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, 1);
            let day = date.getDate();

            const policy = {
                policy_d: uuidv4(),
                policy_type: 'FAMILY',
                beneficiary: 'selfSpouse1Child',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), date.getDate()),
                policy_next_deduction_date: nextDeduction,
                policy_deduction_day: day * 1,
                policy_deduction_amount: 30000,
                premium: 360000,
                policy_pending_premium: 30000,
                installment_order: 1,
                installment_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
                installment_alert_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
                tax_rate_vat: '0.2',
                tax_rate_ext: '0.25',
                sum_insured: '1500000',
                excess_premium: '0',
                discount_premium: '0',
                partner_id: partner_id,
                user_id: user_id,
                country_code: "UGA",
                currency_code: "UGX",
                product_id: 'd18424d6-5316-4e12-9826-302b866a380c',
            }

            let newPolicy = await Policy.create(policy).catch(err => console.log(err));
            console.log("NEW POLICY FAMILY SELFSPOUSE1CHILD", newPolicy)
            const allPolicy = await Policy.findAll(
                {
                    where: {
                        user_id: user_id
                    }
                }

            );
            let numberOfPolicies = allPolicy.length;
            await User.update({ number_of_policies: numberOfPolicies }, { where: { user_id: user_id } });

            menu.con('\nEnter Child s name' +
                '\n0.Back' +
                '\n00.Main Menu'
            )
        },
        next: {
            '*[a-zA-Z]+': 'buyForFamily.selfSpouse1Child.confirm',
            '0': 'buyForFamily',
            '00': 'insurance'
        }
    });




    //buyForFamily.selfSpouse1Child.confirm
    menu.state('buyForFamily.selfSpouse1Child.confirm', {
        run: async () => {
            try {
                const childName = menu.val;
                console.log("CHILD NAME", childName);

                const { user_id } = await findUserByPhoneNumber(args.phoneNumber);

                let names = childName.split(" ");
                let ben_first_name = names[0];
                let ben_last_name = names[1];

                let beneficiary = {
                    beneficiary_id: uuidv4(),
                    full_name: childName,
                    relationship: 'child',
                    first_name: ben_first_name,
                    last_name: ben_last_name,
                    user_id: user_id
                }

                const newBeneficiary = await Beneficiary.create(beneficiary);
                console.log("New Beneficiary", newBeneficiary);

                const selectedDay = new Date().getDate();
                const date = new Date();
                const nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, selectedDay);


                menu.con('Confirm \n' +
                    ` Deduct UGX 30,000, Next deduction will be on ${nextDeduction} \n` +
                    '\n1. Confirm \n' +
                    '\n0. Back\n' +
                    '00. Main Menu'
                );
            } catch (error) {
                console.error('Error:', error);
                menu.end('An error occurred while processing the confirmation');
            }
        },
        next: {
            '1': 'confirmation',
            '0': 'buyForFamily',
            '00': 'insurance',
        },
    });

    menu.state('buyForFamily.selfSpouse1Child.pay.yearly', {
        run: async () => {
            const { user_id, partner_id } = await findUserByPhoneNumber(args.phoneNumber);

            //save spouse name to db users collection
            let date = new Date();
            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, 1);
            let day = date.getDate();

            const policy = {
                policy_d: uuidv4(),
                policy_type: 'family',
                beneficiary: 'selfSpouse1Child',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), date.getDate()),
                policy_next_deduction_date: nextDeduction,
                policy_deduction_day: day * 1,
                policy_deduction_amount: 360000,
                premium: 360000,
                policy_pending_premium: 360000,
                installment_order: 0,
                installment_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
                installment_alert_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
                tax_rate_vat: '0.2',
                tax_rate_ext: '0.25',
                sum_insured: '1500000',
                excess_premium: '0',
                discount_premium: '0',
                partner_id: partner_id,
                user_id: user_id,
                country_code: "UGA",
                currency_code: "UGX",
                product_id: 'd18424d6-5316-4e12-9826-302b866a380c',
            }

            let newPolicy = await Policy.create(policy).catch(err => console.log(err));
            console.log("NEW POLICY FAMILY SELFSPOUSE1CHILD", newPolicy)
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


            menu.con('\nEnter your Child s name' +
                '\n0.Back' +
                '\n00.Main Menu'
            )
        },
        next: {
            '*[a-zA-Z]+': 'buyForFamily.selfSpouse1Child.yearly.confirm',
            '0': 'buyForFamily',
            '00': 'insurance'
        }
    });


    menu.state('buyForFamily.selfSpouse1Child.yearly.confirm', {
        run: async () => {
            try {
                const childName = menu.val;
                console.log("CHILD NAME", childName);

                const { user_id } = await findUserByPhoneNumber(args.phoneNumber);

                let names = childName.split(" ");
                let ben_first_name = names[0];
                let ben_last_name = names[1];

                let beneficiary = {
                    beneficiary_id: uuidv4(),
                    full_name: childName,
                    relationship: 'child',
                    first_name: ben_first_name,
                    last_name: ben_last_name,
                    user_id: user_id
                }


                const newBeneficiary = await Beneficiary.create(beneficiary);
                console.log("New Beneficiary", newBeneficiary);

                const selectedDay = new Date().getDate();
                const date = new Date();
                const nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, selectedDay);


                menu.con('Confirm \n' +
                    ` Deduct UGX 360,000, Next deduction will be on ${nextDeduction} \n` +
                    '\n1. Confirm \n' +
                    '\n0. Back\n' +
                    '00. Main Menu'
                );
            } catch (error) {
                console.error('Error:', error);
                menu.end('An error occurred while processing the confirmation');
            }
        },
        next: {
            '1': 'confirmation',
            '0': 'buyForFamily',
            '00': 'insurance',
        },
    });


    //===========BUY FOR FAMILY SELF SPOUSE 2 CHILDREN==================
    menu.state('buyForFamily.selfSpouse2Children', {
        run: async () => {
            menu.con('\nEnter Spouse name' +
                '\n0.Back' +
                '\n00.Main Menu'
            )
        },
        next: {
            '*[a-zA-Z]+': 'buyForFamily.selfSpouse2Child.spouse',
            '0': 'buyForFamily',
            '00': 'insurance'
        }
    });

    //buyForFamily.selfSpouse2Children spouse
    menu.state('buyForFamily.selfSpouse2Child.spouse', {
        run: async () => {
            let spouse = menu.val;
            console.log("SPOUSE NAME 1", spouse)
            const { user_id, partner_id } = await findUserByPhoneNumber(args.phoneNumber);
            let countryCode = 'UGA'
            let currencyCode = 'UGX';
            const policy = {
                policy_d: uuidv4(),
                policy_type: 'FAMILY',
                beneficiary: 'selfSpouse2Child',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()),
                policy_deduction_amount: 40000,
                policy_deduction_day: new Date().getDate() * 1,
                policy_next_deduction_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
                premium: 40000,
                policy_pending_premium: 40000,
                installment_order: 1,
                installment_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
                installment_alert_date: new Date(new Date().getFullYear() + 1, new Date().getMonth() + 1, new Date().getDate()),
                tax_rate_vat: '0.2',
                tax_rate_ext: '0.25',
                sum_insured: '1500000',
                excess_premium: '0',
                discount_premium: '0',
                partner_id: partner_id,
                user_id: user_id,
                country_code: countryCode,
                currency_code: currencyCode,
                product_id: 'd18424d6-5316-4e12-9826-302b866a380c',
            }

            let newPolicy = await Policy.create(policy);
            console.log("NEW POLICY FAMILY SELFSPOUSE2CHILD", newPolicy)

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

            let names = spouse.split(" ");
            let ben_first_name = names[0];
            let ben_last_name = names[1];

            let beneficiary = {
                beneficiary_id: uuidv4(),
                full_name: spouse,
                relationship: 'spouse',
                first_name: ben_first_name,
                last_name: ben_last_name,
                user_id: user_id
            }

            let newBeneficiary = await Beneficiary.create(beneficiary);
            console.log("new beneficiary 1", newBeneficiary)

            menu.con('\nEnter Child 1 name' +
                '\n0.Back' +
                '\n00.Main Menu'
            )

        },
        next: {
            '*[a-zA-Z]+': 'buyForFamily.selfSpouse2Child.child1.name',
            '0': 'buyForFamily',
            '00': 'insurance'
        }

    });



    //buyForFamily.selfSpouse2Children child1 name
    menu.state('buyForFamily.selfSpouse2Child.child1.name', {
        run: async () => {
            let childName = menu.val;
            console.log("child1 3 NAME", childName)
            //save child1 name to db users collection
            const { user_id } = await findUserByPhoneNumber(args.phoneNumber);

            let names = childName.split(" ");
            let ben_first_name = names[0];
            let ben_last_name = names[1];

            let beneficiary = {
                beneficiary_id: uuidv4(),
                full_name: childName,
                relationship: 'child',
                first_name: ben_first_name,
                last_name: ben_last_name,
                user_id: user_id
            }

            let newBeneficiary = await Beneficiary.create(beneficiary);
            console.log("new beneficiary 3", newBeneficiary)

            menu.con('\n Enter Child 2 name' +
                '\n0.Back' +
                '\n00.Main Menu'
            )
        },
        next: {
            '*[a-zA-Z]+': 'buyForFamily.selfSpouse2Child.child2.name',
            '0': 'buyForFamily',
            '00': 'insurance'
        }
    });

    //buyForFamily.selfSpouse2Children child2
    menu.state('buyForFamily.selfSpouse2Child.child2.name', {
        run: async () => {
            let childName = menu.val;
            //save child2 name to db users collection
            const { user_id } = await findUserByPhoneNumber(args.phoneNumber);

            let names = childName.split(" ");
            let ben_first_name = names[0];
            let ben_last_name = names[1];

            let beneficiary = {
                beneficiary_id: uuidv4(),
                full_name: childName,
                relationship: 'child',
                first_name: ben_first_name,
                last_name: ben_last_name,
                user_id: user_id
            }

            let newBeneficiary = await Beneficiary.create(beneficiary);
            console.log("new beneficiary 4", newBeneficiary)

            menu.con(`Pay UGX 40000 deducted monthly.
                    Terms&Conditions - www.airtel.com
                    '\nEnter PIN or Membership ID to Agree and Pay' +
                    n0.Back
                    00.Main Menu`
            )
        },
        next: {
            '*\\d+': 'buyForFamily.selfSpouse2Child.pin',
            '0': 'buyForFamily',
            '00': 'insurance'
        }
    });

    //buyForFamily.selfSpouse2Children pin
    menu.state('buyForFamily.selfSpouse2Child.pin', {
        run: () => {

            let premium = 40000;
            menu.con(`Pay UGX ${premium} deducted monthly.
                            Terms&Conditions - www.airtel.com
                            '\nEnter PIN or Membership ID to Agree and Pay' +
                            n0.Back
                            00.Main Menu`
            )

        },
        next: {
            '*\\d+': 'buyForFamilySChedule',
            '0': 'buyForFamily',
            '00': 'insurance'
        }
    });


    menu.state('buyForFamilyPin', {
        run: () => {
            console.log("buyForFamilyPin")

            menu.con(`Pay UGX 40,000 deducted monthly.
                    Terms&Conditions - www.airtel.com
                    '\nEnter PIN or Membership ID to Agree and Pay' +
                    n0.Back
                    00.Main Menu`
            )
        },
        next: {
            '*\\d+': 'confirmation',
            '0': 'buyForFamily',
            '00': 'insurance'

        }
    });




}