import {db} from '../models/db';
import moment from 'moment';
import {Sequelize, Op} from 'sequelize';


  export const getNewPolicies = async (partner_id: number, start_date: string, end_date: string) => {
    try {
        
    

        const newPolicies = await db.policies.findAll({
          attributes: [
            [Sequelize.fn('DATE', Sequelize.col('policy_start_date')), 'policy_start_date'],
            [Sequelize.fn('COUNT', '*'), 'new_policies']
          ],
          where: {
            policy_status: 'paid',
            partner_id: partner_id,
            policy_start_date: {
              [Op.between]: [start_date, end_date]
            }
          },
          group: ['policy_start_date'],
          order: ['policy_start_date']
        })
        
        
        console.log(newPolicies);
        return newPolicies;
      
    } catch (error) {
      console.log(error);
    }
  }

export const numberAndValueOfFailedPayments = async (partner_id: number, start_date: string, end_date: string) => {

    try {

        const failedPayments = await db.payments.findAll({
            attributes: [
              [Sequelize.fn('DATE', Sequelize.col('payment_date')), 'payment_date'],
              [Sequelize.fn('COUNT', '*'), 'failed_payments'],
              [Sequelize.fn('SUM', Sequelize.col('payment_amount')), 'value_of_failed_payments'],
              'payment_status',
              ['payment_description', 'failure_reason']
            ],
            where: {
              payment_status: ['failed', 'declined', 'error'],
              payment_date: {
                [Op.between]: ['2023-01-01', '2024-02-07']
              },
              partner_id: 2
            },
            group: ['payment_date', 'payment_status', 'payment_description'],
            order: ['payment_date', 'payment_status']
          })
          .then(results => {
            console.log(results);
          })
          .catch(error => {
            console.error(error);
          });
    
        console.log("failedPayments",failedPayments);
        return failedPayments;
    
    } catch (error) {
        console.log(error.message);
    }
    }



  /* create list of function to get analytics data */

