import sendSMS from "../../services/sendSMS";

export function displayAccount(menu:any, args:any, db:any):void {

    const User = db.users;
    const Policy = db.policies;
    const Claim = db.claims;
    menu.state('account', {
        run: () => {

            menu.con('Medical cover ' +
                '\n1. Buy for self' +
                '\n2. Buy (family)' +
                '\n3. Buy (others)' +
                '\n4. Admission Claim' +
                '\n5. My Account' +
                '\n6. Choose Hopital' +
                '\n7. Terms & Conditions' +
                '\n8. FAQs' +
                '\n0.Back' +
                '\n00.Main Menu'
            )
        },
        next: {
            '1': 'buyForSelf',
            '2': 'buyForFamily',
            '3': 'buyForOthers',
            '4': 'makeClaim',
            '5': 'myAccount',
            '6': 'chooseHospital',
            '7': 'termsAndConditions',
            '8': 'faqs',
        }
    });

    //buyForOthers

    //ask for phone number and name of person to buy for
    menu.state('buyForOthers', {
        run: async () => {

            menu.con('Enter full name or phone number of person to buy for');
        },
        next: {
            '*[a-zA-Z]+': 'buyForOthersOptions',
        }
    });

    menu.state('buyForOthersOptions', {
        run: async () => {
            let name = menu.val;
            console.log("NAME: ", name)
            let  user = await User.findOne({
                where: {
                    phone_number: args.phoneNumber
                }
            })
            console.log("USER: ", user)
            //update user name
            user.name = name;
            user.save().then((user:any) => {
                
                console.log("USER: ", user)
                }).catch((err:any) => {
                    console.log("ERR: ", err)
                    });
            console.log("USER: ", user)

            menu.con('Buy for others ' +

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


      //==================MAKE CLAIM===================
      menu.state('makeClaim', {
        run: async () => {

            //send sms
            const { phoneNumber: to } = args;

            const messages = [
                `Your medicals details have been confirmed. You are covered for hospital cash of kes 4,500 per night payable from the second night`,
                `An amount of kes100,000 has been paid by AAR towards your hospital bill.: Your cover balanceis Kes 200,000`
            ];

            for (const message of messages) {
                try {
                    const response = await sendSMS(to, message);
                    console.log(response);
                } catch (error) {
                    console.error(error);
                }
            }

            //get user
            try {
                const user = await User.findOne({
                    where: {
                        phone_number: args.phoneNumber,
                    },
                });
                console.log("USER claim:", user);
                if (user.id) {
                    const policy = await Policy.findOne({
                        where: {
                            user_id: user.id,
                        },
                    });
                    console.log("POLICY:", policy);
                    if (policy.id) {
                        const claim = await Claim.create({
                            policy_id: policy.policy_id,
                            user_id: user.id,
                            claim_date: new Date(),
                            claim_status: "pending",
                        });
                        console.log("CLAIM:", claim);
                        menu.con(
                            "Admission Claim\nProceed to the reception to verify your details\n0. Back\n00. Main Menu"
                        );
                    } else {
                        menu.con("Your policy is INACTIVE\n0. Buy cover");
                    }
                } else {
                    menu.end("User not found");
                }
            } catch (err) {
                console.log("err:", err);
            }

        },
        next: {
            '0': 'account',
            '00': 'insurance',
        }
    })

    
}