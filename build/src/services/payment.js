"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refundRecoveryTransaction = exports.inquireRecoveryTransaction = exports.initiateRecoveryPayment = exports.sendCallbackToPartner = exports.initiateRefund = exports.transactionEnquiry = exports.makePeriodicPayment = exports.stopConsent = exports.getConsentDetails = exports.initiateConsent = exports.airtelMoney = void 0;
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const db_1 = require("../models/db");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const User = db_1.db.users;
const Transaction = db_1.db.transactions;
let AIRTEL_AUTH_TOKEN_URL = 'https://openapi.airtel.africa/auth/oauth2/token';
function getAuthToken() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let response;
            response = yield axios_1.default.post(AIRTEL_AUTH_TOKEN_URL, {
                client_id: process.env.PROD_AIRTEL_UGX_CLIENT_ID,
                client_secret: process.env.PROD_AIRTEL_UGX_CLIENT_SECRET,
                grant_type: 'client_credentials',
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            //console.log('====================== AUTH TOKEN RESPONSE =================', response.data);
            if (response.status === 200) {
                const { access_token } = response.data;
                return access_token;
            }
            else {
                throw new Error(`Failed to get authentication token: ${response.statusText}`);
            }
        }
        catch (error) {
            throw new Error(`An error occurred while getting the authentication token: ${error.message}`);
        }
    });
}
function createTransaction(user_id, partner_id, policy_id, transactionId, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //console.log('TRANSACTION ID', transactionId, 'AMOUNT', amount, 'USER ID', user_id, 'POLICY ID', policy_id, 'PARTNER ID', partner_id);
            const transaction = yield Transaction.create({
                transaction_id: (0, uuid_1.v4)(),
                amount: amount,
                status: 'pending',
                user_id: user_id,
                transaction_reference: transactionId,
                policy_id: policy_id,
                partner_id: partner_id,
            });
            //console.log('NEW TRANSACTION', transaction);
            return transaction;
        }
        catch (error) {
            throw new Error(`Failed to create a transaction: ${error.message}`);
        }
    });
}
// =========== AIRTEL MONEY ===========
function airtelMoney(user_id, partner_id, policy_id, phoneNumber, amount, reference, country, currency) {
    return __awaiter(this, void 0, void 0, function* () {
        const status = {
            code: 200,
            result: "",
            message: 'Payment successfully initiated'
        };
        try {
            console.log("=========== PUSH TO AIRTEL MONEY ===========", phoneNumber, new Date());
            const token = yield getAuthToken();
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
                    id: policy_id
                },
            };
            const headers = {
                'Content-Type': 'application/json',
                Accept: '/',
                'X-Country': country,
                'X-Currency': currency,
                Authorization: `Bearer ${token}`,
            };
            const AIRTEL_PAYMENT_URL = 'https://openapi.airtel.africa/merchant/v1/payments/';
            // Parallelize the Airtel Money payment request and transaction creation
            const [paymentResponse] = yield Promise.all([
                axios_1.default.post(AIRTEL_PAYMENT_URL, paymentData, { headers })
            ]);
            status.result = paymentResponse.data.status;
            console.log("=========== RETURN RESPONSE AIRTEL MONEY ===========", phoneNumber, new Date());
            // Create the transaction record
            yield createTransaction(user_id, partner_id, policy_id, paymentData.transaction.id, amount);
            return status;
        }
        catch (error) {
            console.error('ERROR:', error);
            status.code = 500;
            status.result = error;
            status.message = 'Sorry, Transaction failed';
            return status;
        }
    });
}
exports.airtelMoney = airtelMoney;
function initiateConsent(product, start_date, end_date, phoneNumber, amount, premium, country, currency) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('PRODUCT', product, 'START DATE', start_date, 'END DATE', end_date, 'PHONE NUMBER', phoneNumber, 'AMOUNT', amount, 'PREMIUM', premium);
        const status = {
            code: 200,
            result: "",
            message: 'Payment successfully initiated'
        };
        const token = yield getAuthToken();
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
            const response = yield axios_1.default.post(apiUrl, requestBody, { headers });
            console.log('Response:', response.data);
            // Handle the response data here
            if (response.data.status.code === '200') {
                const consentDetails = response.data.status;
                console.log('CONSENT DETAILS', consentDetails);
                status.result = consentDetails;
                return status;
            }
        }
        catch (error) {
            console.error('Error:', error.message);
            // Handle any errors here
        }
    });
}
exports.initiateConsent = initiateConsent;
// Call the function to initiate the consent
//initiateConsent('product');
function getConsentDetails(consentId, product, country, currency) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = yield getAuthToken();
        const apiUrl = `https://openapiuat.airtel.africa/pc/${product}/v1/consent/${consentId}`;
        const authToken = `Bearer ${token}`;
        const headers = {
            'x-country': country,
            'x-currency': currency,
            'Authorization': authToken,
        };
        try {
            const response = yield axios_1.default.get(apiUrl, { headers });
            console.log('Response:', response.data);
            return response.data;
            // Handle the response data here
        }
        catch (error) {
            console.error('Error:', error.message);
            // Handle any errors here
        }
    });
}
exports.getConsentDetails = getConsentDetails;
// Call the function to get consent details
//getConsentDetails('CON1679991960033');
function stopConsent(consentId, product, country, currency) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = yield getAuthToken();
        const apiUrl = `https://openapiuat.airtel.africa/pc/{product}/v1/consent/${consentId}/stop`;
        const authToken = `Bearer ${token}`;
        const headers = {
            'x-country': country,
            'x-currency': currency,
            'Authorization': authToken,
            'Content-Type': 'application/json',
        };
        try {
            const response = yield axios_1.default.post(apiUrl, {}, { headers });
            console.log('Response:', response.data);
            // Handle the response data here
        }
        catch (error) {
            console.error('Error:', error.message);
            // Handle any errors here
        }
    });
}
exports.stopConsent = stopConsent;
// Call the function to stop the consent with the desired consent ID
//stopConsent('CON1679916462568');
function makePeriodicPayment(consentNumber, transactionId, amount, product, country, currency) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = yield getAuthToken();
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
            const response = yield axios_1.default.post(apiUrl, requestBody, { headers });
            console.log('Response:', response.data);
            // Handle the response data here
        }
        catch (error) {
            console.error('Error:', error.message);
            // Handle any errors here
        }
    });
}
exports.makePeriodicPayment = makePeriodicPayment;
// Call the function to make a periodic payment with the desired parameters
//makePeriodicPayment('CON1679991960033', 'RAKESH-pinless-155', 1000);
function transactionEnquiry(transactionId, product, country, currency) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = yield getAuthToken();
        const apiUrl = `https://openapiuat.airtel.africa/pc/${product}/v1/payment/${transactionId}`;
        const authToken = `Bearer ${token}`;
        const headers = {
            'x-country': country,
            'x-currency': currency,
            'Authorization': authToken,
        };
        try {
            const response = yield axios_1.default.get(apiUrl, { headers });
            console.log('Response:', response.data);
            // Handle the response data here
        }
        catch (error) {
            console.error('Error:', error.message);
            // Handle any errors here
        }
    });
}
exports.transactionEnquiry = transactionEnquiry;
// Call the function to perform a transaction enquiry with the desired transaction ID
//transactionEnquiry('RAKESH-pinless-8');
function initiateRefund(transactionId, product, country, currency) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = yield getAuthToken();
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
            const response = yield axios_1.default.post(apiUrl, requestData, { headers });
            console.log('Response:', response.data);
            // Handle the response data here
        }
        catch (error) {
            console.error('Error:', error.message);
            // Handle any errors here
        }
    });
}
exports.initiateRefund = initiateRefund;
// Call the function to initiate a refund for the specified transaction ID
//initiateRefund('RAKESH-pinless-8');
function sendCallbackToPartner() {
    return __awaiter(this, void 0, void 0, function* () {
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
            const response = yield axios_1.default.post(partnerCallbackUrl, callbackData, { headers });
            console.log('Callback Response:', response.data);
            // Handle the response data here
        }
        catch (error) {
            console.error('Error sending callback:', error.message);
            // Handle any errors here
        }
    });
}
exports.sendCallbackToPartner = sendCallbackToPartner;
// Call the function to send the callback to the partner
//sendCallbackToPartner();
function initiateRecoveryPayment(consentNumber, transactionId, amount, country, currency) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = yield getAuthToken();
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
            const response = yield axios_1.default.post(apiUrl, requestData, { headers });
            console.log('Recovery Payment Response:', response.data);
            // Handle the response data here
        }
        catch (error) {
            console.error('Error making Recovery Payment:', error.message);
            // Handle any errors here
        }
    });
}
exports.initiateRecoveryPayment = initiateRecoveryPayment;
// Call the function to initiate the recovery payment
//initiateRecoveryPayment();
function inquireRecoveryTransaction(transactionId, country, currency) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = yield getAuthToken();
        const apiUrl = `https://openapiuat.airtel.africa/recovery/v1/payment/${transactionId}`;
        const accessToken = token;
        const headers = {
            'x-country': country,
            'x-currency': currency,
            'Authorization': `Bearer ${accessToken}`,
        };
        try {
            const response = yield axios_1.default.get(apiUrl, { headers });
            console.log('Recovery Transaction Inquiry Response:', response.data);
            // Handle the response data here
        }
        catch (error) {
            console.error('Error inquiring about Recovery Transaction:', error.message);
            // Handle any errors here
        }
    });
}
exports.inquireRecoveryTransaction = inquireRecoveryTransaction;
// Call the function to inquire about the recovery transaction
//inquireRecoveryTransaction();
function refundRecoveryTransaction(transactionId, country, currency) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = yield getAuthToken();
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
            const response = yield axios_1.default.post(apiUrl, requestData, { headers });
            console.log('Recovery Transaction Refund Response:', response.data);
            // Handle the response data here
        }
        catch (error) {
            console.error('Error refunding Recovery Transaction:', error.message);
            // Handle any errors here
        }
    });
}
exports.refundRecoveryTransaction = refundRecoveryTransaction;
