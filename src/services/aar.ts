import axios, { AxiosRequestConfig } from 'axios';

import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/db';


async function arr_uganda_login() {
  try {
   
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'http://airtelapi.aar-insurance.ug:82/api/auth/login',
      data:  {
        "username": 'airtel',
        "password": '#$a!rtel$',
    }
    };

    const response = await axios.request(config);
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
//   "health_plan": "AIRTEL_MIDI",
//   "policy_start_date": "2022-09-28",
//   "policy_end_date": "2023-09-27",
//   "unique_profile_id": "123455"
// }

async function registerPrincipal(user: any, policy: any,beneficiary: any, airtel_money_id: any){
console.log("USER", user);
console.log("POLICY", policy);
console.log("BENEFICIARY", beneficiary);
console.log("AIRTEL MONEY ID", airtel_money_id);
  const userData = {
      surname: user.last_name,
      first_name: user.first_name,
      other_names: user.middle_name,
      gender: user.gender == 'M' ? "1" : "2",
      dob: user.dob,
      pri_dep: 24,
      family_title:user.title == "Mr" ? "24" : "25",
      tel_no: `256${user.phone_number}`,
      email: user.email || "",
      next_of_kin: {
        surname:  user.last_name,
        first_name: user.first_name,
        other_names: user.middle_name || "",
        tel_no:  user.phone_number,
      },
      member_status:"1",
      health_option: "63",
      health_plan: policy.policy_type,
      policy_start_date: policy.policy_start_date,
      policy_end_date: policy.policy_end_date,
      unique_profile_id: user.membership_id,
      money_transaction_id: airtel_money_id,
    
  }

  try {
    const config: AxiosRequestConfig = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'http://airtelapi.aar-insurance.ug:82/api/weerinde/v1/protected/register_principal',
      headers: {
        'Authorization': 'Bearer ' + await arr_uganda_login(),
        'Content-Type': 'application/json',
      },
      data: userData,
    };

    const response = await axios.request(config);
    console.log(JSON.stringify(response.data));
    
    if(response.data.code == 200){
      user.update({status: "active", arr_member_number: response.data.data.member_no});
      user.save();
    }
    return response.data;
     
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
  premium: string;
  unique_profile_id: string;
}

async function registerDependant(data: DependantRegistration): Promise<void> {
  try {
    const config: AxiosRequestConfig = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'http://airtelapi.aar-insurance.ug:82/api/weerinde/v1/protected/register_dependant',
      headers: {
        'Authorization': 'Bearer Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJhYXJ1ZyIsImV4cCI6MTY5NDI1NzY4NSwidXNlciI6W3siZnVsbF9uYW1lcyI6IndlZXJpbmRlIn1dfQ.JVXCW8AGL8sGQicqI-0mvUSaXAeu57iZw0_9RhSap9cFj8T8gxYwJxoocIb_uMEC3x-5mKzVGCkcASzzlHY0aYQU3jTYx2BhrSeuAFufSwAlHs9Jkg-d6O1G-GSY546yEarrV6XHBNY6ZO8OJ0Dl6OXd5_aerxp8JaY7FwsHgZ8aKg72frg-Fvj9TbHJj_1YuLNSizPufC00UjObc5h8U_UqEX7xEsmwhQL-zutrn9c9GdSr490EzkvyKbGDt0ShACaKlAIO30J13g5EvaOsaLA3tPjl8tOKcNLNZsbPXm9jEkCOEre3BtW0WJjsO9Z-Uwc_rKvtyTKJm04_WMr5ew',
        'Content-Type': 'application/json',
      },
      data,
    };

    const response = await axios.request(config);
    console.log(JSON.stringify(response.data));
  } catch (error) {
    console.error(error);
  }
}

// Example usage:
const registrationDepData: DependantRegistration = {
  member_no: "UG152302-00",
  surname: "joana",
  first_name: "Mapendo",
  other_names: "kadana",
  gender: "2",
  dob: "2012-01-01",
  pri_dep: "25",
  family_title: "4",
  tel_no: "0701010101",
  email: "joana@gmail.com",
  next_of_kin: {
    surname: "jeana",
    first_name: "mary",
    other_names: "doe",
    tel_no: "0799999999",
  },
  member_status: "2",
  health_option: "2",
  health_plan: "bronze10",
  policy_start_date: "2000-02-22",
  policy_end_date: "2000-02-01",
  premium: "345.60",
  unique_profile_id: "9999999",
};

//registerDependant(registrationData);


interface MemberRenewalData {
  member_no: string;
  member_status: string;
  health_option: string;
  health_plan: string;
  policy_start_date: string;
  policy_end_date: string;
  premium: string;
  money_transaction_id: string;
}

async function renewMember(data: MemberRenewalData): Promise<void> {
  try {
    const config: AxiosRequestConfig = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'http://airtelapi.aar-insurance.ug:82/api/weerinde/v1/protected/renew_member',
      headers: {
        'Authorization': 'Bearer ' + await arr_uganda_login(),
        'Content-Type': 'application/json',
      },
      data,
    };

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
  premium: "6500000.00",
  money_transaction_id: "werwerffwww44",
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
  premium: string;
  reason_for_member_status: string;
}

async function updateMember(data: MemberUpdateData): Promise<void> {
  try {
    const config: AxiosRequestConfig = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'http://airtelapi.aar-insurance.ug:82/api/weerinde/v1/protected/update_member',
      headers: {
        'Authorization': 'Bearer ' + await arr_uganda_login(),
      },
      data,
    };

    const response = await axios.request(config);
    console.log(JSON.stringify(response.data));
  } catch (error) {
    console.error(error);
  }
}

// Example usage:
const updateData: MemberUpdateData = {
  member_no: "UG1523090-00",
  surname: "pete",
  first_name: "test",
  other_names: "ptt",
  gender: "2",
  dob: "1978-01-01",
  tel_no: "333333",
  email: "testmail@gmail.com",
  next_of_kin: {
    surname: "paul",
    first_name: "pw",
    other_names: "doe",
    tel_no: "0833333",
  },
  member_status: "1",
  premium: "700000",
  reason_for_member_status: "member is valid",
};

//updateMember(updateData);



interface MemberStatusData {
  member_no: string;
  unique_profile_id: string;
}

async function fetchMemberStatusData(data: MemberStatusData): Promise<void> {
  try {
    const config: AxiosRequestConfig = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'http://airtelapi.aar-insurance.ug:82/api/weerinde/v1/protected/member_status_data',
      headers: {
        'Authorization': 'Bearer ' + await arr_uganda_login(),
      },
      data,
    };

    const response = await axios.request(config);
    console.log(JSON.stringify(response.data));
  } catch (error) {
    console.error(error);
  }
}

// Example usage:
const statusData: MemberStatusData = {
  member_no: "UG152302-00",
  unique_profile_id: "2000",
};

//fetchMemberStatusData(statusData);


export { registerPrincipal, registerDependant, renewMember, updateMember, fetchMemberStatusData };
