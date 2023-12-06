import axios, { AxiosRequestConfig } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/db';
import dotenv from 'dotenv';
dotenv.config()
import { calculateProrationPercentage } from './utils';

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

  

    const response = await axios.request(config);
    console.log(response)

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
  if (user.user_id !== policy.user_id) {
    throw new Error(" POLICY NOT FOR USER");
  }
 
  const userData: PrincipalRegistration = {
    surname: user.last_name || `256${user.phone_number}`,
    first_name: user.first_name || `256${user.phone_number}`,
    other_names:  "",
    gender: 1,
    dob: "1900-01-01",
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


// // Define a function to create the dependent
async function createDependant( existingUser: any, myPolicy: any) {
  try {

    // const existingUser = await db.users.findOne({
    //   where: {
    //     phone_number:  phoneNumber
    //   }
    // });
    // //  console.log('existingUser', existingUser);
    // if (!existingUser) {
    //   throw new Error("USER NOT FOUND");
    // }

    // let myPolicy = await db.policies.findOne({
    //   where: {
    //     user_id: existingUser.user_id,
    //     policy_status: 'paid',
    //     installment_type: 2
    //   }
    // });

    // if (!myPolicy) {
    //   throw new Error("NO FAMILY OR OTHER POLICY FOUND");
    // }
    let arr_member: any;
    let dependant: any;
    let number_of_dependants = parseFloat(myPolicy.total_member_number.split("")[2]);
    console.log("number_of_dependants ", number_of_dependants)


    if (existingUser.arr_member_number == null) {
      console.log("REGISTER PRINCIPAL");
      // Introduce a delay before calling registerPrincipal
      await new Promise(resolve => {
        setTimeout(async () => {
          const arr_member = await registerPrincipal(existingUser, myPolicy);
          console.log("ARR PRINCIPAL CREATED", arr_member);
          resolve(true);
        }, 1000); // Adjust the delay as needed (1 second in this example)
      });
    } else {
      // Fetch member status data or register principal based on the condition

      await new Promise(resolve => {
        setTimeout(async () => {
          arr_member = await fetchMemberStatusData({
            member_no: existingUser.arr_member_number,
            unique_profile_id: existingUser.membership_id + "",
          });
          console.log("AAR MEMBER FOUND", arr_member);

          if (arr_member.code == 624) {
            arr_member = await registerPrincipal(existingUser, myPolicy);
            console.log("ARR PRINCIPAL CREATED", arr_member);
            resolve(true);
          }

          for (let i = 1; i <= number_of_dependants; i++) {
            let dependant_first_name = `${i}firstname${existingUser.membership_id}`;
            let dependant_other_names = `${i}othernames${existingUser.membership_id}`;
            let dependant_surname = `${i}surname${existingUser.membership_id}`;

            if (arr_member.policy_no != null && arr_member.code == 200) {
              // Use a Promise with setTimeout to control the creation
              await new Promise(resolve => {
                setTimeout(async () => {
                  dependant = await registerDependant({
                    member_no: existingUser.arr_member_number,
                    surname: dependant_surname,
                    first_name: dependant_first_name,
                    other_names: dependant_other_names,
                    gender: 1,
                    dob: "1990-01-01",
                    email: "dependant@bluewave.insure",
                    pri_dep: "25",
                    family_title: "25", // Assuming all dependants are children
                    tel_no: myPolicy.phone_number,
                    next_of_kin: {
                      surname: "",
                      first_name: "",
                      other_names: "",
                      tel_no: "",
                    },
                    member_status: "1",
                    health_option: "64",
                    health_plan: "AIRTEL_" + myPolicy?.policy_type,
                    policy_start_date: myPolicy.policy_start_date,
                    policy_end_date: myPolicy.policy_end_date,
                    unique_profile_id: existingUser.membership_id + "",
                  });

                  if (dependant.code == 200) {

                    console.log(`Dependant ${i} created:`, dependant);

                    myPolicy.arr_policy_number = arr_member?.policy_no;
                    dependant.unique_profile_id = existingUser.membership_id + "";
                    let updateDependantMemberNo = []
                    updateDependantMemberNo.push(dependant.member_no)
                    await db.policies.update(
                      { dependant_member_numbers: updateDependantMemberNo },
                      { where: { policy_id: myPolicy.policy_id } }
                    );
                    let updatePremiumData = await updatePremium(dependant, myPolicy);
                    if (updatePremiumData == 200) {
                      console.log("AAR UPDATE PREMIUM", updatePremiumData);
                      resolve(true)
                    }
                    resolve(true)
                  }
                }, 1000 * i); // Adjust the delay as needed
              });
            } else {
              console.log("NO ARR MEMBER")
            }
          }

        }, 1000); // Adjust the delay as needed (1 second in this example)
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}


async function updatePremium(user: any, policy: any) {

  try {
    if(user.user_id !== policy.user_id){
      throw new Error(" POLICY NOT FOR USER");
    }

  console.log('UPDATE PREMIUM',user.name, policy.policy_type, user.total_member_number)
    const main_benefit_limit =  policy.sum_insured 
    const last_expense_limit =  policy.last_expense_insured 

    let ultimatePremium = policy.premium

    
    if(policy.total_member_number !== "M"  && policy.total_member_number !== null){
      const number_of_dependants = parseFloat(policy?.total_member_number.split("")[2]) || 0;
      console.log("Number of dependants:", number_of_dependants);
    
      const policyPremium = policy.premium
        const memberSize = (policy.total_member_number).split("")[2]
        console.log(policyPremium, memberSize)
        ultimatePremium = policyPremium / (parseInt(memberSize) + 1)
      }
      
    const requestData: requestPremiumData = {
      member_no: user?.arr_member_number || user?.member_no,
      unique_profile_id: user?.membership_id + "" ||user?.unique_profile_id + "",
      health_plan: "AIRTEL_" + policy.policy_type,
      health_option: "64",
      premium: ultimatePremium,
      premium_type: policy.installment_type,
      premium_installment: policy.renewal_order || 1,
      main_benefit_limit: main_benefit_limit,
      last_expense_limit: last_expense_limit,
      money_transaction_id: policy.airtel_money_id || "123456789",
    };
   
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'http://airtelapi.aar-insurance.ug:82/api/airtel/v1/protected/update_premium',
      headers: {
        'Authorization': 'Bearer ' +  await arr_uganda_login(),
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(requestData),
    };

    const response = await axios.request(config);
    console.log(JSON.stringify(response.data));
      return response.data;
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


async function processPolicy(user: any, policy: any, memberStatus: any) {
  // Determine the number of dependants
  console.log(policy?.total_member_number)
  const number_of_dependants = parseFloat(policy?.total_member_number.split("")[2]) || 0;
  console.log("Number of dependants:", number_of_dependants);

  if (memberStatus.code === 200) {
    // If the member status is 200, proceed with processing the policy
    console.log("MEMBER STATUS:", memberStatus);
    policy.arr_policy_number = memberStatus?.policy_no;
  } else {
    // If the member status is not 200, register the AAR user
    const registerAARUser = await registerPrincipal(user, policy);

    if (registerAARUser.code === 200) {
      // If the AAR user registration is successful
      user.arr_member_number = registerAARUser.member_no;
      await user.save();
    }

    if (number_of_dependants > 0) {
      // If there are dependants, create them
      await createDependant(user, policy);
    } else {
      // If there are no dependants, update the premium
      const updatePremiumData = await updatePremium(user, policy);
      console.log("AAR UPDATE PREMIUM - member found", updatePremiumData);
    }
  }
}


export { registerPrincipal, registerDependant, renewMember, updateMember, fetchMemberStatusData, updatePremium, createDependant, processPolicy };
