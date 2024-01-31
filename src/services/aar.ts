import axios, { AxiosRequestConfig } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/db';
import dotenv from 'dotenv';
dotenv.config()
import { calculateProrationPercentage, formatAmount } from './utils';
import moment from 'moment';
import SMSMessenger from './sendSMS';
/* create arrService class to handle all aar related function
  - create user
  - create policy
  - create dependant
  - update policy
  - update dependant
  - renew policy
  - fetch member status
  - fetch policy status
  - fetch dependant status
  - fetch policy details

  */



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
  if (user.user_id !== policy?.user_id) {
    console.log("POLICY NOT FOR USER");
  }


  if (policy && user) {
   
    const userData: PrincipalRegistration = {
      surname: user.last_name || `256${user.phone_number}`,
      first_name: user.first_name || `256${user.phone_number}`,
      other_names: "",
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
      policy_start_date: moment(policy.policy_start_date).format('YYYY-MM-DD').split("T")[0],
      policy_end_date: moment(policy.policy_end_date).format('YYYY-MM-DD').split("T")[0],
      unique_profile_id: user.membership_id + '',
      money_transaction_id: policy.airtel_money_id,

    }

   // console.log("USER DATA", userData);

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
      //console.log("CONFIG", config);
      const response = await axios.request(config);
      console.log("ARR REG MEMBER RESPONSE", response.data, user.name, policy.policy_type, user.total_member_number, policy.phone_number);

      if (response.data.code == 200) {
        console.log("AAR PRINCIPAL CREATED", response.data);
        await db.users.update({ is_active: true, arr_member_number: response.data.member_no }, { where: { user_id: user.user_id } });
        let principal_member = await db.users.findOne({ where: { user_id: user.user_id } });
        principal_member.arr_member_number = response.data.member_no
        principal_member.is_active= true
        principal_member.save();
        const message =`Dear customer, your Ddwaliro Care Policy number is ${principal_member.arr_member_number}. Present this to the hospital whenever you have a claim. To renew, dial *185*7*6*3# and check on My Policy.`
        await SMSMessenger.sendSMS(`+256${principal_member.phone_number}`, message);
        return { ...response.data, ...userData }
      }
    } catch (error) {
      console.error(error);
    }
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
  transaction_date: string;
  money_transaction_id: string;
}


// // Define a function to create the dependent
async function createDependant(existingUser: any, myPolicy: any) {
  try {

  
    let arr_member: any, dependant: any;
    console.log('myPolicy', myPolicy)
    let number_of_dependants = parseFloat(myPolicy.total_member_number.split("")[2])
    console.log("number_of_dependants ", number_of_dependants)

         if( myPolicy.dependant_member_numbers.length == 0){
          for (let i = 1; i <= number_of_dependants; i++) {
            let dependant_first_name = `${i}firstname${existingUser.membership_id}`;
            let dependant_other_names = `${i}othernames${existingUser.membership_id}`;
            let dependant_surname = `${i}surname${existingUser.membership_id}`;

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
                    policy_start_date: moment(myPolicy.policy_start_date).format('YYYY-MM-DD').split("T")[0],
                    policy_end_date: moment(myPolicy.policy_end_date).format('YYYY-MM-DD').split("T")[0],
                    unique_profile_id: existingUser.membership_id + "",
                  });

                  if (dependant?.code == 200) {

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
            
          }
        }else{
         
          console.log("DEPENDANT ALREADY CREATED")
        }
  } catch (error) {
    console.error('Error:', error.message);
  }
}


async function updatePremium(user: any, policy: any) {

  try {
    console.log("USER ID , POLICY ID", user.user_id, policy.user_id)
    if (user.user_id !== policy.user_id) {
      console.log("POLICY NOT FOR USER");
    } else {

      console.log('UPDATE PREMIUM', user.name, policy.policy_type, user.total_member_number)
      const main_benefit_limit = policy.sum_insured
      const last_expense_limit = policy.last_expense_insured

      let ultimatePremium = policy.premium


      if (policy.total_member_number !== "M" && policy.total_member_number !== null) {
        const number_of_dependants = parseFloat(policy?.total_member_number.split("")[2]) || 0;
        console.log("Number of dependants:", number_of_dependants);

        const policyPremium = policy.premium
        const memberSize = (policy.total_member_number).split("")[2]
        console.log(policyPremium, memberSize)
        ultimatePremium = policyPremium / (parseInt(memberSize) + 1)
      }

      const requestData: requestPremiumData = {
        member_no: user?.arr_member_number,
        unique_profile_id: user?.membership_id + "" ,
        health_plan: "AIRTEL_" + policy.policy_type,
        health_option: "64",
        premium: ultimatePremium,
        premium_type: policy.installment_type,
        premium_installment: policy.installment_order || 1,
        main_benefit_limit: main_benefit_limit,
        last_expense_limit: last_expense_limit,
        transaction_date: moment(policy.policy_paid_date).format('YYYY-MM-DD').split("T")[0],
        money_transaction_id: policy.airtel_money_id || "123456789",
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
      if(response.data.code == 200){
        await db.policies.update({ arr_policy_number: response.data.policy_no }, { where: { policy_id: policy.policy_id } });
      }
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
    const response = await axios.request(config);

    return response.data;
  } catch (error) {
    console.error(error);
  }
}

 async function processPolicy(user: any, policy: any, memberStatus: any) {
  console.log(policy?.total_member_number)
  const number_of_dependants = parseFloat(policy?.total_member_number.split("")[2]) || 0;
  console.log("Number of dependants:", number_of_dependants);

  if (memberStatus?.code === 200) {
    await db.policies.update({ arr_policy_number: memberStatus.policy_no }, { where: { policy_id: policy.policy_id } });
  } else {
    const registerAARUser = await registerPrincipal(user, policy);
     user.arr_member_number = registerAARUser?.member_no;
    if (number_of_dependants > 0) {
      await createDependant(user, policy);
    } else {
      console.log("AAR NUMBER- member found", user.phone_number, user.name, user.arr_member_number);
      const updatePremiumData = await updatePremium(user, policy);
      console.log("AAR UPDATE PREMIUM - member found", updatePremiumData);
    }
  }
}



async function reconciliation(existingUser, paymentData) {
  let {
    transaction_date,
    premium,
    payment_id,
    airtel_money_id,
    phone_number,
  } = paymentData


  //update policy status to paid
  await db.policies.update(
    {
      policy_status: "paid",
      policy_paid_amount: premium,
      premium: premium,
      airtel_money_id: airtel_money_id,
      policy_start_date: transaction_date,
      policy_paid_date: transaction_date,
    },
    { where: { user_id: existingUser.user_id } }
  );
  let policy: any = await db.policies.findOne({
    where: {
      [db.Sequelize.Op.or]: [
        { user_id: existingUser.user_id },
        { phone_number: `+256${existingUser.phone_number}` },
      ],
      premium: premium,
      policy_status: 'paid',
    },
  });
  console.log("POLICY", policy, existingUser.phone_number, existingUser.name, premium);
  const policyType = policy.policy_type.toUpperCase();
  const period = policy.installment_type == 1 ? "yearly" : "monthly";
  let updatePayment = await db.payments.update({
    payment_status: "paid",
    payment_type: "airtel money stk push for " + policyType + " " + period + " payment",
    message: `PAID UGX ${premium} to AAR Uganda for ${policyType} Cover, TID: ${airtel_money_id}. Date: ${transaction_date}`
  }, {
    where: {
      payment_status: "pending",
      payment_amount: premium
    }
  });
  console.log("PAYMENT UPDATED", updatePayment);
  //update number of policies for the user
  let user_policies = await db.policies.findAll({
    where: {
      [db.Sequelize.Op.or]: [
        { user_id: existingUser.user_id },
        { bought_for: existingUser.user_id },
      ],
      policy_status: 'paid',
      premium: premium,
    },
    limit: 12,
  });

  await db.users.update(
    {
      number_of_policies: user_policies.length
    },
    {
      where: {
        [db.Sequelize.Op.or]: [
          { user_id: existingUser.user_id },
        ],
      }
    }
  );


//   const members = policy.total_member_number?.match(/\d+(\.\d+)?/g) || 1
//   console.log("MEMBERS", members);


//   const sumInsured = formatAmount(policy.sum_insured);
//   const lastExpenseInsured = formatAmount(policy.last_expense_insured);
//   console.log("SUM INSURED", sumInsured);
//   console.log("LAST EXPENSE INSURED", lastExpenseInsured);

//   const thisDayThisMonth = policy.installment_type === 2 ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate() - 1) : new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1);

//   let congratText = "";

//   if (policy.beneficiary == "FAMILY") {
//     congratText = `Congratulations! You and ${members} dependent are each covered for Inpatient benefit of UGX ${sumInsured} and Funeral benefit of UGX ${lastExpenseInsured}. Cover valid till ${thisDayThisMonth.toDateString()}`
//   } else if (policy.beneficiary == "SELF")
//     congratText = `Congratulations! You are covered for Inpatient benefit of UGX ${sumInsured} and Funeral benefit of UGX ${lastExpenseInsured}. Cover valid till ${thisDayThisMonth.toDateString()}`;
//   else if (policy.beneficiary == "OTHER") {
//     congratText = `${existingUser.first_name} has bought for you Ddwaliro Care for Inpatient ${sumInsured} and Funeral benefit of ${lastExpenseInsured}. Dial *185*7*6# on Airtel to enter next of kin & view more details`
//   }

//  // await SMSMessenger.sendSMS(`+256${payment['Sender Mobile Number']}`, congratText);
//  console.log("CONGRAT TEXT", congratText);



let arr_member: any; // AAR Member
let dependant: any; // AAR Dependant
if (existingUser.arr_member_number  ) {
  // Fetch member status data or register principal based on the condition
  arr_member = await fetchMemberStatusData({
    member_no: existingUser.arr_member_number,
    unique_profile_id: existingUser.membership_id + "",
  });
  console.log("AAR MEMBER FOUND", arr_member);

  if (arr_member.code == 624) {
    arr_member = await registerPrincipal(existingUser, policy);
    console.log("ARR PRINCIPAL CREATED", arr_member);
  }
}


let updatedPremium: any;
if (policy?.total_member_number == 'M') {
  updatedPremium = await updatePremium(existingUser, policy);
  console.log("UPDATED PREMIUM", updatedPremium);
}
let number_of_dependants = parseFloat(policy?.total_member_number?.split("")[2]) || 0;
if (number_of_dependants > 0 && policy.dependant_member_numbers.length == 0) {
  for (let i = 1; i <= number_of_dependants; i++) {
    let dependant_first_name = `${i}firstname${existingUser.membership_id}`;
    let dependant_other_names = `${i}othernames${existingUser.membership_id}`;
    let dependant_surname = `${i}surname${existingUser.membership_id}`;

    if (arr_member?.code == 200) {
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
            tel_no: policy.phone_number,
            next_of_kin: {
              surname: "",
              first_name: "",
              other_names: "",
              tel_no: "",
            },
            member_status: "1",
            health_option: "64",
            health_plan: "AIRTEL_" + policy?.policy_type,
            policy_start_date: policy.policy_start_date,
            policy_end_date: policy.policy_end_date,
            unique_profile_id: existingUser.membership_id + "",
          });

          if (dependant.code == 200) {

            console.log(`Dependant ${i} created:`, dependant);

            policy.arr_policy_number = arr_member?.policy_no;
            dependant.unique_profile_id = existingUser.membership_id + "";
            let updateDependantMemberNo: string[] = []
            updateDependantMemberNo.push(dependant.member_no)
            await db.policies.update(
              { dependant_member_numbers: updateDependantMemberNo },
              { where: { policy_id: policy.policy_id } }
            );
            let updatePremiumData = await updatePremium(dependant, policy);
            if (updatePremiumData.code == 200) {
              console.log("AAR UPDATE PREMIUM", updatePremiumData);
              resolve(true)
            } else {
              console.log("AAR NOT  UPDATE PREMIUM", updatePremiumData);
              resolve(true)

            }
            resolve(true)
          } else {
            console.log("DEPENDANT NOT CREATED", dependant);
            resolve(true)
          }
        }, 1000 * i); // Adjust the delay as needed
      });

    } else {
      console.log("NO ARR MEMBER or Member with same name and dob already exists!")
    }
  }
}

return updatedPremium
}



async function getMemberNumberData(mobileNumber) {
  const url = 'http://airtelapi.aar-insurance.ug:82/api/airtel/v1/protected/member_number_data';
  console.log("mobileNumber", mobileNumber)
  let result = {
    code: 400,
    message: "Member not found"
  } 

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${await arr_uganda_login()}`,
  };

  const data = {
    mobile_no: `${mobileNumber}`,
  };
  try {
    const response = await axios.post(url, data, { headers });
    
    console.log(" GET MEMBER RESPONSE DATA", response.data);
    // You can access the response data using response.data
   
    if(response.data.code == 200){
      // remove 256 from the phone number
      await db.users.update({ arr_member_number: response.data.member_no }, { where: { phone_number: mobileNumber.substring(3) } });
      return response.data;
    }else{
      return result
    }


  } catch (error) {
    // Handle errors
    console.error(error.message);
    throw error;
  }
}


export { registerPrincipal, registerDependant, renewMember, updateMember, fetchMemberStatusData, updatePremium, createDependant, processPolicy, reconciliation, getMemberNumberData };
