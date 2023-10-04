
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

    

    menu.state('buyForSelf', {
        run: async () => {

            const user = await findUserByPhoneNumber(args.phoneNumber);
            const policy = await findPaidPolicyByUser(user);

            if (policy) {
                menu.end(`You already have an ${policy.policy_type.toUpperCase()} ACTIVE policy`);
                return;
            }
            menu.con('Buy for self ' +
                '\n1. Mini  – UGX 10,000' +
                '\n2. Midi– UGX 14,000' +
                '\n3. Biggie – UGX 18,000' +
                '\n0.Back' +
                '\n00.Main Menu'
            )

        },
        next: {
            '*\\d+': 'buyForSelf.coverType',

            '0': 'account',
            '00': 'insurance',
        }
    });
    menu.state('buyForSelf.coverType', {
        run: async () => {
            let coverType = menu.val;

            const { user_id, phone_number, first_name, last_name, partner_id } = await findUserByPhoneNumber(args.phoneNumber);
            const date = new Date();
            const day = date.getDate();
            let sum_insured: any, premium: any, yearly_premium: any;
            if (coverType == 1) {
                coverType = 'MINI';
                sum_insured = "1.5M"
                premium = "10,000"
                yearly_premium = "120,000"

            } else if (coverType == 2) {
                coverType = 'MIDI';
                sum_insured = "3M"
                premium = "14,000"
                yearly_premium = "167,000"
            } else if (coverType == 3) {
                coverType = 'BIGGIE';
                sum_insured = "5M"
                premium = "18,000"
                yearly_premium = "208,000"
            }

            await Policy.create({
                user_id: user_id,
                policy_id: uuidv4(),
                policy_type: coverType,
                beneficiary: 'SELF',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                policy_deduction_day: day * 1,
                partner_id: partner_id,
                country_code: "UGA",
                currency_code: "UGX",
                product_id: 'd18424d6-5316-4e12-9826-302b866a380c',

            })


            menu.con(`Inpatient cover for ${phone_number}, ${first_name}, ${last_name} UGX ${sum_insured} a year 
                    PAY
                    1. UGX ${premium} payable monthly
                    2. UGX ${yearly_premium}  yearly
                    
                    0. Back 00. Main Menu`);
        },
        next: {
            '*\\d+': 'buyForSelf.paymentOption',
            '0': 'account',
            '00': 'insurance'
        }
    });

    menu.state('buyForSelf.paymentOption', {
        run: async () => {
            const paymentOption = menu.val
            const { user_id } = await findUserByPhoneNumber(args.phoneNumber)
            const { policy_type } = await findPolicyByUser(user_id)
            let sum_insured: number, premium: number = 0, period: string, installment_type:number


            if(policy_type == 'MINI'){
                period = 'yearly'
                installment_type = 1;
                sum_insured = 1500000;
                premium = 120000;
                if(paymentOption == 1){
                    period = 'monthly'
                    premium = 10000;
                    installment_type = 2;
                }

            }else if(policy_type == 'MIDI'){
                period = 'yearly'
                installment_type = 1;
                sum_insured = 3000000
                premium = 167000
                if(paymentOption == 1){
                    period = 'monthly'
                    premium = 14000;
                    installment_type = 2;

                }
               
            }
            else if(policy_type == 'BIGGIE'){
                period = 'yearly'
                installment_type = 1;
                sum_insured = 5000000;
                premium = 208000;
                
                if(paymentOption == 1){
                    period = 'monthly'
                    premium = 18000;
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
            '*\\d+': 'buyForSelf.confirm',
            '0': 'account',
            '00': 'insurance'
        }
    });


    menu.state('buyForSelf.confirm', {
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
                    menu.end('Sorry, you have no policy to buy for self');
                }
               let sum_insured: number, premium: number = 0, installment_type: number = 0, period: string = 'monthly'
               if(policy_type == 'MINI'){
                    period = 'yearly'
                    installment_type = 1;
                    sum_insured = 1500000;
                    premium = 120000;
                    if(paymentOption == 1){
                        period = 'monthly'
                        premium = 10000;
                        installment_type = 2;
                    }

                }else if(policy_type == 'MIDI'){
                    period = 'yearly'
                    installment_type = 1;
                    sum_insured = 3000000;
                    premium = 167000;
                   
                    if(paymentOption == 1){
                        period = 'monthly'
                        premium = 14000;
                    installment_type = 2;

                    }
                }
                else if(policy_type == 'BIGGIE'){
                    period = 'yearly'
                    installment_type = 1;
                    sum_insured = 5000000;
                    premium = 208000;
                    if(paymentOption == 1){
                        period = 'monthly'
                        premium = 18000;
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