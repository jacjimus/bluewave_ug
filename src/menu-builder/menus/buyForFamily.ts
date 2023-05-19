import airtelMoney from '../../services/payment';
import { v4 as uuidv4 } from 'uuid';

export function buyForFamily(menu: any, args:any, db:any): void { 


    const Policy = db.policies;
    const Beneficiary = db.beneficiaries;
    const User = db.users;
    //const Claim = db.claims;
    //const Session = db.sessions;
    //const Transaction = db.transactions;

    if (args.phoneNumber.charAt(0) == "+") {

        args.phoneNumber = args.phoneNumber.substring(1);
    }

    async function getUser( phoneNumber: any) {
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
                        '\n1. Self  – Kes 650' +
                        '\n2. Self + Spouse – Kes 1,040' +
                        '\n3. Self + Spouse + 1 Child -Kes 1,300' +
                        '\n4. Self + Spouse + 2 children – Kes 1,456' +
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

                    //save premium to db users collection


                    menu.con('\nEnter day of the month you want to deduct premium' +
                        '\n0.Back' +
                        '\n00.Main Menu'

                    )
                },
                next: {
                    '*[0-9]+': 'buyForFamily.self.confirm',
                    '0': 'buyForFamily',
                    '00': 'insurance'

                }
            });

            //buy for family self confirm
            menu.state('buyForFamily.self.confirm', {
                run: async () => {
                    // use menu.val to access user input value

                    let day: any = Number(menu.val);
                    let date = new Date();

                    let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, day);
                    //nextDeduction to be formatted to MM/DD/YYYY
                    //update user details in db

                 
                    
                   const { id } = await getUser(args.phoneNumber);
                   console.log("USER ID", id)
                  
                    // policy that is active
                    let activePolicy = await Policy.findOne({
                        where: {
                            user_id: id,
                            policy_status: 'active'
                        }
                    })


                    if (id && !activePolicy) {

                        //save policy details
                        let policy = {

                            policy_type: 'family',
                            beneficiary: 'self',
                            policy_status: 'active',
                            policy_start_date: new Date(),
                            policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                            policy_deduction_day: day * 1,
                            policy_deduction_amount: 650,
                            policy_next_deduction_date: nextDeduction,
                            user_id: id
                        }

                        let newPolicy = await Policy.create(policy);
                        console.log("NEW POLICY FAMILY SELF", newPolicy)


                    } else {

                        menu.con('You already have an active policy. \n' +

                            '\n0.Back ' + ' 00.Main Menu'
                        );
                    }

                    menu.con('Confirm \n' +

                        ` Deduct Kes 1400  on day ${day} each month. Next deduction will be on ${nextDeduction} \n` +
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

                    // use menu.val to access user input value
                    let spouse = menu.val;
                    console.log("SPOUSE NAME 1", spouse)
                    //save spouse name to db users collection
                    const { id } = await getUser(args.phoneNumber);
                   
                                  //update policy details in db

                    //policy end date equals policy start date + 1 year
                    let date = new Date();



                    const policy = {
                        policy_type: 'family',
                        beneficiary: 'selfSpouse',
                        policy_status: 'active',
                        policy_start_date: new Date(),
                        policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), date.getDate()),
                        policy_deduction_amount: 1300,
                        user_id: id
                    }

                    let newPolicy = await Policy.create(policy).catch(err => console.log(err));
                    console.log("NEW POLICY FAMILY SELFSPOUSE", newPolicy)



                    //create beneficiary
                    let beneficiary = {
                        full_name: spouse,
                        relationship: 'spouse',
                        user_id: id
                    }

                    let newBeneficiary = await Beneficiary.create(beneficiary);

                    console.log("new beneficiary 1", newBeneficiary)



                    menu.con('\n Enter Spouse ID' +

                        '\n0.Back' +
                        '\n00.Main Menu'
                    )

                },
                next: {
                    '*\\d+': 'buyForFamily.selfSpouse.spouse.id',
                    '0': 'buyForFamily',
                    '00': 'insurance'

                }
            });
            //buyForFamily.selfSpouse.spouse.id
            menu.state('buyForFamily.selfSpouse.spouse.id', {
                run: async () => {

                    // use menu.val to access user input value
                    let id_number = menu.val;
                    console.log("National id 2", id_number)
                    //save spouse id to db users collection

                    const { id } = await getUser(args.phoneNumber);

                
                    //update beneficiary national id
                    let beneficiary = await Beneficiary.findOne({
                        where: {
                            user_id: id
                        }
                    })
                    console.log("new beneficiary 2", beneficiary)

                    if (beneficiary) {
                        beneficiary.national_id = id_number;
                        beneficiary.save().catch(err => console.log(err));
                    } else {
                        menu.con('No beneficiary found. \n' +

                            '\n0.Back ' + ' 00.Main Menu'
                        );
                    }


                    menu.con('\nEnter day of the month you want to deduct premium' +
                        '\n0.Back' +
                        '\n00.Main Menu'

                    )
                },
                next: {
                    '*[0-9]+': 'buyForFamily.selfSpouse.confirm',
                    '0': 'buyForFamily',
                    '00': 'insurance'

                }
            });

            //buyForFamily.selfSpouse.confirm
            menu.state('buyForFamily.selfSpouse.confirm', {
                run: async () => {

                    const day: any = Number(menu.val);
                    const date = new Date();
                    const nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, day);

                    //update policy details in db
                    const { id } = await getUser(args.phoneNumber);

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
                        ` Deduct Kes 1,040  on day ${day} each month. Next deduction will be on ${nextDeduction} \n` +
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

                    //save policy details to db

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

                    // use menu.val to access user input value
                    let spouse = menu.val;
                    console.log("SPOUSE NAME 1", spouse)
                    //save spouse name to db users collection
                    const { id } = await getUser(args.phoneNumber);
                    //update policy details in db

                    //policy end date equals policy start date + 1 year
                    let date = new Date();



                    const policy = {
                        policy_type: 'family',
                        beneficiary: 'selfSpouse1Child',
                        policy_status: 'active',
                        policy_start_date: new Date(),
                        policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), date.getDate()),
                        policy_deduction_amount: 1300,
                        user_id: id
                    }

                    let newPolicy = await Policy.create(policy).catch(err => console.log(err));
                    console.log("NEW POLICY FAMILY SELFSPOUSE1CHILD", newPolicy)



                    //create beneficiary
                    let beneficiary = {
                        full_name: spouse,
                        relationship: 'spouse',
                        user_id: id
                    }

                    let newBeneficiary = await Beneficiary.create(beneficiary);

                    console.log("new beneficiary 1", newBeneficiary)



                    menu.con('\n Enter Spouse ID' +

                        '\n0.Back' +
                        '\n00.Main Menu'
                    )

                },
                next: {
                    '*\\d+': 'buyForFamily.selfSpouse1Child.spouse.id',
                    '0': 'buyForFamily',
                    '00': 'insurance'

                }
            });



            //buy for family selfSpouse1Child spouse id
            menu.state('buyForFamily.selfSpouse1Child.spouse.id', {
                run: async () => {

                    // use menu.val to access user input value
                    let id_number = menu.val;
                    console.log("National id 2", id_number)
                    //save spouse id to db users collection

                    const { id } = await getUser(args.phoneNumber);

                    //update beneficiary national id
                    let beneficiary = await Beneficiary.findOne({
                        where: {
                            user_id: id
                        }
                    })
                    console.log("new beneficiary 2", beneficiary)

                    if (beneficiary) {
                        beneficiary.national_id = id_number;
                        beneficiary.save().catch(err => console.log(err));
                    } else {
                        menu.con('No beneficiary found. \n' +

                            '\n0.Back ' + ' 00.Main Menu'
                        );
                    }

                    menu.con('\nEnter Child s name' +
                        '\n0.Back' +
                        '\n00.Main Menu'
                    )

                },
                next: {
                    '*[a-zA-Z]+': 'buyForFamily.selfSpouse1Child.child1',
                    '0': 'buyForFamily',
                    '00': 'insurance'
                }
            });


            //buy for family selfSpouse1Child child1
            menu.state('buyForFamily.selfSpouse1Child.child1', {
                run: async () => {

                    // use menu.val to access user input value
                    let child1 = menu.val;
                    console.log("CHILD NAME 3", child1)
                    //save child name to db users collection
                    const { id } = await getUser(args.phoneNumber);

                    //create beneficiary

                    let beneficiary = {
                        full_name: child1,
                        relationship: 'child',
                        user_id: id

                    }


                    let newBeneficiary = await Beneficiary.create(beneficiary);

                    console.log("new beneficiary 3", newBeneficiary)




                    menu.con('\nEnter day of the month you want to deduct premium' +
                        '\n0.Back' +
                        '\n00.Main Menu'

                    )
                },
                next: {
                    '*[0-9]+': 'buyForFamily.selfSpouse1Child.confirm',
                    '0': 'buyForFamily',
                    '00': 'insurance'

                }

            });


            //buy for family selfSpouse1Child confirm
            menu.state('buyForFamily.selfSpouse1Child.confirm', {
                run: async () => {

                    const day: any = Number(menu.val);
                    const date = new Date();
                    const nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, day);

                    const { id } = await getUser(args.phoneNumber);


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
                        ` Deduct Kes 1456  on day ${day} each month. Next deduction will be on ${nextDeduction} \n` +
                        '\n1.Confirm \n' +
                        '\n0.Back ' + ' 00.Main Menu'
                    );

                },
                next: {
                    '1': 'confirmation',
                    '0': 'buyForFamily',
                    '00': 'insurance'
                }

                //save premium to db users collection


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
                    // use menu.val to access user input value
                    let spouse = menu.val;
                    console.log("SPOUSE NAME 1", spouse)
                    //save spouse name to db users collection
                    const { id } = await getUser(args.phoneNumber);


                    const policy = {
                        policy_type: 'family',
                        beneficiary: 'selfSpouse2Child',
                        policy_status: 'active',
                        policy_start_date: new Date(),
                        policy_end_date: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()),
                        policy_deduction_amount: 1456,
                        policy_deduction_day: 1,
                        policy_next_deduction_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),

                        user_id: id
                    }

                    let newPolicy = await Policy.create(policy);
                    console.log("NEW POLICY FAMILY SELFSPOUSE2CHILD", newPolicy)




                    //create beneficiary
                    let beneficiary = {
                        full_name: spouse,
                        relationship: 'spouse',
                        user_id: id
                    }

                    let newBeneficiary = await Beneficiary.create(beneficiary);

                    console.log("new beneficiary 1", newBeneficiary)



                    menu.con('\n Enter Spouse ID' +

                        '\n0.Back' +
                        '\n00.Main Menu'
                    )

                },
                next: {
                    '*\\d+': 'buyForFamily.selfSpouse2Child.spouse.id',
                    '0': 'buyForFamily',
                    '00': 'insurance'

                }
            });


            //buy for family selfSpouse2Child spouse id
            menu.state('buyForFamily.selfSpouse2Child.spouse.id', {
                run: async () => {

                    // use menu.val to access user input value
                    let id_number = menu.val;
                    console.log(" spouse National id 2", id_number)
                    //save spouse id to db users collection
                    const { id } = await getUser(args.phoneNumber);

                    //update beneficiary national id
                    let beneficiary = await Beneficiary.findOne({
                        where: {
                            user_id: id
                        }
                    })
                    console.log("new beneficiary 2", beneficiary)

                    if (beneficiary) {
                        beneficiary.national_id = id_number;
                        beneficiary.save();
                    }
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

                    // use menu.val to access user input value
                    let child2 = menu.val;
                
                    //save child2 name to db users collection
                    const { id } = await getUser(args.phoneNumber);
                    

                    //create beneficiary
                    let beneficiary = {
                        full_name: child2,
                        relationship: 'child2',
                        user_id: id

                    }

                    let newBeneficiary = await Beneficiary.create(beneficiary);


                    menu.con('Pay Kes 1456  deducted monthly.' +
                        '\nTerms&Conditions - www.airtel.com' +
                        '\nEnter PIN to Agree and Pay' +
                        '\n0.Back' +
                        '\n00.Main Menu'
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
                    menu.con('Pay Kes 1456  deducted monthly.' +
                        '\nTerms&Conditions - www.airtel.com' +
                        '\nEnter PIN to Agree and Pay' +
                        '\n0.Back' +
                        '\n00.Main Menu'
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

                    menu.con('Pay Kes 1300  deducted monthly.' +
                        '\nTerms&Conditions - www.airtel.com' +
                        '\nEnter PIN to Agree and Pay' +
                        '\n0.Back' +
                        '\n00.Main Menu'
                    )

                },
                next: {
                    '*\\d+': 'buyForFamilySChedule',
                    '0': 'buyForFamily',
                    '00': 'insurance'

                }
            });


            menu.state('buyForFamilySChedule', {
                run: async () => {
                    // use menu.val to access user input value
                    let user_pin = Number(menu.val);
                    
                    // get user details
                    const { id ,pin} = await getUser(args.phoneNumber);

                    // check if pin is correct
                    if (user_pin == pin) {

                        menu.con('SCHEDULE' +
                            '\n Enter day of month to deduct Kes 1300 premium monthly (e.g. 1, 2, 3…31)' +
                            '\n0.Back' +
                            '\n00.Main Menu'
                        );

                    } else {

                        menu.con('PIN incorrect. Try again');
                    }
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

                    const { id: userId } = await getUser(args.phoneNumber);

                    const {id,policy_status, policy_deduction_amount,policy_deduction_day,policy_type} = await Policy.findOne({
                        where: {
                            user_id: userId
                        }
                    })
                 
                    //BOUGHT Family Medical cover for 07XXXXXXXX [FIRST NAME] [LAST NAME]. Inpatient  cover for 300,000  
                    if (policy_status == 'active') {

                        const phoneNumber = args.phoneNumber;
                      
                        const uuid = uuidv4();
                       
                    
                      
                        const reference = policy_type + id


                        let payment: any = await airtelMoney(userId, phoneNumber, policy_deduction_amount, reference, uuid)

                        if (payment == 200) {

                            menu.end('Congratulations you are now covered. \n' +

                                `To stay covered Kes ${policy_deduction_amount} will be deducted on day ${policy_deduction_day} of every month`

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