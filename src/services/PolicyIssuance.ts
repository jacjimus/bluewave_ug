
const axios = require('axios');

const dotenv = require('dotenv');
dotenv.config();

const POLICY_ISSUANCE_URL = process.env.POLICY_ISSUANCE_URL
const POLICY_ISSUANCE_TOKEN_URL = process.env.POLICY_ISSUANCE_TOKEN_URL

async function aar_token() {
    console.log("policyIssuance  token I WASS CALLED")
    try {
        let token: any;
        const inputBody = {
            "user_Type": "Employee",
            "user_Nm": "Airtel",
            "password": "ASSn1Z1So982xQh4+MVq6w==",
            "iP_Address": "142.1.1.2",
            "application_Source": "Airtel",
            "is_External": false,
            "secret_Key": "2faadbc961478e383ae04eaad1a3ee46"
        }

        const headers = {
            'Content-Type': 'application/json',
            'Accept': '*/*'
        };

        await axios.post(POLICY_ISSUANCE_TOKEN_URL, inputBody, { headers })
            .then((response: any) => {
                token = response.data.responseObj.token.access_Token;
            })
            .catch(error => {
                console.error(error)
                return error;
            })

        return token;

    } catch (error) {
        console.log(error)
        throw new Error(error)

    }
}


async function PolicyIssuance(ClientCreation: any, PolicyCreationRequest: any, MemObj: any, ReceiptObj: any) {
    console.log("policyIssuance I WASS CALLED 2")
    let status = {
        success: true,
        status_code: 200,
        message: 'Policy Issuance successful',
        data: null
    }

    try {

        const inputBody = {
            "ClientCreation": ClientCreation,
            "PolicyCreationRequest": PolicyCreationRequest,
            "MemObj": MemObj,
            "ReceiptObj": ReceiptObj
        };

        const access_token = await aar_token();
        const headers = {
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'Authorization': `Bearer ${access_token}`
        };


        await axios.post(POLICY_ISSUANCE_URL, inputBody, { headers })
            .then((response: any) => {
                console.log();
                console.log("========  POLICY ISSUANCE SUCCESSFUL =======", response.data)
                status.data = response.data.ResponseObj.offlineResponseObj;
                return status;

            })
            .catch(error => {
                console.error(error)
                return {

                    success: false,
                    status_code: 500,
                    message: 'Internal server error',
                    data: error
                }

                // {
                //     "ErrorObj": [
                //         {
                //             "ErrorCode": 0,
                //             "ErrorMessage": "Success"
                //         }
                //     ],
                //     "ResponseObj": {
                //         "offlineResponseObj": {
                //             "Quotation_No": "Q20230522100007-00",
                //             "Policy_No": "AIK/23/PC001/100021/00/000",
                //             "Dcn_No": "20230522350000018",
                //             "PolicyStatus_Cd": "IF",
                //             "ErrorMessage": ""
                //         }
                //     }
                // }
            })


    } catch (error) {
        console.log( "=======  POLICY ERROR: ====", error)
        return {

            success: false,
            status_code: 500,
            message: 'Internal server error'
        }
    }
}

export default PolicyIssuance;