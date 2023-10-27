import axios, { AxiosRequestConfig } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/db';
import dotenv from 'dotenv';
import { calculateProrationPercentage } from './utils';

//const User = db.users;

function randomDateOfBirth() {
  const start = new Date(1950, 0, 1);
  const end = new Date(2000, 0, 1);
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];

}

async function arr_uganda_login() {
  try {

    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'http://airtelapi.aar-insurance.ug:82/api/auth/airtel/login',
      data: {
        "username": process.env.AAR_UGANDA_UAT_USERNAME,
        "password": process.env.AAR_UGANDA_UAT_PASSWORD,
      }
    };

    console.log("CONFIG", config);

    const response = await axios.request(config);
    console.log(JSON.stringify(response.data));
    return response.data.token;
  } catch (error) {
    throw error;
  }
}



// async function refreshToken(): Promise<void> {
//   try {
//     const config: AxiosRequestConfig = {
//       method: 'post',
//       maxBodyLength: Infinity,
//       url: 'http://airtelapi.aar-insurance.ug:82/api/auth/token_refresh',
//       headers: {
//         'Authorization': 'Bearer ' + await arr_uganda_login(),
//       }
//     };

//     console.log("CONFIG", config);

//     const response = await axios.request(config);
//     console.log(JSON.stringify(response.data));
//   } catch (error) {
//     console.error(error);
//   }
// }


interface NextOfKin {
  surname: string;
  first_name: string;
  other_names: string;
  tel_no: string;
}

interface PrincipalRegistration {
  surname: string;
  first_name: string;
  other_names: string;
  gender: number;
  dob: string;
  pri_dep: string;
  family_title: string;
  tel_no: string;
  email: string;
  next_of_kin: NextOfKin;
  member_status: string;
  health_option: string;
  health_plan: string;
  corp_id: string;
  policy_start_date: string;
  policy_end_date: string;
  unique_profile_id: string;
  money_transaction_id: string;
}


async function registerPrincipal(user: any, policy: any) {
  const userData: PrincipalRegistration = {
    surname: user.last_name,
    first_name: user.first_name,
    other_names:  "",
    gender: 1,
    dob: randomDateOfBirth(),//user.date_of_birth,
    pri_dep: "24",
    family_title: "3",
    tel_no: `256${user.phone_number}`,
    email: user.email || "admin@bluewave.insure",
    next_of_kin: {
      surname: user.last_name,
      first_name: user.first_name,
      other_names: user.middle_name || "",
      tel_no: user.phone_number,
    },
    member_status: "1",
    health_option: "64",
    health_plan: "AIRTEL_" + policy.policy_type,
    corp_id: "758",
    policy_start_date: policy.policy_start_date,
    policy_end_date: policy.policy_end_date,
    unique_profile_id: user.membership_id + '',
    money_transaction_id: policy.airtel_money_id,
    
  }
  console.log("REGISTER PRINCIPAL AAR", userData);
  
  try {
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'http://airtelapi.aar-insurance.ug:82/api/airtel/v1/protected/register_principal',
      headers: {
        'Authorization': 'Bearer ' + await arr_uganda_login(),
        'Content-Type': 'application/json',
      },
      data: userData,
    };
    console.log("CONFIG", config);
    const response = await axios.request(config);
    console.log(JSON.stringify(response.data));

    if (response.data.code == 200) {
      await db.users.update({ is_active: true, arr_member_number: response.data.member_no }, { where: { user_id: user.user_id } });
      return { ...response.data, ...userData }
    }
  } catch (error) {
    console.error(error);
  }
}



interface requestPremiumData {
  member_no: string;
  unique_profile_id: string;
  health_plan: string;
  health_option: string;
  premium: number;
  premium_type: number;
  premium_installment: number;
  main_benefit_limit: number;
  last_expense_limit: number;
  money_transaction_id: string;
}


async function updatePremium(user: any, policy: any) {

  try {

    const payments = await db.payments.findAll({
      where: {
        policy_id: policy.policy_id,
        payment_status: "paid"
      }
    });
    let proratedPercentage = calculateProrationPercentage(payments.length)
  

    const main_benefit_limit = policy.installment_type == 1 ? policy.sum_insured : policy.sum_insured / proratedPercentage
    const last_expense_limit = policy.installment_type == 1 ? policy.last_expense_insured : policy.last_expense_insured / proratedPercentage
   

    let premium_installment = payments.length + 1;

    let ultimatePremium = policy.premium

    if(policy.beneficiary == "FAMILY" || policy.beneficiary == "OTHER" ){
      // spit premium based on memeber family size e.g  M+3  PREMIUM / 4

      if(policy.total_member_number !== "M"){
        const policyPremium = policy.premium
        const memberSize = (policy.total_member_number).split("")[2]
        console.log(policyPremium, memberSize)
        ultimatePremium = policyPremium / (parseInt(memberSize) + 1)
        
      }
      
    }
    

    const requestData: requestPremiumData = {
      member_no: user.arr_member_number || user.member_no,
      unique_profile_id: user.membership_id + "",
      health_plan: "AIRTEL_" + policy.policy_type,
      health_option: "64",
      premium: ultimatePremium,
      premium_type: policy.installment_type,
      premium_installment: premium_installment,
      main_benefit_limit: main_benefit_limit,
      last_expense_limit: last_expense_limit,
      money_transaction_id: policy.airtel_money_id
    };
    console.log("REQUEST DATA AAR UPDATE PREMIUM", requestData);
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'http://airtelapi.aar-insurance.ug:82/api/airtel/v1/protected/update_premium',
      headers: {
        'Authorization': 'Bearer ' + await arr_uganda_login(),
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(requestData),
    };


    const response = await axios.request(config);
    console.log(JSON.stringify(response.data));

    if (response.data.code == 200) {
      // console.log("UPDATE PREMIUM AAR RESPONSE", response.data);
      return response.data;
    }

  } catch (error) {
    console.error(error);

  }
}



interface NextOfKin {
  surname: string;
  first_name: string;
  other_names: string;
  tel_no: string;
}

interface DependantRegistration {
  member_no: string;
  surname: string;  // UNIQUE??  ALADIN+UNIQUE_PROFILE_ID
  first_name: string;
  other_names: string;
  gender: number,// 1
  dob: string; // 1990-01-01
  pri_dep: string; // 24
  family_title: string; // 24
  tel_no: string; // UNIQUE??
  email: string;// OPTIONAL
  next_of_kin: NextOfKin;
  member_status: string;
  health_option: string;
  health_plan: string;
  policy_start_date: string;
  policy_end_date: string;
  unique_profile_id: string;
}


async function registerDependant(data: DependantRegistration): Promise<void> {
  try {
    const config: AxiosRequestConfig = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'http://airtelapi.aar-insurance.ug:82/api/airtel/v1/protected/register_dependant',
      headers: {
        'Authorization': 'Bearer ' + await arr_uganda_login(),
        'Content-Type': 'application/json',
      },
      data,
    };

    console.log("CONFIG", config)

    const response = await axios.request(config);
    console.log(JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.error(error);
  }
}


interface MemberRenewalData {
  member_no: string;
  member_status: string;
  health_option: string;
  health_plan: string;
  policy_start_date: string;
  policy_end_date: string;
}


async function renewMember(data: MemberRenewalData): Promise<void> {
  try {
    const config: AxiosRequestConfig = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'http://airtelapi.aar-insurance.ug:82/api/airtel/v1/protected/renew_member',
      headers: {
        'Authorization': 'Bearer ' + await arr_uganda_login(),
        'Content-Type': 'application/json',
      },
      data,
    };
    console.log("CONFIG", config);

    const response = await axios.request(config);
    console.log(JSON.stringify(response.data));
  } catch (error) {
    console.error(error);
  }
}

// Example usage:
const renewalData: MemberRenewalData = {
  member_no: "UG152301-01",
  member_status: "1",
  health_option: "3",
  health_plan: "bronze10",
  policy_start_date: "2023-08-21",
  policy_end_date: "2024-08-22",
};

//renewMember(renewalData);

interface NextOfKin {
  surname: string;
  first_name: string;
  other_names: string;
  tel_no: string;
}

interface MemberUpdateData {
  member_no: string;
  surname: string;
  first_name: string;
  other_names: string;
  gender: string;
  dob: string;
  tel_no: string;
  email: string;
  next_of_kin: NextOfKin;
  member_status: string;
  reason_for_member_status: string;
}

async function updateMember(data: MemberUpdateData): Promise<void> {
  try {
    const config: AxiosRequestConfig = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'http://airtelapi.aar-insurance.ug:82/api/airtel/v1/protected/update_member',
      headers: {
        'Authorization': 'Bearer ' + await arr_uganda_login(),
      },
      data,
    };

    console.log("CONFIG", config);

    const response = await axios.request(config);
    console.log(JSON.stringify(response.data));
  } catch (error) {
    console.error(error);
  }
}



interface MemberStatusData {
  member_no: string;
  unique_profile_id: string;
}

async function fetchMemberStatusData({ member_no, unique_profile_id }) {
  try {
    const config: AxiosRequestConfig = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'http://airtelapi.aar-insurance.ug:82/api/airtel/v1/protected/member_status_data',
      headers: {
        'Authorization': 'Bearer ' + await arr_uganda_login(),
      },
      data: {
        member_no,
        unique_profile_id
      }
    };
    console.log("CONFIG", config)
    const response = await axios.request(config);
    console.log(JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.error(error);
  }
}




export { registerPrincipal, registerDependant, renewMember, updateMember, fetchMemberStatusData, updatePremium };
