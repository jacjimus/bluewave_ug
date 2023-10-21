import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/db';
import dotenv from 'dotenv';
import { ConfigurationServicePlaceholders } from 'aws-sdk/lib/config_service_placeholders';
dotenv.config();

const User = db.users;
const Transaction = db.transactions;

let AIRTEL_AUTH_TOKEN_URL='https://openapi.airtel.africa/auth/oauth2/token'  
//process.env.ENVIROMENT=='PROD' ? process.env.PROD_AIRTEL_PAYMENT_TOKEN_URL : process.env.AIRTEL_PAYMENT_TOKEN_URL;
async function getAuthToken(currency: string) {
  // console.log("PAYMENT TOKEN ", process.env.AIRTEL_UGX_CLIENT_ID, process.env.AIRTEL_UGX_CLIENT_SECRET)
  // console.log('AIRTEL PAYMENT TOKEN URL', AIRTEL_PAYMENT_TOKEN_URL)
  // console.log('TOKEN COUNTRY CURRENCY', currency);
  try {
    let response: any;
    if (currency == "KES") {
      response = await axios.post(AIRTEL_AUTH_TOKEN_URL
        ,
        {
          client_id: process.env.AIRTEL_KEN_CLIENT_ID,
          client_secret: process.env.AIRTEL_KEN_CLIENT_SECRET,
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
    }
  
    response = await axios.post( AIRTEL_AUTH_TOKEN_URL

      ,
      {


        client_id: 'f42013ed-a169-4b69-a7fb-960e56e80911',
        client_secret:'845908cd-8f22-463a-bb2b-8a5243b6efbe',
        //process.env.ENVIROMENT == 'PROD' ? process.env.PROD_AIRTEL_UGX_CLIENT_ID : process.env.AIRTEL_UGX_CLIENT_ID,
        // process.env.ENVIROMENT == 'PROD' ? process.env.PROD_AIRTEL_UGX_CLIENT_SECRET : process.env.AIRTEL_UGX_CLIENT_SECRET,
        grant_type: 'client_credentials',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('====================== AUTH TOKEN RESPONSE =================', response.data);
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

async function createTransaction(user_id: any, partner_id: any, policy_id: any, transactionId: any, amount: any) {
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
    //console.log('NEW TRANSACTION', transaction);

    if (transaction) {
      return true
    }
  } catch (error) {
    throw new Error(`Failed to create a transaction: ${error.message}`);
  }
}


// =========== AIRTEL MONEY ===========

async function airtelMoney(user_id: any, partner_id: number, policy_id: any, phoneNumber: any, amount: number, reference: any, country: any, currency: any) {
  const status = {
    code: 200,
    result: "",
    message: 'Payment successfully initiated'
  };

  try {
    const token = await getAuthToken(currency);
    console.log('AIRTEL MONEY TOKEN ' + country, token);
    // const PAYMENT_URL = process.env.ENVIROMENT == 'PROD' ? process.env.PROD_AIRTEL_PAYMENT_URL : process.env.AIRTEL_PAYMENT_URL;
    // console.log('PAYMENT URL ', PAYMENT_URL)

    const paymentData = {
      reference: reference,
      subscriber: {
        country: country,
        currency: currency,
        msisdn: phoneNumber,
      },
      transaction: {
        amount: amount,
        country: country,
        currency: currency,
        id: uuidv4(),
      },
    };

    console.log('PAYMENT DATA ' + country, paymentData);
    const authBearer = currency == "KES" ? token : `Bearer ${token}`;
    console.log('AUTH BEARER ', authBearer);

    const headers = {
      'Content-Type': 'application/json',
      Accept: '/',
      'X-Country': country,
      'X-Currency': currency,
      Authorization: authBearer,
    };

    console.log('HEADERS ' + country, headers);

   const AIRTEL_PAYMENT_URL='https://openapi.airtel.africa/merchant/v1/payments/'
    const response = await axios.post(AIRTEL_PAYMENT_URL, paymentData, { headers });
    console.log('RESPONCE AIRTEL MONEY ' , response.data);
    console.log('RESPONCE AIRTEL MONEY API ' , AIRTEL_PAYMENT_URL);

    if (response.data.status.code == '200') {
      const transaction = response.data.data.transaction;
      await createTransaction(user_id, partner_id, policy_id, transaction.id, amount);

      status.result = response.data.status
      return status;
    } else {
      status.code = 500;
      status.message = 'Sorry, Transaction failed';
      return status;
    }
  } catch (error) {
    console.error('ERROR:', error);
    status.code = 500;
    status.result = error;
    status.message = 'Sorry, Transaction failed';
    return status;
  }
}

async function initiateConsent(product: any, start_date: any, end_date: any, phoneNumber: any, amount: any, premium: any, country: any, currency: any) {
  console.log('PRODUCT', product, 'START DATE', start_date, 'END DATE', end_date, 'PHONE NUMBER', phoneNumber, 'AMOUNT', amount, 'PREMIUM', premium);
  const status = {
    code: 200,
    result: "",
    message: 'Payment successfully initiated'
  };
  const token = await getAuthToken(currency);
  const apiUrl = `https://openapiuat.airtel.africa/pc/${product}/v1/consent`;
  const authToken = `Bearer ${token}`;

  const headers = {
    'Authorization': authToken,
    'x-country': country,
    'x-currency': currency,
    'Content-Type': 'application/json',
  };

  const requestBody = {
    payer: {
      msisdn: phoneNumber || '685466727',
      wallet_types: ['NORMAL', 'BIZ'],
    },
    txn: {
      amount: amount || '1000',
      total_amount: premium || '12000',
      total_number_of_payments: '12',
      start_date: start_date || '2023-04-30',
      end_date: end_date || '2024-04-31',
      frequency: 'MONTHLY',
    },
  };

  try {
    const response = await axios.post(apiUrl, requestBody, { headers });
    console.log('Response:', response.data);
    // Handle the response data here
    if (response.data.status.code === '200') {
      const consentDetails = response.data.status;
      console.log('CONSENT DETAILS', consentDetails);
      status.result = consentDetails;
      return status;
    }
  } catch (error) {
    console.error('Error:', error.message);
    // Handle any errors here
  }
}

// Call the function to initiate the consent
//initiateConsent('product');

async function getConsentDetails(consentId: any, product: any, country: any, currency: any) {
  const token = await getAuthToken(currency);
  const apiUrl = `https://openapiuat.airtel.africa/pc/${product}/v1/consent/${consentId}`;
  const authToken = `Bearer ${token}`;

  const headers = {
    'x-country': country,
    'x-currency': currency,
    'Authorization': authToken,
  };

  try {
    const response = await axios.get(apiUrl, { headers });
    console.log('Response:', response.data);
    return response.data;
    // Handle the response data here
  } catch (error) {
    console.error('Error:', error.message);
    // Handle any errors here
  }
}

// Call the function to get consent details
//getConsentDetails('CON1679991960033');




async function stopConsent(consentId: any, product: any, country: any, currency: any) {
  const token = await getAuthToken(currency);
  const apiUrl = `https://openapiuat.airtel.africa/pc/{product}/v1/consent/${consentId}/stop`;
  const authToken = `Bearer ${token}`;

  const headers = {
    'x-country': country,
    'x-currency': currency,
    'Authorization': authToken,
    'Content-Type': 'application/json',
  };

  try {
    const response = await axios.post(apiUrl, {}, { headers });
    console.log('Response:', response.data);
    // Handle the response data here
  } catch (error) {
    console.error('Error:', error.message);
    // Handle any errors here
  }
}

// Call the function to stop the consent with the desired consent ID
//stopConsent('CON1679916462568');


async function makePeriodicPayment(consentNumber: any, transactionId: any, amount: any, product: any, country: any, currency: any) {
  const token = await getAuthToken(currency);
  const apiUrl = `https://openapiuat.airtel.africa/pc/${product}/v1/payment`;
  const authToken = `Bearer ${token}`;

  const headers = {
    'x-country': country,
    'x-currency': currency,
    'Authorization': authToken,
    'Content-Type': 'application/json',
  };

  const requestBody = {
    consent_number: consentNumber,
    payer: {
      wallet_type: 'NORMAL',
    },
    transaction: {
      id: transactionId,
      amount: amount.toString(),
    },
  };

  try {
    const response = await axios.post(apiUrl, requestBody, { headers });
    console.log('Response:', response.data);
    // Handle the response data here
  } catch (error) {
    console.error('Error:', error.message);
    // Handle any errors here
  }
}

// Call the function to make a periodic payment with the desired parameters
//makePeriodicPayment('CON1679991960033', 'RAKESH-pinless-155', 1000);


async function transactionEnquiry(transactionId: any, product: any, country: any, currency: any) {
  const token = await getAuthToken(currency);
  const apiUrl = `https://openapiuat.airtel.africa/pc/${product}/v1/payment/${transactionId}`;
  const authToken = `Bearer ${token}`;

  const headers = {
    'x-country': country,
    'x-currency': currency,
    'Authorization': authToken,
  };

  try {
    const response = await axios.get(apiUrl, { headers });
    console.log('Response:', response.data);
    // Handle the response data here
  } catch (error) {
    console.error('Error:', error.message);
    // Handle any errors here
  }
}

// Call the function to perform a transaction enquiry with the desired transaction ID
//transactionEnquiry('RAKESH-pinless-8');

async function initiateRefund(transactionId: any, product: any, country: any, currency: any) {
  const token = await getAuthToken(currency);
  const apiUrl = `https://openapiuat.airtel.africa/pc/${product}/v1/refund`;
  const authToken = `Bearer ${token}`;

  const headers = {
    'x-country': country,
    'x-currency': currency,
    'Authorization': authToken,
    'Content-Type': 'application/json',
  };

  const requestData = {
    transaction: {
      id: transactionId,
    },
  };

  try {
    const response = await axios.post(apiUrl, requestData, { headers });
    console.log('Response:', response.data);
    // Handle the response data here
  } catch (error) {
    console.error('Error:', error.message);
    // Handle any errors here
  }
}

// Call the function to initiate a refund for the specified transaction ID
//initiateRefund('RAKESH-pinless-8');

async function sendCallbackToPartner() {
  const partnerCallbackUrl = 'https://partner_domain/callback_path';

  const headers = {
    'Content-Type': 'application/json',
  };

  const callbackData = {
    transaction: {
      id: 'BBZMiscxy',
      message: 'Paid UGX 5,000 to TECHNOLOGIES LIMITED Charge UGX 140, Trans ID MP210603.1234.L06941.',
      status_code: 'TS',
      airtel_money_id: 'MP210603.1234.L06941',
    },
  };

  try {
    const response = await axios.post(partnerCallbackUrl, callbackData, { headers });
    console.log('Callback Response:', response.data);
    // Handle the response data here
  } catch (error) {
    console.error('Error sending callback:', error.message);
    // Handle any errors here
  }
}

// Call the function to send the callback to the partner
//sendCallbackToPartner();


async function initiateRecoveryPayment(consentNumber: any, transactionId: any, amount: any, country: any, currency: any) {
  const token = await getAuthToken(currency);
  const apiUrl = 'https://openapiuat.airtel.africa/recovery/v1/payment';
  const accessToken = token;

  const headers = {
    'x-country': country,
    'x-currency': currency,
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  const requestData = {
    consent_number: consentNumber || 'CON1679991960033',
    payer: {
      wallet_type: 'NORMAL',
    },
    transaction: {
      id: transactionId || 'RAKESH-pinless-recovery-6',
      amount: amount.toString() || '3000',
    },
  };

  try {
    const response = await axios.post(apiUrl, requestData, { headers });
    console.log('Recovery Payment Response:', response.data);
    // Handle the response data here
  } catch (error) {
    console.error('Error making Recovery Payment:', error.message);
    // Handle any errors here
  }
}

// Call the function to initiate the recovery payment
//initiateRecoveryPayment();

async function inquireRecoveryTransaction(transactionId: any, country: any, currency: any) {
  const token = await getAuthToken(currency);
  const apiUrl = `https://openapiuat.airtel.africa/recovery/v1/payment/${transactionId}`;
  const accessToken = token;

  const headers = {
    'x-country': country,
    'x-currency': currency,
    'Authorization': `Bearer ${accessToken}`,
  };

  try {
    const response = await axios.get(apiUrl, { headers });
    console.log('Recovery Transaction Inquiry Response:', response.data);
    // Handle the response data here
  } catch (error) {
    console.error('Error inquiring about Recovery Transaction:', error.message);
    // Handle any errors here
  }
}

// Call the function to inquire about the recovery transaction
//inquireRecoveryTransaction();

async function refundRecoveryTransaction(transactionId: any, country: any, currency: any) {
  const token = await getAuthToken(currency);
  const apiUrl = 'https://openapiuat.airtel.africa/recovery/v1/refund';
  const accessToken = token;

  const headers = {
    'x-country': country,
    'x-currency': currency,
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  const requestData = {
    transaction: {
      id: transactionId || 'RAKESH-pinless-8',
    },
  };

  try {
    const response = await axios.post(apiUrl, requestData, { headers });
    console.log('Recovery Transaction Refund Response:', response.data);
    // Handle the response data here
  } catch (error) {
    console.error('Error refunding Recovery Transaction:', error.message);
    // Handle any errors here
  }
}

// Call the function to refund the recovery transaction
//refundRecoveryTransaction();



export {
  airtelMoney,
  initiateConsent,
  getConsentDetails,
  stopConsent,
  makePeriodicPayment,
  transactionEnquiry,
  initiateRefund,
  sendCallbackToPartner,
  initiateRecoveryPayment,
  inquireRecoveryTransaction,
  refundRecoveryTransaction
};
