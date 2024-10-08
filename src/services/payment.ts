7import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/db';
import dotenv from 'dotenv';
import { findTransactionById, updateUserPolicyStatus } from '../routes/ussdRoutes';
import SMSMessenger from './sendSMS';
import authTokenByPartner from './authorization';
import { logger } from '../middleware/loggingMiddleware';
import moment from 'moment';

dotenv.config();

const Transaction = db.transactions;


const createTransaction = async (user_id: any, partner_id: number, policy_id: any, transactionId: string, amount: any) => {
  try {
    return await Transaction.create({
      transaction_id: uuidv4(),
      amount,
      status: 'pending',
      user_id,
      transaction_reference: transactionId,
      policy_id,
      partner_id,
    });
  } catch (error) {
    logger.error('Failed to create a transaction:', error.message);
    throw new Error(`Failed to create a transaction: ${error.message}`);
  }
};

async function airtelMoney(phoneNumber: string, amount: any, reference: any, preGeneratedTransactionId: string) {

  const status = {
    code: 200,
    message: process.env.IS_UAT === '1' ?  'UAT Payment successfully initiated' : 'Payment successfully initiated',
  };

  try {

    const partnerId = 2;

    const token = await authTokenByPartner(partnerId);
    const paymentData = {
      reference,
      subscriber: {
        country: 'UG',
        currency: 'UGX',
        msisdn: phoneNumber,
      },
      transaction: {
        amount,
        country: 'UG',
        currency: 'UGX',
        id: preGeneratedTransactionId,
      },
    };

    const headers = {
      'Content-Type': 'application/json',
      Accept: '/',
      'X-Country': 'UG',
      'X-Currency': 'UGX',
      Authorization: `Bearer ${token}`,
    };

    const AIRTEL_PAYMENT_URL = process.env.IS_UAT === '1' ?
        process.env.UAT_KEN_AIRTEL_PAYMENT_URL :
        process.env.PROD_AIRTEL_PAYMENT_URL;

    const paymentResponse = await axios.post(AIRTEL_PAYMENT_URL, paymentData, { headers });
    console.log(paymentResponse)
    if (paymentResponse.data.status.success !== true) {
      status.code = 500;
      status.message = 'Payment failed'; // Update message only on failure
    } else {
    }
    return status;
  } catch (error) {
    logger.error('Failed to initiate payment:', error.message);
    handlePaymentError(error, status);
    return status;
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function handlePaymentError(error, status) {
  if (error.response) {
    const responseData = error.response.data;

    if (responseData && responseData.message) {
      status.code = 500;
      status.result = responseData.message;
      status.message = 'Sorry, Transaction failed';
    } else {
      logger.error('No message found in the error response.');
    }
  } else {
    logger.error('No response found in the error.');
  }
}



async function airtelMoneyKenya(existingUser, policy) {
  const status = {
    code: 200,
    status: "OK",
    result: "",
    message: 'Payment successfully initiated'
  };

  try {
    const token = await authTokenByPartner(1);

    const paymentData = {
      reference: existingUser.phone_number,
      subscriber: {
        country: "KE",
        currency: "KES",
        msisdn: existingUser.phone_number,
      },
      transaction: {
        amount: process.env.IS_UAT === '0' ? policy.premium : 1,
        country: "KE",
        currency: "KES",
        id: policy.policy_id,
      },
    };

    const headers = {
      'Accept': '*/* ',
      'Content-Type': 'application/json',
      'X-Country': 'KE',
      'X-Currency': 'KES',
      'Authorization': `Bearer ${token}`
    };

    console.log("PAYMENT DATA", paymentData, process.env.UAT_KEN_AIRTEL_PAYMENT_URL, "HEADERS", headers)

    const paymentResponse = await axios.post(process.env.UAT_KEN_AIRTEL_PAYMENT_URL, paymentData,
      { headers });
    console.log("res status", paymentResponse.data.status);
    if (paymentResponse.data.status.success == true) {
      status.result = paymentResponse.data.status;
      await createTransaction(existingUser.user_id, 1, policy.policy_id, paymentData.transaction.id, policy.premium,);
      return status;
    }
    status.code = 500;
    status.message = 'Payment failed';
    return status;
  } catch (error) {
    console.log("ERROR", error)
    logger.error('Failed to initiate payment:', error.message);
    handlePaymentError(error, status);

  }
}



async function initiateConsent(product: any, start_date: any, end_date: any, phoneNumber: any, amount: any, premium: any, country: any, currency: any) {
  console.log('PRODUCT', product, 'START DATE', start_date, 'END DATE', end_date, 'PHONE NUMBER', phoneNumber, 'AMOUNT', amount, 'PREMIUM', premium);
  const status = {
    code: 200,
    status: "OK",
    result: "",
    message: 'Payment successfully initiated'
  };
  const token = await authTokenByPartner(2);
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
  const token = await authTokenByPartner(2);
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
  const token = await authTokenByPartner(2);
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
  const token = await authTokenByPartner(2);
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
  const token = await authTokenByPartner(2);
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
  const token = await authTokenByPartner(2);
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
  const token = await authTokenByPartner(2);
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
  const token = await authTokenByPartner(2);
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
  const token = await authTokenByPartner(2);
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

  const { id, status_code, message, airtel_money_id, payment_date } = transaction;

  console.log("TRANSACTION", transaction)

  const transactionData = await findTransactionById(id);

  if (!transactionData) {
    return {
      code: 404,
      status: "NOT FOUND",
      message: "Transaction not found"
    }
  }

  const { policy_id, user_id, amount, partner_id } = transactionData;

  if (status_code !== "TS") {
    return {
      code: 500,
      status: "FAILED",
      message: "Payment failed"
    }
  }

  await transactionData.update({
    status: "paid",
  });

  const user = await db.users.findOne({ where: { user_id } });

  if (!user) {

    return {
      code: 404,
      status: "NOT FOUND",
      message: "User not found " + user_id

    }
  }
  let policy = await db.policies.findOne({
    where: {
      policy_id,
    }
  });


  if (!policy) {

    await db.payments.create({
      payment_amount: amount,
      payment_type: "airtel money payment",
      user_id,
      policy_id,
      payment_status: "failed",
      payment_description: message,
      payment_date: payment_date === undefined ? moment().toDate() : payment_date,
      payment_metadata: transaction,
      partner_id: partner_id,
    });
    return {
      code: 404,
      status: "NOT FOUND",
      message: "Policy not found " + policy_id
    }

  }

  const to = user.phone_number?.startsWith("7") ? `+256${user.phone_number}` : user.phone_number?.startsWith("0") ? `+256${user.phone_number.substring(1)}` : user.phone_number?.startsWith("+") ? user.phone_number : `+256${user.phone_number}`;
  const policyType = policy.policy_type.toUpperCase();
  const period = policy.installment_type == 1 ? "yearly" : "monthly";
  policy.policy_number = `BW${to?.replace('+', '')?.substring(3)}`;

  const payment = await db.payments.create({
    payment_amount: amount,
    payment_type: "airtel money stk push for " + policyType + " " + period + " payment",
    user_id,
    policy_id,
    payment_status: "paid",
    payment_description: message,
    payment_date: payment_date,
    payment_metadata: transaction,
    airtel_transaction_id: airtel_money_id,
    partner_id,
  });


  let updatePolicy = await db.policies.update({
    policy_status: "paid",
    airtel_money_id: airtel_money_id,
    policy_paid_date: payment_date,
    bluewave_transaction_id: payment.payment_id,
    airtel_transaction_ids: policy.airtel_transaction_ids ? [...policy.airtel_transaction_ids, policy.airtel_money_id] : [policy.airtel_money_id],
    premium: amount,
    is_expired: false,
  }, { where: { policy_id: policy_id } });

  console.log("UPDATE POLICY", updatePolicy);



  let updatedPolicyInstallement = await updateUserPolicyStatus(policy, parseInt(amount), airtel_money_id);


  // send congratulatory message
  await sendCongratulatoryMessage(updatedPolicyInstallement, user);

  //const memberStatus = await fetchMemberStatusData({ member_no: user.arr_member_number, unique_profile_id: user.membership_id + "" });

  //await processPolicy(user, policy, memberStatus);

  return {
    code: 200,
    status: "OK",
    message: "Payment record created successfully",
    policy: updatedPolicyInstallement,
    payment: payment
  }

}


async function sendCongratulatoryMessage(policy, user) {
  try {

    const members = policy.total_member_number?.match(/\d+(\.\d+)?/g);
    console.log("MEMBERS", members, policy.total_member_number);

    //let proratedPercentage = calculateProrationPercentage(policy.installment_order);

    const sumInsured = policy.sum_insured
    //formatAmount(policy.sum_insured * (proratedPercentage / 100));
    const lastExpenseInsured = policy.last_expense_insured
    //formatAmount(policy.last_expense_insured * (proratedPercentage / 100));
    console.log("SUM INSURED", sumInsured);
    console.log("LAST EXPENSE INSURED", lastExpenseInsured);


    const thisDayThisMonth = policy.installment_type === 2 ? new Date(moment().toDate().getFullYear(), moment().toDate().getMonth() + 1, moment().toDate().getDate() - 1) : new Date(moment().toDate().getFullYear() + 1, moment().toDate().getMonth(), moment().toDate().getDate() - 1);

    let congratText = "";

    if (policy.beneficiary == "FAMILY") {
      congratText = `Congratulations! You and ${members} dependent are each covered for Inpatient benefit of UGX ${sumInsured} and Funeral benefit of UGX ${lastExpenseInsured}. Cover valid till ${thisDayThisMonth.toDateString()}`
    } else if (policy.beneficiary == "SELF")
      congratText = `Congratulations! You are covered for Inpatient benefit of UGX ${sumInsured} and Funeral benefit of UGX ${lastExpenseInsured}. Cover valid till ${thisDayThisMonth.toDateString()}`;
    else if (policy.beneficiary == "OTHER") {
      congratText = `${user.first_name} has bought for you Ddwaliro Care for Inpatient ${sumInsured} and Funeral benefit of ${lastExpenseInsured}. Dial *185*7*6# on Airtel to enter next of kin & view more details`
    }
    console.log("CONGRATULATORY TEXT", congratText);

    let to = policy.phone_number;

    await SMSMessenger.sendSMS(2, to, congratText);

  } catch (error) {
    logger.error('Failed to send congratulatory message:', error.message);
  }
}

async function processPayment(policyObject: any, phoneNumber: string, existingOther: { phone_number: { toString: () => any; }; }) {
  try {
    const preGeneratedTransactionId = uuidv4(); // Generate UUID once outside
    let policy = await db.policies.create(policyObject);
    let response =

    setTimeout(async () => {


      const airtelMoneyPromise = await airtelMoney(
        phoneNumber.replace("+", "").substring(3),
        policy.premium,
        existingOther.phone_number.toString(),
        preGeneratedTransactionId
      );

      const timeout = parseInt(process.env.AIRTEL_MONEY_TIMEOUT) || 2000;

      Promise.race([
        airtelMoneyPromise,
        new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error('Airtel Money operation timed out'));
          }, timeout);
        })
      ]).then((result) => {
        // Airtel Money operation completed successfully
        console.log("============== END TIME - SELF ================ ", phoneNumber, moment().toDate());
        //response = 'END Payment successful';
        console.log("SELF RESPONSE WAS CALLED", result);
        return response;
      }).catch((error) => {
        // Airtel Money operation failed
        //response = 'END Payment failed';
        console.log("SELF RESPONSE WAS CALLED", error);
        return response;
      });

      console.log("============== AFTER CATCH TIME - SELF ================ ", phoneNumber, moment().toDate());
    }, 500);
    // Airtel Money operation completed successfully
    console.log("PAYMENT - RESPONSE WAS CALLED", response);
    return response
  } catch (error) {
    logger.error('Failed to process payment:', error.message);

    // return 'END Payment failed';
  }
}


async function pingAirtel() {
  try {
    const response = await axios.get('https://openapi.airtel.africa');
    console.log('PING RESPONSE', response.data);
  } catch (error) {
    logger.error('PING ERROR', error.message);
    console.error('PING ERROR', error.message);
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
  reconcilationCallback,
  sendCongratulatoryMessage,
  createTransaction,
  processPayment,
  pingAirtel
};
