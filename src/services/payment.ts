import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/db';

const User = db.users;
const Transaction = db.transactions;

async function getAuthToken() {
  try {
    const response = await axios.post(
      'https://openapiuat.airtel.africa/merchant/v1/payments/oauth2/token',
      {
        client_id: process.env.AIRTEL_CLIENT_ID,
        client_secret: process.env.AIRTEL_CLIENT_SECRET,
        grant_type: 'client_credentials',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200) {
      const { access_token } = response.data;
      return access_token;
    } else {
      throw new Error(`Failed to get authentication token: ${response.statusText}`);
    }
  } catch (error) {
    throw new Error(`An error occurred while getting the authentication token: ${error.message}`);
  }
}

async function createTransaction(user_id: any, partner_id:any, policy_id: any, transactionId: any, amount: any) {
  try {
    console.log('TRANSACTION ID', transactionId, 'AMOUNT', amount, 'USER ID', user_id, 'POLICY ID', policy_id, 'PARTNER ID', partner_id);
    const transaction = await Transaction.create({
      transaction_id: uuidv4(),
      amount: amount,
      status: 'pending',
      user_id: user_id,
      transaction_reference: transactionId,
      policy_id: policy_id,
      partner_id: partner_id,
    });
    console.log('TRANSACTION', transaction);
    return transaction;
  } catch (error) {
    throw new Error(`Failed to create a transaction: ${error.message}`);
  }
}

async function airtelMoney(user_id:any, partner_id: number, policy_id: any, phoneNumber: any, amount: number, reference: any) {
  const status = {
    code: 200,
    result:"",
    message: 'Payment successfully initiated'
  };

  try {
    const token = await getAuthToken();
    const PAYMENT_URL = process.env.AIRTEL_PAYMENT_URL;

    const paymentData = {
      reference: reference,
      subscriber: {
        country: 'UG',
        currency: 'UGX',
        msisdn: phoneNumber,
      },
      transaction: {
        amount: amount,
        country: 'UG',
        currency: 'UGX',
        id: uuidv4(),
      },
    };

    const headers = {
      'Content-Type': 'application/json',
      Accept: '/',
      'X-Country': 'UG',
      'X-Currency': 'UGX',
      Authorization: `Bearer ${token}`,
    };

    const response = await axios.post(PAYMENT_URL, paymentData, { headers });
    console.log('RESPONCE AIRTEL MONEY', response.data);

    if (response.data.status.code == '200') {
      const  transaction = response.data.data.transaction;
      console.log('TRANSACTION', transaction);
      await createTransaction(user_id, partner_id, policy_id, transaction.id, amount);
      status.result=response.data.status
      return status;
    } else {
        status.code = 500;
      throw new Error('Transaction failed');
    }
  } catch (error) {
    console.error('ERROR:', error);
    status.code = 500;
    status.message = 'Sorry, Transaction failed';
    return status;
  }
}

export default airtelMoney;
