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
            const { user_id, partner_id } = await getUser(args.phoneNumber);

            let countryCode = 'UGA'
            let currencyCode = 'UGX';

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
            const user = await User.findOne({ where: { user_id: user_id } }); 
            console.log("USER", user)
            let numberOfPolicies = user.number_of_policies;
            numberOfPolicies = numberOfPolicies + 1;
            console.log("NUMBER OF POLICIES", numberOfPolicies)
            await User.update({ number_of_policies: numberOfPolicies }, { where: { user_id: user_id } });
            console.log("USER UPDATED", user)

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
            const { user_id, partner_id } = await getUser(args.phoneNumber);
            let date = new Date();
            // the day today
            let day = date.getDate();
            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, 1);
            let countryCode = 'UGA'
            let currencyCode = 'UGX';

            const policy = {
                policy_type: 'bronze',
                beneficiary: 'selfSpouse',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), date.getDate()),
                policy_next_deduction_date: nextDeduction,
                policy_deduction_day: day * 1,
                policy_deduction_amount: 20000,
                premium: 20000,
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
                country_code: countryCode,
                currency_code: currencyCode,
                product_id: 'd18424d6-5316-4e12-9826-302b866a380c',
            }

            let newPolicy = await Policy.create(policy)
            console.log("NEW POLICY FAMILY SELFSPOUSE", newPolicy)

            let beneficiary = {
                beneficiary_id: uuidv4(),
                full_name: spouse,
                relationship: 'spouse',
                user_id: user_id
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

    });



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
            const { user_id, partner_id } = await getUser(args.phoneNumber);
            let date = new Date();
            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, 1);
            let countryCode = 'UGA'
            let currencyCode = 'UGX';
            let day = date.getDate();

            const policy = {
                policy_type: 'bronze',
                beneficiary: 'selfSpouse1Child',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), date.getDate()),
                policy_next_deduction_date: nextDeduction,
                policy_deduction_day: day * 1,
                policy_deduction_amount: 30000,
                premium: 30000,
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
                country_code: countryCode,
                currency_code: currencyCode,
                product_id: 'd18424d6-5316-4e12-9826-302b866a380c',
            }

            let newPolicy = await Policy.create(policy).catch(err => console.log(err));
            console.log("NEW POLICY FAMILY SELFSPOUSE1CHILD", newPolicy)

            let beneficiary = {
                full_name: spouse,
                relationship: 'spouse',
                user_id: user_id
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




   //buyForFamily.selfSpouse1Child.confirm
menu.state('buyForFamily.selfSpouse1Child.confirm', {
    run: async () => {
      try {
        const childName = menu.val;
        console.log("CHILD NAME", childName);
  
        // Save child's name to the database (users collection)
        const { user_id } = await getUser(args.phoneNumber);
  
        const beneficiary = {
          beneficiary_id: uuidv4(),
          full_name: childName,
          relationship: 'child',
          user_id: user_id,
        };
  
        const newBeneficiary = await Beneficiary.create(beneficiary);
        console.log("New Beneficiary", newBeneficiary);
  
        const selectedDay = Number(menu.val);
        const date = new Date();
        const nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, selectedDay);
  
        const policy = await Policy.findOne({
          where: {
            user_id: user_id,
          },
        });
        console.log("Policy", policy);
  
        if (policy) {
          policy.policy_deduction_day = selectedDay;
          policy.policy_next_deduction_date = nextDeduction;
          await policy.save();
        }
  
        menu.con('Confirm \n' +
          ` Deduct UGX ${policy.premium}, Next deduction will be on ${nextDeduction} \n` +
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
            const { user_id, partner_id } = await getUser(args.phoneNumber);
            let countryCode = 'UGA'
            let currencyCode = 'UGX';
            const policy = {
                policy_type: 'bronze',
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

            let beneficiary = {
                beneficiary_id: uuidv4(),
                full_name: spouse,
                relationship: 'spouse',
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
    //         const { user_id , partner_id} = await getUser(args.phoneNumber);


    //         //update beneficiary national id
    //         let beneficiary = await Beneficiary.findOne({
    //             where: {
    //                 user_id: user_id
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
            const { user_id } = await getUser(args.phoneNumber);

            //create beneficiary
            let beneficiary = {
                beneficiary_id: uuidv4(),
                full_name: child1,
                relationship: 'child1',
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
            let child2 = menu.val;
            //save child2 name to db users collection
            const { user_id } = await getUser(args.phoneNumber);
            let premium = 40000
            //create beneficiary
            let beneficiary = {
                beneficiary_id: uuidv4(),
                full_name: child2,
                relationship: 'child2',
                user_id: user_id
            }

            let newBeneficiary = await Beneficiary.create(beneficiary);

            menu.con(`Pay UGX ${premium}  deducted monthly.
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
            let premium = 40000;

            menu.con(`Pay UGX ${premium}  deducted monthly.
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


    //===============CONFIRMATION=================
    menu.state('confirmation', {
        run: async () => {
            try {
                const user = await getUser(args.phoneNumber);
                const userId = user.user_id;

                const { policy_id, policy_deduction_amount, policy_deduction_day, policy_type } = await Policy.findOne({
                    where: {
                        user_id: userId
                    }
                });

                console.log("POLICY ID", policy_id);

                const uuid = uuidv4();
                const partnerId = user.partner_id;
                const phoneNumber = user.phone_number;
                const reference = user.membership_id

                const paymentStatus = await airtelMoney(userId, partnerId, policy_id, phoneNumber, policy_deduction_amount, reference);

                if (paymentStatus.code === 200) {
                    menu.end(`Congratulations! You are now covered.
                        To stay covered, UGX ${policy_deduction_amount} will be deducted on day ${policy_deduction_day} of every month.`);
                } else {
                    menu.end(`Sorry, your payment was not successful.
                        \n0. Back \n00. Main Menu`);
                }
            } catch (error) {
                console.error('Confirmation Error:', error);
                menu.end('An error occurred. Please try again later.');
            }
        }
    });

}