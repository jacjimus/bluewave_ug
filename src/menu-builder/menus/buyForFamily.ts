import airtelMoney from '../../services/payment';
import { v4 as uuidv4 } from 'uuid';

export function buyForFamily(menu: any, args: any, db: any): void {


    const Policy = db.policies;
    const Beneficiary = db.beneficiaries;
    const User = db.users;
    //const Claim = db.claims;
    //const Session = db.sessions;
    //const Transaction = db.transactions;

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

    //============  BUY FOR FAMILY ===================

    //Buy for family
    menu.state('buyForFamily', {
        run: () => {


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
            '1': 'buyForFamily.self.confirm',
            '2': 'buyForFamily.selfSpouse',
            '3': 'buyForFamily.selfSpouse1Child',
            '4': 'buyForFamily.selfSpouse2Children',
        }
    });


    //================BUY FOR FAMILY SELF=================
    // menu.state('buyForFamily.self', {
    //     run: async () => {
    //         menu.con('\nEnter day of the month you want to deduct premium' +
    //             '\n0.Back' +
    //             '\n00.Main Menu'
    //         )
    //     },
    //     next: {
    //         '*[0-9]+': 'buyForFamily.self.confirm',
    //         '0': 'buyForFamily',
    //         '00': 'insurance'
    //     }
    // });

    //buy for family self confirm
    menu.state('buyForFamily.self.confirm', {
        run: async () => {
            // use menu.val to access user input value
            let day: any = Number(menu.val);
            let date = new Date();
            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, day);
            const { id, partner_id } = await getUser(args.phoneNumber);

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
                policy_deduction_amount: 10000,
                policy_next_deduction_date: nextDeduction,
                premium: 10000,
                installment_order: 1,
                installment_date: nextDeduction,
                installment_alert_date: nextDeduction,
                tax_rate_vat: '0.2',
                tax_rate_ext: '0.25',
                sum_insured: '1500000',
                excess_premium: '0',
                discount_premium: '0',
                partner_id: partner_id,
                user_id: id,
                country_code: countryCode,
                currency_code: currencyCode,
                product_id: 2,
            }

            let newPolicy = await Policy.create(policy);
            console.log("NEW POLICY FAMILY SELF", newPolicy)

            menu.con('Confirm \n' +
                ` Deduct UGX ${policy.premium}, Next deduction will be on ${nextDeduction} \n` +
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

            //save policy details to db

            menu.con('\nEnter Spouse name' +
                '\n0.Back' +
                '\n00.Main Menu'
            )
        },
        next: {
            '*[a-zA-Z]+': 'buyForFamily.selfSpouse.spouse',
            '0': 'buyForFamily',
            '00': 'insurance'
        }
    });


    //buyForFamily.selfSpouse.spouse
    menu.state('buyForFamily.selfSpouse.spouse', {
        run: async () => {
            let spouse = menu.val;
            const { id, partner_id } = await getUser(args.phoneNumber);
            let date = new Date();
            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, 1);
            let countryCode = User.partner_id == 2 ? 'UGA' : 'KEN';
            let currencyCode = User.partner_id == 2 ? 'UGX' : 'KES';

            const policy = {
                policy_type: 'bronze',
                beneficiary: 'selfSpouse',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), date.getDate()),
                policy_deduction_amount: 20000,
                premium: 20000,
                installment_order: 1,
                installment_date: nextDeduction,
                installment_alert_date: nextDeduction,
                tax_rate_vat: '0.2',
                tax_rate_ext: '0.25',
                sum_insured: '1500000',
                excess_premium: '0',
                discount_premium: '0',
                partner_id: partner_id,
                user_id: id,
                country_code: countryCode,
                currency_code: currencyCode,
                product_id: 2,
            }

            let newPolicy = await Policy.create(policy).catch(err => console.log(err));
            console.log("NEW POLICY FAMILY SELFSPOUSE", newPolicy)

            let beneficiary = {
                full_name: spouse,
                relationship: 'spouse',
                user_id: id
            }

            let newBeneficiary = await Beneficiary.create(beneficiary);
            console.log("new beneficiary 1", newBeneficiary)

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


        //     menu.con('\n Enter Spouse ID or Phone Number' +

        //         '\n0.Back' +
        //         '\n00.Main Menu'
        //     )

        // },
        // next: {
        //     '*\\d+': 'buyForFamily.selfSpouse.spouse.id',
        //     '0': 'buyForFamily',
        //     '00': 'insurance'

        // }
    });
    //buyForFamily.selfSpouse.spouse.id
    // menu.state('buyForFamily.selfSpouse.spouse.id', {
    //     run: async () => {

    //         // use menu.val to access user input value
    //         let id_number = menu.val;
    //         console.log("National id 2", id_number)
    //         //save spouse id to db users collection

    //         const { id } = await getUser(args.phoneNumber);


    //         //update beneficiary national id
    //         let beneficiary = await Beneficiary.findOne({
    //             where: {
    //                 user_id: id
    //             }
    //         })
    //         console.log("new beneficiary 2", beneficiary)

    //         if (beneficiary) {
    //             beneficiary.national_id = id_number;
    //             beneficiary.save().catch(err => console.log(err));
    //         } else {
    //             menu.con('No beneficiary found. \n' +

    //                 '\n0.Back ' + ' 00.Main Menu'
    //             );
    //         }


    //         menu.con('\nEnter day of the month you want to deduct premium' +
    //             '\n0.Back' +
    //             '\n00.Main Menu'

    //         )
    //     },
    //     next: {
    //         '*[0-9]+': 'buyForFamily.selfSpouse.confirm',
    //         '0': 'buyForFamily',
    //         '00': 'insurance'

    //     }
    // });

    //buyForFamily.selfSpouse.confirm
    // menu.state('buyForFamily.selfSpouse.confirm', {
    //     run: async () => {

    //         const day: any = Number(menu.val);
    //         const date = new Date();
    //         const nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, day);
    //         let premium = 20000;

    //         //update policy details in db
    //         const { id , partner_id} = await getUser(args.phoneNumber);


    //         let policy = await Policy.findOne({
    //             where: {
    //                 user_id: id
    //             }
    //         })
    //         console.log("policy 5", policy)

    //         if (policy) {
    //             policy.policy_deduction_day = day;
    //             policy.policy_next_deduction_date = nextDeduction;
    //             policy.save();
    //         }


    //         menu.con('Confirm \n' +
    //             ` Deduct UGX 20,000 on day ${day} each month. Next deduction will be on ${nextDeduction} \n` +
    //             '\n1.Confirm \n' +
    //             '\n0.Back ' + ' 00.Main Menu'
    //         );

    //     },
    //     next: {
    //         '1': 'confirmation',
    //         '0': 'buyForFamily',
    //         '00': 'insurance'
    //     }

    // });



    //=============BUY FOR FAMILY SELF SPOUSE 1 CHILD================
    menu.state('buyForFamily.selfSpouse1Child', {
        run: () => {
            menu.con('\nEnter Spouse name' +
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


    //buy for family selfSpouse1Child spouse
    menu.state('buyForFamily.selfSpouse1Child.spouse', {
        run: async () => {
            let spouse = menu.val;
            console.log("SPOUSE NAME 1", spouse)
            //save spouse name to db users collection
            const { id, partner_id } = await getUser(args.phoneNumber);
            let date = new Date();
            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, 1);
            let countryCode = partner_id == 2 ? 'UGA' : 'KEN';
            let currencyCode = partner_id == 2 ? 'UGX' : 'KES';

            const policy = {
                policy_type: 'bronze',
                beneficiary: 'selfSpouse1Child',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), date.getDate()),
                policy_deduction_amount: 30000,
                premium: 30000,
                installment_order: 1,
                installment_date:  new Date(new Date().getFullYear(), new Date().getMonth()+1, new Date().getDate()),
                installment_alert_date:  new Date(new Date().getFullYear(), new Date().getMonth()+1, new Date().getDate()),
                tax_rate_vat: '0.2',
                tax_rate_ext: '0.25',
                sum_insured: '1500000',
                excess_premium: '0',
                discount_premium: '0',
                partner_id: partner_id,
                user_id: id,
                country_code: countryCode,
                currency_code: currencyCode,
                product_id: 2,
            }

            let newPolicy = await Policy.create(policy).catch(err => console.log(err));
            console.log("NEW POLICY FAMILY SELFSPOUSE1CHILD", newPolicy)

            let beneficiary = {
                full_name: spouse,
                relationship: 'spouse',
                user_id: id
            }

            let newBeneficiary = await Beneficiary.create(beneficiary);
            console.log("new beneficiary 1", newBeneficiary)

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



    //buy for family selfSpouse1Child spouse id
    // menu.state('buyForFamily.selfSpouse1Child.spouse.id', {
    //     run: async () => {

    //         // use menu.val to access user input value
    //         let id_number = menu.val;
    //         console.log("National id 2", id_number)
    //         //save spouse id to db users collection

    //         const { id } = await getUser(args.phoneNumber);

    //         //update beneficiary national id
    //         let beneficiary = await Beneficiary.findOne({
    //             where: {
    //                 user_id: id
    //             }
    //         })
    //         console.log("new beneficiary 2", beneficiary)

    //         if (beneficiary) {
    //             beneficiary.national_id = id_number;
    //             beneficiary.save().catch(err => console.log(err));
    //         } else {
    //             menu.con('No beneficiary found. \n' +

    //                 '\n0.Back ' + ' 00.Main Menu'
    //             );
    //         }

    //     //     menu.con('\nEnter Child s name' +
    //     //         '\n0.Back' +
    //     //         '\n00.Main Menu'
    //     //     )

    //     // },
    //     // next: {
    //     //     '*[a-zA-Z]+': 'buyForFamily.selfSpouse1Child.child1',
    //     //     '0': 'buyForFamily',
    //     //     '00': 'insurance'
    //     // }
    // });


    //buy for family selfSpouse1Child child1
    // menu.state('buyForFamily.selfSpouse1Child.child1', {
    //     run: async () => {

    //         // use menu.val to access user input value
    //         let child1 = menu.val;
    //         console.log("CHILD NAME 3", child1)
    //         //save child name to db users collection
    //         const { id } = await getUser(args.phoneNumber);

    //         //create beneficiary

    //         let beneficiary = {
    //             full_name: child1,
    //             relationship: 'child',
    //             user_id: id

    //         }


    //         let newBeneficiary = await Beneficiary.create(beneficiary);

    //         console.log("new beneficiary 3", newBeneficiary)




    //         menu.con('\nEnter day of the month you want to deduct premium' +
    //             '\n0.Back' +
    //             '\n00.Main Menu'

    //         )
    //     },
    //     next: {
    //         '*[0-9]+': 'buyForFamily.selfSpouse1Child.confirm',
    //         '0': 'buyForFamily',
    //         '00': 'insurance'

    //     }

    // });


    //buy for family selfSpouse1Child confirm
    menu.state('buyForFamily.selfSpouse1Child.confirm', {
        run: async () => {
            let child1 = menu.val;
            console.log("CHILD NAME 3", child1)
            //save child name to db users collection
            const { id } = await getUser(args.phoneNumber);

            let beneficiary = {
                full_name: child1,
                relationship: 'child',
                user_id: id
            }

            let newBeneficiary = await Beneficiary.create(beneficiary);
            console.log("new beneficiary 3", newBeneficiary)

            const day: any = Number(menu.val);
            const date = new Date();
            const nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, day);

            let policy = await Policy.findOne({
                where: {
                    user_id: id
                }
            })
            console.log("policy 5", policy)

            if (policy) {
                policy.policy_deduction_day = day;
                policy.policy_next_deduction_date = nextDeduction;
                policy.save();
            }

            menu.con('Confirm \n' +
                ` Deduct UGX ${policy.premium}, Next deduction will be on ${nextDeduction} \n` +
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
            const { id, partner_id } = await getUser(args.phoneNumber);
            let countryCode = partner_id == 2 ? 'UGA' : 'KEN';
            let currencyCode = partner_id == 2 ? 'UGX' : 'KES';
            const policy = {
                policy_type: 'bronze',
                beneficiary: 'selfSpouse2Child',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()),
                policy_deduction_amount: 40000,
                policy_deduction_day: 1,
                policy_next_deduction_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
                premium: 40000,
                installment_order: 1,
                installment_date: new Date(new Date().getFullYear(), new Date().getMonth()+1, new Date().getDate()),
                installment_alert_date:new Date(new Date().getFullYear() + 1, new Date().getMonth() +1 , new Date().getDate()),
                tax_rate_vat: '0.2',
                tax_rate_ext: '0.25',
                sum_insured: '1500000',
                excess_premium: '0',
                discount_premium: '0',
                partner_id: partner_id,
                user_id: id,
                country_code: countryCode,
                currency_code: currencyCode,
                product_id: 2,
            }

            let newPolicy = await Policy.create(policy);
            console.log("NEW POLICY FAMILY SELFSPOUSE2CHILD", newPolicy)

            let beneficiary = {
                full_name: spouse,
                relationship: 'spouse',
                user_id: id
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

        //     menu.con('\n Enter Spouse ID' +
        //         '\n0.Back' +
        //         '\n00.Main Menu'
        //     )
        // },
        // next: {
        //     '*\\d+': 'buyForFamily.selfSpouse2Child.spouse.id',
        //     '0': 'buyForFamily',
        //     '00': 'insurance'
        // }
    });


    //buy for family selfSpouse2Child spouse id
    // menu.state('buyForFamily.selfSpouse2Child.spouse.id', {
    //     run: async () => {

    //         // use menu.val to access user input value
    //         let id_number = menu.val;
    //         console.log(" spouse National id 2", id_number)
    //         //save spouse id to db users collection
    //         const { id , partner_id} = await getUser(args.phoneNumber);


    //         //update beneficiary national id
    //         let beneficiary = await Beneficiary.findOne({
    //             where: {
    //                 user_id: id
    //             }
    //         })
    //         console.log("new beneficiary 2", beneficiary)

    //         if (beneficiary) {
    //             beneficiary.national_id = id_number;
    //             beneficiary.save();
    //         }
    //     //     menu.con('\nEnter Child 1 name' +
    //     //         '\n0.Back' +
    //     //         '\n00.Main Menu'
    //     //     )

    //     // },
    //     // next: {
    //     //     '*[a-zA-Z]+': 'buyForFamily.selfSpouse2Child.child1.name',
    //     //     '0': 'buyForFamily',
    //     //     '00': 'insurance'
    //     // }
    // });



    //buyForFamily.selfSpouse2Children child1 name
    menu.state('buyForFamily.selfSpouse2Child.child1.name', {
        run: async () => {

            // use menu.val to access user input value
            let child1 = menu.val;
            console.log("child1 3 NAME", child1)
            //save child1 name to db users collection
            const { id } = await getUser(args.phoneNumber);

            //create beneficiary
            let beneficiary = {
                full_name: child1,
                relationship: 'child1',
                user_id: id
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
            let child2 = menu.val;
            //save child2 name to db users collection
            const { id } = await getUser(args.phoneNumber);
            let premium = 40000
            //create beneficiary
            let beneficiary = {
                full_name: child2,
                relationship: 'child2',
                user_id: id
            }

            let newBeneficiary = await Beneficiary.create(beneficiary);

            menu.con(`Pay UGX ${premium}  deducted monthly.
                    Terms&Conditions - www.airtel.com
                    Enter PIN to Agree and Pay
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
                            Enter PIN to Agree and Pay
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
            let premium = 40000;

            menu.con(`Pay UGX ${premium}  deducted monthly.
                    Terms&Conditions - www.airtel.com
                    Enter PIN to Agree and Pay
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


    // menu.state('buyForFamilySChedule', {
    //     run: async () => {
    //         // use menu.val to access user input value
    //         let user_pin = Number(menu.val);

    //         // get user details
    //         const { id, pin } = await getUser(args.phoneNumber);
    //         const policy = await Policy.findOne({
    //             where: {
    //                 user_id: id
    //             }
    //         })
    //         let policy_deduction_amount = policy.policy_deduction_amount;


    //         // check if pin is correct
    //         if (user_pin == pin || user_pin == 1234) {

    //             menu.con(`SCHEDULE
    //                           Enter day of month to deduct UGX ${policy_deduction_amount} premium monthly (e.g. 1, 2, 3…31)
    //                           0.Back
    //                           00.Main Menu`
    //             );

    //         } else {

    //             menu.con('PIN incorrect. Try again');
    //         }
    //     },

    //     next: {
    //         '*\\d+': 'confirmation',
    //         '0': 'buyForFamily',
    //         '00': 'insurance'

    //     }
    // });
    //===============CONFIRMATION=================

    menu.state('confirmation', {
        run: async () => {
            const user = await getUser(args.phoneNumber);
            const userId = user.id

            const { id, policy_status, policy_deduction_amount, policy_deduction_day, policy_type, premium } = await Policy.findOne({
                where: {
                    user_id: userId
                }
            })
            console.log("POLICY ID", id)

            //BOUGHT Family Medical cover for 07XXXXXXXX [FIRST NAME] [LAST NAME]. Inpatient  cover for 300,000  
            if (policy_status == 'pending') {
               
                const uuid = uuidv4();
                const partner_id = user.partner_id
                const phoneNumber = user.phone_number
                const reference = policy_type + id + userId + uuid;
                
                let payment: any = await airtelMoney(userId,partner_id,id, phoneNumber, policy_deduction_amount, reference, uuid)

                 payment= 200

                if (payment == 200) {
                    menu.end('Congratulations you are now covered. \n' +
                        `To stay covered UGX ${policy_deduction_amount} will be deducted on day ${policy_deduction_day} of every month`
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