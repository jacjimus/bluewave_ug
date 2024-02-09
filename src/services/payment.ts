import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/db';
import dotenv from 'dotenv';
import { findTransactionById, updateUserPolicyStatus } from '../routes/ussdRoutes';
import { calculateProrationPercentage, formatAmount } from './utils';
import SMSMessenger from './sendSMS';
import { fetchMemberStatusData, processPolicy } from './aar';
dotenv.config();

const User = db.users;
const Transaction = db.transactions;

async function getAuthToken() {
  try {
    let response: any;

    response = await axios.post(process.env.PROD_AIRTEL_AUTH_TOKEN_URL,
      {

        client_id: process.env.PROD_AIRTEL_UGX_CLIENT_ID,
        client_secret: process.env.PROD_AIRTEL_UGX_CLIENT_SECRET,
        grant_type: 'client_credentials',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    //console.log('====================== AUTH TOKEN RESPONSE =================', response.data);
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



async function getAuthKenyaToken() {
  try {
    let response: any;


    let KENYA_AIRTEL_AUTH_TOKEN_URL = 'https://openapiuat.airtel.africa/auth/oauth2/token'
    let KENYA_AIRTEL_UGX_CLIENT_ID = '1d625007-fb96-4b08-bd07-d7316629922e'
    let KENYA_AIRTEL_UGX_CLIENT_SECRET = '76b8a757-583e-4436-a767-b3b370c775ee'

    response = await axios.post(KENYA_AIRTEL_AUTH_TOKEN_URL,
      {

        client_id: KENYA_AIRTEL_UGX_CLIENT_ID,
        client_secret: KENYA_AIRTEL_UGX_CLIENT_SECRET,
        grant_type: 'client_credentials',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    //console.log('====================== AUTH TOKEN RESPONSE =================', response.data);
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
    //console.log('TRANSACTION ID', transactionId, 'AMOUNT', amount, 'USER ID', user_id, 'POLICY ID', policy_id, 'PARTNER ID', partner_id);
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

    return transaction;

  } catch (error) {
    throw new Error(`Failed to create a transaction: ${error.message}`);
  }
}



async function airtelMoney(user_id, partner_id, policy_id, phoneNumber, amount, reference, country, currency) {
  const status = {
    code: 200,
    result: "",
    message: 'Payment successfully initiated'
  };

  try {
    const token = await getAuthToken();

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
        id: uuidv4()
      },
    };

    console.log("=========== paymentData AIRTEL MONEY  ===========", paymentData)

    const headers = {
      'Content-Type': 'application/json',
      Accept: '/',
      'X-Country': country,
      'X-Currency': currency,
      Authorization: `Bearer ${token}`,
    };

    const AIRTEL_PAYMENT_URL = 'https://openapi.airtel.africa/merchant/v1/payments/';

    // Parallelize the Airtel Money payment request and transaction creation

    //let paymentResponse;
    new Promise((resolve, reject) => {
      setTimeout(async () => {
        console.log("=========== PUSH INSIDE TO AIRTEL MONEY  ===========", phoneNumber, new Date())
        resolve(await axios.post(AIRTEL_PAYMENT_URL, paymentData, { headers }))

      }, 3000)

    }).then((paymentResponse: any) => {
      console.log("=========== PUSH INSIDE TO AIRTEL MONEY  ===========", phoneNumber, new Date())
      status.result = paymentResponse.data.status;
      console.log(status.result)
      console.log("=========== RETURN RESPONSE AIRTEL MONEY ===========", phoneNumber, new Date())
      createTransaction(user_id, partner_id, policy_id, paymentData.transaction.id, amount);
      return status;
    }).catch((error) => {
      console.log("=========== PUSH INSIDE TO AIRTEL MONEY  ===========", phoneNumber, new Date())
      status.code = 500;
      status.result = error;
      status.message = 'Sorry, Transaction failed';
      return status;
    }
    );

  } catch (error) {
    console.error('ERROR:', error);
    status.code = 500;
    status.result = error;
    status.message = 'Sorry, Payment Transaction failed';
    return status;
  }
}


async function airtelMoneyKenya(user_id, policy_id, phoneNumber, amount, reference,) {
  const status = {
    code: 200,
    result: "",
    message: 'Payment successfully initiated'
  };

  try {
    const token = await getAuthKenyaToken();

    const paymentData = {
      reference: reference,
      subscriber: {
        country: "KE",
        currency: "KES",
        msisdn: phoneNumber,
      },
      transaction: {
        amount: amount,
        country: "KE",
        currency: "KES",
        id: policy_id
      },
    };

    const headers = {
      'Content-Type': 'application/json',
      Accept: '/',
      'X-Country': "KE",
      'X-Currency': "KES",
      Authorization: `${token}`,
    };

    const KENYA_AIRTEL_PAYMENT_URL = 'https://openapiuat.airtel.africa/merchant/v1/payments/';

    // Parallelize the Airtel Money payment request and transaction creation

    //let paymentResponse;
    new Promise((resolve, reject) => {
      setTimeout(async () => {
        console.log("=========== PUSH INSIDE TO AIRTEL MONEY  ===========", phoneNumber, new Date())
        resolve(await axios.post(KENYA_AIRTEL_PAYMENT_URL, paymentData, { headers }))

      }, 3000)

    }).then((paymentResponse: any) => {
      console.log("=========== PUSH INSIDE TO AIRTEL MONEY  ===========", phoneNumber, new Date())
      status.result = paymentResponse.data.status;
      console.log("=========== RETURN RESPONSE AIRTEL MONEY ===========", phoneNumber, new Date())
      createTransaction(user_id, 1, policy_id, paymentData.transaction.id, amount);
      return status;
    }).catch((error) => {
      console.log("=========== PUSH INSIDE TO AIRTEL MONEY  ===========", phoneNumber, new Date())
      status.code = 500;
      status.result = error;
      status.message = 'Sorry, Transaction failed';
      return status;
    }
    );


  } catch (error) {
    console.error('ERROR:', error);
    status.code = 500;
    status.result = error;
    status.message = 'Sorry, Payment Transaction failed';
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
  const token = await getAuthToken();
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
  const token = await getAuthToken();
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
  const token = await getAuthToken();
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
  const token = await getAuthToken();
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
  const token = await getAuthToken();
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
  const token = await getAuthToken();
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
  const token = await getAuthToken();
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
  const token = await getAuthToken();
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
  const token = await getAuthToken();
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

async function reconcilationCallback(transaction) {

  const { id, status_code, message, airtel_money_id } = transaction;

  const transactionData = await findTransactionById(id);

  if (!transactionData) {
    throw new Error("Transaction not found");
  }



  const { policy_id, user_id, amount, partner_id } = transactionData;

  if (status_code == "TS") {

    await transactionData.update({
      status: "paid",
    });

    const user = await db.users.findOne({ where: { user_id } });

    let policy = await db.policies.findOne({
      where:
      {
        policy_id,
        user_id,
      }
    });

    if (!policy || !policy) {

      throw new Error("Policy not found");

    }

    policy.airtel_money_id = airtel_money_id;

    const to = user.phone_number?.startsWith("7") ? `+256${user.phone_number}` : user.phone_number?.startsWith("0") ? `+256${user.phone_number.substring(1)}` : user.phone_number?.startsWith("+") ? user.phone_number : `+256${user.phone_number}`;
    const policyType = policy.policy_type.toUpperCase();
    const period = policy.installment_type == 1 ? "yearly" : "monthly";


    const payment = await db.payments.create({
      payment_amount: amount,
      payment_type: "airtel money stk push for " + policyType + " " + period + " payment",
      user_id,
      policy_id,
      payment_status: "paid",
      payment_description: message,
      payment_date: new Date(),
      payment_metadata: transaction,
      partner_id,
    });

    console.log("Payment record created successfully");

    let updatedPolicy = await updateUserPolicyStatus(policy, parseInt(amount), payment, airtel_money_id);


    console.log("=== PAYMENT ===", payment)
    console.log("=== UPDATED POLICY ===", updatedPolicy)


    const members = policy.total_member_number?.match(/\d+(\.\d+)?/g);
    console.log("MEMBERS", members, policy.total_member_number);

    //let proratedPercentage = calculateProrationPercentage(policy.installment_order);

    const sumInsured = policy.sum_insured
    //formatAmount(policy.sum_insured * (proratedPercentage / 100));
    const lastExpenseInsured = policy.last_expense_insured
    //formatAmount(policy.last_expense_insured * (proratedPercentage / 100));
    console.log("SUM INSURED", sumInsured);
    console.log("LAST EXPENSE INSURED", lastExpenseInsured);


    const thisDayThisMonth = policy.installment_type === 2 ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate() - 1) : new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1);

    let congratText = "";

    if (policy.beneficiary == "FAMILY") {
      congratText = `Congratulations! You and ${members} dependent are each covered for Inpatient benefit of UGX ${sumInsured} and Funeral benefit of UGX ${lastExpenseInsured}. Cover valid till ${thisDayThisMonth.toDateString()}`
    } else if (policy.beneficiary == "SELF")
      congratText = `Congratulations! You are covered for Inpatient benefit of UGX ${sumInsured} and Funeral benefit of UGX ${lastExpenseInsured}. Cover valid till ${thisDayThisMonth.toDateString()}`;
    else if (policy.beneficiary == "OTHER") {
      congratText = `${user.first_name} has bought for you Ddwaliro Care for Inpatient ${sumInsured} and Funeral benefit of ${lastExpenseInsured}. Dial *185*7*6# on Airtel to enter next of kin & view more details`
    }
    console.log("CONGRATULATORY TEXT", congratText);

    //await SMSMessenger.sendSMS(2,to, congratText);

    const memberStatus = await fetchMemberStatusData({ member_no: user.arr_member_number, unique_profile_id: user.membership_id + "" });

    await processPolicy(user, policy, memberStatus);

    return {
      code: 200,
      message: "Payment record created successfully"
    }
  } else {
    await db.payments.create({
      payment_amount: amount,
      payment_type: "airtel money payment",
      user_id,
      policy_id,
      payment_status: "failed",
      payment_description: message,
      payment_date: new Date(),
      payment_metadata: transaction,
      partner_id: partner_id,
    });

    // failed policy
   // await db.policies.update({ policy_status: "unpaid", airtel_money_id: airtel_money_id }, { where: { policy_id } });


    return {
      code: 500,
      message: "Payment record created successfully"
    }
  }
}

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
  refundRecoveryTransaction,
  airtelMoneyKenya,
  reconcilationCallback
};
