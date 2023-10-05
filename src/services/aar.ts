import axios, { AxiosRequestConfig } from 'axios';

import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/db';

const User = db.users;


async function arr_uganda_login() {
  try {

    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'http://airtelapi.aar-insurance.ug:82/api/auth/airtel/login',
      data: {
        "username": 'airtel',
        "password": '#$a!rtel$',
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



async function refreshToken(): Promise<void> {
  try {


    const config: AxiosRequestConfig = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'http://airtelapi.aar-insurance.ug:82/api/auth/token_refresh',
      headers: {
        'Authorization': 'Bearer ' + await arr_uganda_login(),
      }
    };

    console.log("CONFIG", config);

    const response = await axios.request(config);
    console.log(JSON.stringify(response.data));
  } catch (error) {
    console.error(error);
  }
}

// Example usage:
//refreshToken();



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
  gender: string;
  dob: string;
  pri_dep: string;
  family_title: string;
  tel_no: string;
  email: string;
  next_of_kin: NextOfKin;
  member_status: string;
  health_option: string;
  health_plan: string;
  policy_start_date: string;
  policy_end_date: string;
  unique_profile_id: string;
  money_transaction_id: string;
}

// {
//   "surname": "mary",
//   "first_name": "wairimu",
//   "other_names": "ms",
//   "gender": "1",
//   "dob": "1989-01-01",
//   "pri_dep": "24",
//   "family_title": "24",
//   "tel_no": "253701010101",
//   "email": "marydoe@gmail.com",
//   "next_of_kin": {
//       "surname": "jean",
//       "first_name": "mary",
//       "other_names": "doe",
//       "tel_no": "0799999999"
//   },
//   "member_status": "1",
//   "health_option": "63",
//   "health_plan": "MIDI",
//   "policy_start_date": "2022-09-28",
//   "policy_end_date": "2023-09-27",
//   "unique_profile_id": "123455"
// }

async function registerPrincipal(user: any, policy: any, beneficiary: any, airtel_money_id: any) {

  console.log("i was called register principal");
  // console.log("USER", user);
  // console.log("POLICY", policy);
  // console.log("BENEFICIARY", beneficiary);
  // console.log("AIRTEL MONEY ID", airtel_money_id);
  const userData: PrincipalRegistration = {
    surname: user.last_name + "test9",
    first_name: user.first_name + "test9",
    other_names: user.middle_name + "test9",
    gender: user.gender == 'M' ? "1" : "2",
    dob: user.dob,
    pri_dep: "24",
    family_title: "24",
    tel_no: `256${user.phone_number}`,
    email: user.email || "admin@bluewave.insure",
    next_of_kin: {
      surname: user.last_name,
      first_name: user.first_name,
      other_names: user.middle_name || "",
      tel_no: user.phone_number,
    },
    member_status: "1",
    health_option: "63",
    health_plan: "AIRTEL_" + policy.policy_type,
    policy_start_date: policy.policy_start_date,
    policy_end_date: policy.policy_end_date,
    unique_profile_id: user.membership_id + '',
    money_transaction_id: airtel_money_id,

  }

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
      await User.update({ is_active: true, arr_member_number: response.data.member_no }, { where: { user_id: user.user_id } });
      return { ...response.data, ...userData }
    }
  } catch (error) {
    console.error(error);
  }
}

// Example usage:
const registrationMembData: PrincipalRegistration = {
  surname: "james",
  first_name: "Odo",
  other_names: "doe",
  gender: "1",
  dob: "2000-09-09",
  pri_dep: "24",
  family_title: "24",
  tel_no: "0701010101",
  email: "james@gmail.com",
  next_of_kin: {
    surname: "jean",
    first_name: "mary",
    other_names: "doe",
    tel_no: "0799999999",
  },
  member_status: "2",
  health_option: "2",
  health_plan: "BRONZE10",
  policy_start_date: "2000-02-22",
  policy_end_date: "2000-02-01",
  unique_profile_id: "2000",
  money_transaction_id: "2000222",
};

//registerPrincipal(registrationMembData);


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


async function updatePremium(data: any, policy: any, airtel_money_id: any) {

  try {
    console.log("i was called update premium");
    console.log("updatePremium DATA", data, policy);

    const main_benefit_limit = policy.installment_type == 1 ? policy.sum_insured : policy.sum_insured / 12;
    const last_expense_limit = policy.installment_type == 1 ? policy.last_expense_insured : policy.last_expense_insured / 12;

    const requestData: requestPremiumData = {
      member_no: data.arr_member_number,
      unique_profile_id: data.membership_id+"",
      health_plan: "AIRTEL_" + policy.policy_type,
      health_option: "63",
      premium: policy.policy_deduction_amount,
      premium_type: policy.installment_type,
      premium_installment: policy.installment_order,
      main_benefit_limit: main_benefit_limit,
      last_expense_limit: last_expense_limit,
      money_transaction_id: airtel_money_id
    };

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

    console.log("CONFIG", config);

    const response = await axios.request(config);
    console.log(JSON.stringify(response.data));

    if (response.data.code == 200) {
      console.log(" updatePremium RESPONSE", response.data);
      return response.data;
    }

  } catch (error) {
    console.error(error);

  }
}


// Example usage:
// const requestData = {
//   "member_no": "UG152306-00",
//   "unique_profile_id": "123455",
//   "health_plan": "MIDI",
//   "health_option": "63",
//   "premium": 20000,
//   "premium_type": "2",
//   "premium_installment": "1",
//   "main_benefit_limit": 326667,
//   "last_expense_limit": 326667,
//   "money_transaction_id": "transact-002"
// };


interface NextOfKin {
  surname: string;
  first_name: string;
  other_names: string;
  tel_no: string;
}

interface DependantRegistration {
  member_no: string;
  surname: string;
  first_name: string;
  other_names: string;
  gender: string;
  dob: string;
  pri_dep: string;
  family_title: string;
  tel_no: string;
  email: string;
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

// Example usage:
// const registrationDepData: DependantRegistration = {
//   member_no: "UG152302-00",
//   surname: "joana",
//   first_name: "Mapendo",
//   other_names: "kadana",
//   gender: "2",
//   dob: "2012-01-01",
//   pri_dep: "25",
//   family_title: "4",
//   tel_no: "0701010101",
//   email: "joana@gmail.com",
//   next_of_kin: {
//     surname: "jeana",
//     first_name: "mary",
//     other_names: "doe",
//     tel_no: "0799999999",
//   },
//   member_status: "2",
//   health_option: "2",
//   health_plan: "bronze10",
//   policy_start_date: "2000-02-22",
//   policy_end_date: "2000-02-01",
//   unique_profile_id: "9999999",
// };

//registerDependant(registrationData);


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

// Example usage:
// const updateData: MemberUpdateData = {
//   member_no: "UG1523090-00",
//   surname: "pete",
//   first_name: "test",
//   other_names: "ptt",
//   gender: "2",
//   dob: "1978-01-01",
//   tel_no: "333333",
//   email: "testmail@gmail.com",
//   next_of_kin: {
//     surname: "paul",
//     first_name: "pw",
//     other_names: "doe",
//     tel_no: "0833333",
//   },
//   member_status: "1",
//   reason_for_member_status: "member is valid",
// };

//updateMember(updateData);



interface MemberStatusData {
  member_no: string;
  unique_profile_id: string;
}

async function fetchMemberStatusData({member_no, unique_profile_id}){
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

// Example usage:
// const statusData: MemberStatusData = {
//   member_no: "UG152302-00",
//   unique_profile_id: "2000",
// };

//fetchMemberStatusData(statusData);


export { registerPrincipal, registerDependant, renewMember, updateMember, fetchMemberStatusData, updatePremium };
