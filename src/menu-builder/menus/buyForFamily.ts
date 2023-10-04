import { airtelMoney } from '../../services/payment';
import { v4 as uuidv4 } from 'uuid';

export function buyForFamily(menu: any, args: any, db: any): void {

    const Policy = db.policies;
    const Beneficiary = db.beneficiaries;
    const User = db.users;

    if (args.phoneNumber.charAt(0) == "+") {
        args.phoneNumber = args.phoneNumber.substring(1);
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

const findPolicyByUser = async (user_id: any) => {
    return await Policy.findOne({
        where: {
            user_id: user_id,
        },
    });
}

    //============  BUY FOR FAMILY ===================

     menu.state('buyForFamily', {
        run: async () => {
            const user = await findUserByPhoneNumber(args.phoneNumber);
            const policy = await findPaidPolicyByUser(user);

            if (policy) {
                menu.end(`You already have an ${policy.policy_type.toUpperCase()} ACTIVE policy`);
                return;
            }

            menu.con('Buy for family ' +
                '\n1. M+1' +
                '\n2. M+2' +
                '\n3. M+3' +
                '\n4. M+4' +
                '\n5. M+5' +
                '\n6. M+6' +
                '\n0.Back' +
                 '\n00.Main Menu'
            )

        },
        next: {
            '*\\d+': 'buyForFamily.selfSpouseCover',


        }
    });


    menu.state('buyForFamily.selfSpouseCover', {
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
            '*\\d+': 'buyForFamily.selfSpouseCoverType',
            '0': 'account',
            '00': 'insurance'
        }
    });
    

    menu.state('buyForFamily.selfSpouseCoverType', {
        run: async () => {
         let coverType = menu.val;
            console.log("COVER TYPE", coverType)
         let { user_id, partner_id } = await findUserByPhoneNumber(args.phoneNumber);
            let date = new Date();
            let day = date.getDate();

            if(coverType == 1){
                coverType = 'MINI';
            }else if(coverType == 2){
                coverType = 'MIDI';
            }else if(coverType == 3){
                coverType = 'BIGGIE';
            }

         await Policy.create({
            user_id: user_id,
            policy_id: uuidv4(),
            policy_type:  coverType,
            beneficiary:  'FAMILY',
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

            menu.con('\nEnter Name of Spouse ' +
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
        run: async() => {
            let spouse = menu.val;
            console.log("SPOUSE NAME", spouse)

            let { user_id, } = await findUserByPhoneNumber(args.phoneNumber);
           
            let beneficiary = {
                beneficiary_id: uuidv4(),
                full_name: spouse,
                first_name:  spouse.split(" ")[0],
                middle_name: spouse.split(" ")[1],
                last_name:  spouse.split(" ")[2] ||  spouse.split(" ")[1],
                relationship: 'SPOUSE',
                member_number: "M+1",
                user_id: user_id
            }

            let newBeneficiary = await Beneficiary.create(beneficiary);
            console.log("new beneficiary selfSpouse", newBeneficiary)
            menu.con('\nEnter ID of Spouse ' +
                    '\n0.Back' +
                    '\n00.Main Menu'
            )
        },
        next: {
            '*\\d+': 'buyForFamily.selfSpouseId',
            '0': 'buyForFamily',
            '00': 'insurance'
        }
    });


   



    //buyForFamily.selfSpouse.spouse
    menu.state('buyForFamily.selfSpouseId', {
        run: async () => {
            const spouseId = menu.val;
            console.log("SPOUSE ID", spouseId)
            const { user_id, partner_id, phone_number, first_name, last_name } = await findUserByPhoneNumber(args.phoneNumber);
            await Beneficiary.update({ national_id: spouseId }, { where: { user_id: user_id, member_number: "M+1" } });

            const {policy_type } = await findPolicyByUser(user_id);
              let sum_insured: string, premium: number = 0, yearly_premium: number = 0;

                    if(policy_type == 'MINI'){
                        sum_insured = "1.5M"
                        premium = 20000;
                        yearly_premium = 240000;

                    }else if(policy_type == 'MIDI'){
                        sum_insured = "3M"
                        premium = 28000;
                        yearly_premium = 336000;
                    }
                    else if(policy_type == 'BIGGIE'){
                        sum_insured = "5M"
                        premium = 35000;
                        yearly_premium = 420000;
                    }


            menu.con(`Inpatient Family cover for ${phone_number} ${first_name} ${last_name} UGX ${sum_insured} each a year
                  PAY
                  1-UGX ${premium} payable monthly
                  2-UGX ${yearly_premium} yearly
                  0.Back
                  00.Main Menu`);
            
        },
        next: {
            '*\\d+': 'buyForFamilyPin',
            '0': 'buyForFamily',
            '00': 'insurance'
        }

    });


    menu.state('buyForFamilyPin', {
        run: async () => {
            const paymentOption = Number(menu.val);
            console.log("PAYMENT OPTION", paymentOption)

            const { user_id } = await findUserByPhoneNumber(args.phoneNumber);

            const {policy_type, policy_id} = await findPolicyByUser(user_id);

            console.log("POLICY TYPE", policy_type)

            if(policy_id == null){
                menu.end('Sorry, you have no policy to buy for family');
            }
           let sum_insured: number, premium: number = 0, installment_type: number = 0, period: string = 'monthly'
            if(policy_type == 'MINI'){
                period = 'yearly'
                installment_type = 1;
                sum_insured = 1500000;
                premium = 240000;
                if(paymentOption == 1){
                    period = 'monthly'
                    premium = 20000;
                    installment_type = 2;
                }

            }else if(policy_type == 'MIDI'){
                period = 'yearly'
                installment_type = 1;
                sum_insured = 3000000;
                premium = 336000;
                if(paymentOption == 1){
                    period = 'monthly'
                    premium = 28000;
                installment_type = 2;

                }
               
            }
            else if(policy_type == 'BIGGIE'){
                period = 'yearly'
                installment_type = 1;
                sum_insured = 5000000;
                premium = 420000;
                
                if(paymentOption == 1){
                    period = 'monthly'
                    premium = 35000;
                installment_type = 2;

                }
            }

            menu.con(`Pay UGX ${premium} payable ${period}.
                    Terms&Conditions - www.airtel.com
                    Enter PIN to Agree and Pay 
                    n0.Back
                    00.Main Menu`
            )
        },
        next: {
            '*\\d+': 'family.confirmation',
            '0': 'buyForFamily',
            '00': 'insurance'

        }
    });


    //buyForFamily.selfSpouse.pay.yearly
    menu.state('family.confirmation', {
        run: async () => {
            try {

                const userPin = Number(menu.val)
                console.log("USER PIN", userPin)
                const selected = args.text;
                console.log("SELECTED TEXT", selected)

                const input = selected.trim();
                const digits = input.split("*").map((digit) => parseInt(digit, 10));
      
                let paymentOption = Number(digits[digits.length - 2]);
                console.log("PAYMENT OPTION", paymentOption)

                const { user_id, phone_number, partner_id, membership_id, pin} = await findUserByPhoneNumber(args.phoneNumber);

                if( userPin != pin && userPin != membership_id ){
                    menu.end('Invalid PIN');
                }

                const {policy_type, policy_id} = await findPolicyByUser(user_id);

                if(policy_id == null){
                    menu.end('Sorry, you have no policy to buy for family');
                }
               let sum_insured: number, premium: number = 0, installment_type: number = 0, period: string = 'monthly'
               if(policy_type == 'MINI'){
                    period = 'yearly'
                    installment_type = 1;
                    sum_insured = 1500000;
                    premium = 240000;
                    if(paymentOption == 1){
                        period = 'monthly'
                        premium = 20000;
                        installment_type = 2;
                    }

                }else if(policy_type == 'MIDI'){
                    period = 'yearly'
                    installment_type = 1;
                    sum_insured = 3000000;
                    premium = 336000;
                   
                    if(paymentOption == 1){
                        period = 'monthly'
                        premium = 28000;
                    installment_type = 2;

                    }
                }
                else if(policy_type == 'BIGGIE'){
                    period = 'yearly'
                    installment_type = 1;
                    sum_insured = 5000000;
                    premium = 420000;
                    if(paymentOption == 1){
                        period = 'monthly'
                        premium = 35000;
                    installment_type = 2;

                    }
                    
                }

                await Policy.update({ 
                     policy_deduction_amount: premium,
                     policy_pending_premium: premium,
                     sum_insured: sum_insured,
                     premium: premium,
                     installment_type: installment_type,
                     installment_order: 1,
                    }, { where: { user_id: user_id } });

    
  
                    let paymentStatus = await airtelMoney(user_id, partner_id, policy_id, phone_number, premium, membership_id, "UG", "UGX");
                    //let paymentStatus =  await initiateConsent(newPolicy.policy_type,newPolicy.policy_start_date, newPolicy.policy_end_date, phone_number, newPolicy.policy_deduction_amount , newPolicy.premium)
  
                   console.log("PAYMENT STATUS", paymentStatus)
                    if (paymentStatus.code === 200) {
                        menu.end(`Congratulations! You are now covered. 
                        To stay covered, UGX ${premium} will be payable every ${period}`);
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