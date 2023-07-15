
import airtelMoney from '../../services/payment';
import { v4 as uuidv4 } from 'uuid';
export function payNow(menu:any, args:any, db:any):void{

    const User = db.users;
    const Policy = db.policies;
        //==================PAY NOW===================

        menu.state('payNow', {
            run: async () => {

               let user = await User.findOne({
                    where: {
                        phone_number: args.phoneNumber

                    }
                    
                })

                const {policy_deduction_amount} = await Policy.findOne({
                    where: {
                        user_id: user.id
                    }
                })

            

                menu.con(`Your outstanding premium is Kes ${policy_deduction_amount} 

                        1. Enter PIN to Pay Now
                        0.Back
                        00.Main Menu`
                )
            },

            next: {
                '*\\d+': 'payNowPin',
                '0': 'account',
                '00': 'insurance',
            }

        })


        menu.state('payNowPin', {
            run: async () => {

                let pin = menu.val

                let user = await User.findOne({
                    where: {
                        phone_number: args.phoneNumber
                    }
                })

                console.log("USER pin: ", user)                 
                let {id, policy_type, policy_deduction_amount,  policy_deduction_day } = await Policy.findOne({
                    where: {
                        user_id: user.id
                    }
                })
             

                let nextMonth = new Date()
                nextMonth.setMonth(nextMonth.getMonth() + 1).toLocaleString()

                // check if pin is correct
                if (user.pin == pin) {

                    const phoneNumber = args.phoneNumber;
                    const amount = policy_deduction_amount;
                    const reference = policy_type + id;
                    const user_id = user.id;
                    const uuid = uuidv4();
                  

                    // const payment: any = await airtelMoney(user_id, phoneNumber, amount, reference, uuid)
                    const payment: any = 200
                    if (payment == 200) {
                        //Paid Kes 5,000 for Medical cover. Your next payment will be due on day # of [NEXT MONTH]
                        menu.end(`Paid Kes ${amount} for Medical cover. 
                    Your next payment will be due on day ${policy_deduction_day} of ${nextMonth}`)
                    } else {
                        menu.end('Payment failed. Please try again')
                    }

                } else {
                    menu.end('Incorrect PIN. Please try again')
                }


            }
        })

}