import { airtelMoney } from '../../services/payment';
import { v4 as uuidv4 } from 'uuid';
import sendSMS from "../../services/sendSMS";

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

            // if (policy) {
            //     menu.end(`You already have an ${policy.policy_type.toUpperCase()} ACTIVE policy`);
            //     return;
            // }


            menu.con('Buy for family ' +
                '\n1. Self +Spouse or Child' +
                '\n2. Self + Spouse + 1 Child' +
                '\n3. Self + Spouse + 2 Children' +
                '\n01. Next' +
                '\n0.Back' +
                 '\n00.Main Menu'
            )

        },
        next: {
            '1': 'buyForFamily.selfSpouseCover',
            '2': 'buyForFamily.selfSpouseCover',
            '3': 'buyForFamily.selfSpouseCover',
            '0': 'account',
            '00': 'insurance',
            "01": "buyForFamily.next"


        }
    });

    menu.state('buyForFamily.next', {
        run: async () => {
            const user = await findUserByPhoneNumber(args.phoneNumber);
            const policy = await findPaidPolicyByUser(user);

            // if (policy) {
            //     menu.end(`You already have an ${policy.policy_type.toUpperCase()} ACTIVE policy`);
            //     return;
            // }


            menu.con('Buy for family ' +
                '\n4. Self + Spouse + 3 Child' +
                '\n5. Self + Spouse + 4 Child' +
                '\n6. Self + Spouse + 5 Children' +
                '\n0.Back' +
                 '\n00.Main Menu'
            )

        },
        next: {
            '4': 'buyForFamily.selfSpouseCover',
            '5': 'buyForFamily.selfSpouseCover',
            '6': 'buyForFamily.selfSpouseCover',


        }
    });

    menu.state('buyForFamily.selfSpouseCover', {
        run: async () => {
            let member_number = menu.val;
            console.log("MEMBER NUMBER", member_number)
             if(member_number == 1){
                member_number = 'M+1';
            }else if(member_number == 2){
                member_number = 'M+2';
            }else if(member_number == 3){
                member_number = 'M+3';
            }
            else if(member_number == 4){
                member_number = 'M+4';
            }
            else if(member_number == 5){
                member_number = 'M+5';
            }else if(member_number == 6){
                member_number = 'M+6';
            }else{
                menu.end('Invalid option');
            }
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

            menu.con('\nEnter atleast Name of spouse or 1 child' +
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

            let { user_id, total_member_number } = await findUserByPhoneNumber(args.phoneNumber);
           
            let beneficiary = {
                beneficiary_id: uuidv4(),
                full_name: spouse,
                first_name:  spouse.split(" ")[0],
                middle_name: spouse.split(" ")[1],
                last_name:  spouse.split(" ")[2] ||  spouse.split(" ")[1],
                relationship: 'SPOUSEORCHILD-1',
                member_number: total_member_number,
                user_id: user_id
            }

           
            let newBeneficiary = await Beneficiary.create(beneficiary);
            console.log("new beneficiary selfSpouse", newBeneficiary)
            menu.con('\nEnter Phone of spouse (or Main member, if dependent is child' +
                    '\n0.Back' +
                    '\n00.Main Menu'
            )
        },
        next: {
            '*\\d+': 'buyForFamily.selfSpousePhoneNumber',
            '0': 'buyForFamily',
            '00': 'insurance'
        }
    });


   



    //buyForFamily.selfSpouse.spouse
    menu.state('buyForFamily.selfSpousePhoneNumber', {
        run: async () => {
            const spousePhone = menu.val;
            console.log("SPOUSE Phone", spousePhone)
            const { user_id, partner_id, phone_number, first_name, last_name } = await findUserByPhoneNumber(args.phoneNumber);
            await Beneficiary.update({  phone_number: spousePhone  }, { where: { user_id: user_id, relationship: 'SPOUSEORCHILD-1'} });

            const {policy_type } = await findPolicyByUser(user_id);
              let sum_insured: string, premium: number = 0, yearly_premium: number = 0, last_expense_insured: number = 0;

                    if(policy_type == 'MINI'){
                        sum_insured = "1.5M"
                        premium = 20000;
                        yearly_premium = 240000;
                        last_expense_insured = 1000000;

                    }else if(policy_type == 'MIDI'){
                        sum_insured = "3M"
                        premium = 28000;
                        yearly_premium = 336000;
                        last_expense_insured = 1500000;
                    }
                    else if(policy_type == 'BIGGIE'){
                        sum_insured = "5M"
                        premium = 35000;
                        yearly_premium = 420000;
                        last_expense_insured = 2000000;
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
           let sum_insured: number, premium: number = 0, installment_type: number = 0, period: string = 'monthly', last_expense_insured: number = 0
            if(policy_type == 'MINI'){
                period = 'yearly'
                installment_type = 1;
                sum_insured = 1500000;
                premium = 240000;
                last_expense_insured = 1000000;

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
                last_expense_insured = 1500000;
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
                last_expense_insured = 2000000;
                
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

                const {policy_type, policy_id, policy_end_date} = await findPolicyByUser(user_id);

                if(policy_id == null){
                    menu.end('Sorry, you have no policy to buy for family');
                }
               let sum_insured: number, premium: number = 0, installment_type: number = 0, period: string = 'monthly', last_expense_insured: number = 0, si: string = '', lei: string
               if(policy_type == 'MINI'){
                    period = 'yearly'
                    installment_type = 1;
                    sum_insured = 1500000;
                    si = '1.5M'
                    premium = 240000;
                    last_expense_insured = 1000000;
                    lei = '1M'
                    if(paymentOption == 1){
                        period = 'monthly'
                        premium = 20000;
                        installment_type = 2;
                       
                        
                    }

                }else if(policy_type == 'MIDI'){
                    period = 'yearly'
                    installment_type = 1;
                    sum_insured = 3000000;
                    si = '3M'
                    premium = 336000;
                    last_expense_insured = 1500000;
                    lei = '1.5M'
                   
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
                    si = '5M'
                    premium = 420000;
                    last_expense_insured = 2000000;
                    lei = '2M'
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
                        last_expense_insured: last_expense_insured
                    }, { where: { user_id: user_id } });

    
  
                    let paymentStatus = await airtelMoney(user_id, partner_id, policy_id, phone_number, premium, membership_id, "UG", "UGX");
                    //let paymentStatus =  await initiateConsent(newPolicy.policy_type,newPolicy.policy_start_date, newPolicy.policy_end_date, phone_number, newPolicy.policy_deduction_amount , newPolicy.premium)
                 let congratSms=`Congratulations! You and 1 dependent are each covered for Inpatient benefit of UGX ${si} and Funeral benefit of UGX ${lei}.
                             Cover valid till ${policy_end_date.toDateString()}.  `

                   console.log("PAYMENT STATUS", paymentStatus)
                    if (paymentStatus.code === 200) {
                        await sendSMS(phone_number, congratSms);
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