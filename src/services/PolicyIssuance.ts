
const axios = require('axios');

const dotenv = require('dotenv');
dotenv.config();

const POLICY_ISSUANCE_URL= process.env.POLICY_ISSUANCE_URL
const POLICY_ISSUANCE_TOKEN_URL = process.env.POLICY_ISSUANCE_TOKEN_URL

async function token() {

    console.log("policyIssuance  token I WASS CALLED 3")


    try {
        let token: any;
    const inputBody = {
          "user_Type": "Employee",
          "user_Nm": "USSD",
          "password": "vicZb/1Cm2P4KX07vmUjmU73ARBZTEb9IsGJg4wuT0w=",
          "iP_Address": "142.1.1.2",
          "application_Source": "USSD",
          "is_External": false,
          "secret_Key": "e7c69910cc0057265615011cc2d1f1a4"
        }
        
    const headers = {
        'Content-Type': 'application/json',
        'Accept': '*/*'
    };

    await axios.post( POLICY_ISSUANCE_TOKEN_URL, inputBody, { headers })
        .then((response:any )=> {
            console.log(response.data);
            token = response.data.access_token;
            console.log("TOKEN", token)
          
        })
        .catch(error => {
            console.error(error)

            return error;



 //           Response:
// {
//     "errorObj": [
//         {
//             "errorCode": 0,
//             "errorMessage": "Success"
//         }
//     ],
//     "responseObj": {
//         "token": {
//             "access_Token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJZCI6IjU1MyIsIklQX0FkZHJlc3MiOiIxNDIuMS4xLjIiLCJBY2Nlc3NfVHlwZSI6IkFMTCIsIkFwcGxpY2F0aW9uX1NvdXJjZSI6IlVTU0QiLCJuYmYiOjE2ODQ4MzY3MTQsImV4cCI6MTY4NDkyMzExNCwiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NDk1NDYiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo0OTU0NiJ9.zZvp1g1LUuWXxfbvn-so0l9JX-eGGTsROp7o47DJ6Vg",
//             "token_Issue": "2023-05-23T18:11:54+08:00",
//             "token_Expire": "2023-05-24T18:11:54+08:00",
//             "refresh_Token": "ICg8FqJcHGyXZEujeCR2LzmBC1SlXSeGZYCbQdZ60RY="
//         }
//     }
// }
        })

        return token;
        
    } catch (error) {
        console.log(error)
        throw new Error(error)
        
    }
}


async function PolicyIssuance(ClientCreation: any, PolicyCreationRequest:any, MemObj:any, ReceiptObj:any) {
    console.log("policyIssuance I WASS CALLED 2")
let status=  {
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

        const headers = {
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJZCI6IjU1MyIsIklQX0FkZHJlc3MiOiIxNDIuMS4xLjIiLCJBY2Nlc3NfVHlwZSI6IkFMTCIsIkFwcGxpY2F0aW9uX1NvdXJjZSI6IlVTU0QiLCJuYmYiOjE2ODQ4MzY3MTQsImV4cCI6MTY4NDkyMzExNCwiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NDk1NDYiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo0OTU0NiJ9.zZvp1g1LUuWXxfbvn-so0l9JX-eGGTsROp7o47DJ6Vg`
        };

        
        await axios.post( POLICY_ISSUANCE_URL, inputBody, { headers })
            .then((response :any) => {
                console.log(response.data);
                console.log("POLICY ISSUANCE SUCCESSFUL")
                status.data = response.data;
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
 console.log("ERROR: ",error)
       return {

            success: false,
            status_code: 500,
            message: 'Internal server error'
       }
    }
}

export default PolicyIssuance;