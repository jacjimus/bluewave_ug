const { Sequelize, DataTypes } = require('sequelize')
import { v4 as uuidv4 } from 'uuid'
const { Op, QueryTypes } = require("sequelize");
import cron from 'node-cron';
import { fetchMemberStatusData, registerDependant, registerPrincipal, updatePremium } from '../services/aar';
import SMSMessenger from '../services/sendSMS';


require('dotenv').config()
const fs = require('fs/promises'); // Use promises-based fs


const Agenda = require('agenda');


const sequelize = new Sequelize(process.env.DB_URL, { dialect: "postgres" })

//checking if connection is done
sequelize.authenticate().then(() => {
  console.log(`Database connected to Bluewave! time: ${new Date()}`)
}).catch((err) => {
  console.log(err)
})

export const db: any = {}
db.Sequelize = Sequelize
db.sequelize = sequelize

//connecting to model
db.users = require('./User')(sequelize, DataTypes)
db.policies = require('./Policy')(sequelize, DataTypes)
db.claims = require('./Claim')(sequelize, DataTypes)
db.payments = require('./Payment')(sequelize, DataTypes)
db.sessions = require('./Session')(sequelize, DataTypes)
db.beneficiaries = require('./Beneficiary')(sequelize, DataTypes)
db.partners = require('./Partner')(sequelize, DataTypes)
db.products = require('./Product')(sequelize, DataTypes)
db.logs = require('./Log')(sequelize, DataTypes)
db.transactions = require('./Transaction')(sequelize, DataTypes)
db.installments = require('./Installment')(sequelize, DataTypes)
db.user_hospitals = require('./UserHospital')(sequelize, DataTypes)
db.hospitals = require('./Hospital')(sequelize, DataTypes)
db.hospitals_kenya = require('./HospitalKenya')(sequelize, DataTypes)
db.policy_schedules = require('./PolicySchedule')(sequelize, DataTypes)


db.users.hasMany(db.policies, { foreignKey: 'user_id' });
db.policies.belongsTo(db.users, { foreignKey: 'user_id' });

// const agenda = new Agenda({
//   db: { instance: db, collection: 'beneficiaries' }, // Replace 'agendaJobs' with your table name
// });
//449 priincipal
// policy 535

// Your actual code
const updatePolicies = () => {
  db.sync() // This ensures that the tables are created before running the queries
    .then(() => {
      return db.payments.findAll({
        where: {
          payment_status: 'paid',
        },
      });
    })
    .then((payments) => {
      return Promise.all(
        payments.map((payment) => {
          return db.policies.findAll({
            where: {
              policy_id: payment.policy_id,
              policy_status: 'paid',
            },
          })
            .then((policies) => {
              return db.users.update(
                { number_of_policies: policies.length },
                { where: { user_id: payment.user_id } }
              );
            })
            .catch((err) => {
              console.log(err);
            });
        })
      );
    })
    .catch((err) => {
      console.log(err);
    });
};




// // // Define a function to create the dependent
async function createDependant(existingUser: any, myPolicy: any) {
  try {

    let arr_member: any;
    let dependant: any;
    let number_of_dependants = parseFloat(myPolicy?.total_member_number?.split("")[2]) || 0;
    console.log("number_of_dependants ", number_of_dependants)

    const updatePremiumPromise = updatePremium(existingUser, myPolicy);
    const timeoutPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error("Timeout: The updatePremium process took too long"));
      }, 10000); // Adjust the timeout duration (in milliseconds) as needed
    });

    try {
      const result = await Promise.race([updatePremiumPromise, timeoutPromise]);

      if (result.code == 200) {
        console.log("AAR UPDATE PREMIUM", result);
      } else {
        console.log("AAR NOT UPDATE PREMIUM", result);
      }
    } catch (error) {
      console.error("AAR UPDATE PREMIUM timed out or encountered an error:", error.message);
    }




    if (existingUser.arr_member_number == null) {
      console.log("REGISTER PRINCIPAL");
      // Introduce a delay before calling registerPrincipal
      await new Promise(resolve => {
        setTimeout(async () => {
          arr_member = await registerPrincipal(existingUser, myPolicy);
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
          if (number_of_dependants > 0) {

            for (let i = 1; i <= number_of_dependants; i++) {
              let dependant_first_name = `first_name__${existingUser.membership_id}_${i}`;
              let dependant_other_names = `other_names__${existingUser.membership_id}_${i}`;
              let dependant_surname = `surname__${existingUser.membership_id}_${i}`;

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
                console.log("NO ARR MEMBER")
              }
            }
          } else {
            let updatePremiumData = await updatePremium(existingUser, myPolicy);
            if (updatePremiumData.code == 200) {
              console.log("AAR UPDATE PREMIUM", updatePremiumData);
              resolve(true)
            } else {
              console.log("AAR NOT  UPDATE PREMIUM", updatePremiumData);
              resolve(true)
            }
          }
          resolve(true);

        }, 1000); // Adjust the delay as needed (1 second in this example)
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}





// get all user with arr_member_number is null and partner_id = 2 and email is  null
async function getAllUsers() {

  let policies = await db.policies.findAll({
    where: {
      policy_status: 'paid',
      //installment_type: 2
    }
  });

  if (!policies) {
    throw new Error("NO POLICY FOUND");
  }


  async function processUsers() {
    for (const policy of policies) {
      try {
        const user = await db.users.findOne({
          where: {
            // arr_member_number: {
            //   [db.Sequelize.Op.not]: null,
            // },
            partner_id: 2,
            user_id: policy.user_id,
          },
        });


        if (!user) {
          console.log("NO USER FOUND");
          continue
        }

        console.log("user", user.phone_number);
        await createDependant(user, policy);
        console.log(`Dependant created for user with phone number: ${user.phone_number}`);
      } catch (error) {
        console.error(`Error creating dependant for user with phone number ${policy.phone_number}:`, error);
      }
    }
  }

  try {
    await processUsers();
    console.log("All dependants created successfully.");
  } catch (err) {
    console.error("Error processing users:", err);
  }
}

// Call the function to start the process
//getAllUsers();


let payment_amount = [
10000,
208000,
14000,
10000,
18000,
10000,
10000,
18000,
14000,
14000,
10000,
14000,
40000,
14000,
10000,
10000,
18000,
10000,
10000,
10000,
10000,
10000,
10000,
10000,
10000,
14000,
10000,
10000,
10000,
14000,
10000,
10000,
10000,
10000,
]

let payment_numbers = [
  701565319,
707886771,
700993744,
703695296,
757728878,
701106857,
754177440,
700787003,
702559647,
759750610,
709011694,
707420393,
751754051,
742877919,
755941923,
700456469,
707609316,
759916803,
702906710,
754008281,
707320708,
754416580,
759015513,
702790183,
707121789,
701072656,
702029927,
700787848,
759203499,
742316854,
742316854,
759074907,
709247131,
700659605,
]
// let combinedPayments = payment_numbers.map((phoneNumber, index) => {
//   return {
//     phone_number: phoneNumber,
//     amount: payment_amount[index],
//   };
// });

 // console.log("Combined Payments:", combinedPayments);
// //write this  to a file
// fs.writeFile('payments.json', JSON.stringify(combinedPayments))
//   .then(() => {
//     console.log('File written successfully');
//   })
//   .catch((err: any) => {
//     console.error('Error writing file:', err);
//   });






async function allPaidPolicies() {
  try {
    let allPaidPolicies = await db.policies.findAll({
      where: {
        policy_status: 'paid',
        partner_id: 2,
        arr_policy_number: null,
      },
      include: [
        {
          model: db.users,
          as: 'user',
        },
      ],
    });

    async function processPolicy(policy) {
      const policy_start_date = policy.policy_start_date;
      const policy_end_date = policy.policy_end_date;
      policy.policy_start_date = policy_start_date;
      policy.policy_end_date = policy_end_date;

      const arr_member = await registerPrincipal(policy.user, policy);
      console.log('arr_member', arr_member);
    }

    async function processPoliciesSequentially() {
      for (const policy of allPaidPolicies) {
        await processPolicy(policy);
        // Wait for 2 seconds before processing the next policy
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Start processing policies
    await processPoliciesSequentially();

    return 'done';
  } catch (err) {
    console.error('Error:', err);
    return 'error';
  }
}

//allPaidPolicies()

async function updatePremiumArr() {
  try {
    let allPaidPolicies = await db.policies.findAll({
      where: {
        policy_status: 'paid',
        partner_id: 2,

      },
      include: [
        {
          model: db.users,
          as: 'user',
        },
      ],
    });

    async function processPolicy(policy) {
      const policy_start_date = policy.policy_start_date;
      const policy_end_date = policy.policy_end_date;
      policy.policy_start_date = policy_start_date;
      policy.policy_end_date = policy_end_date;

      const arr_member = await updatePremium(policy.user, policy);
      console.log('arr_member', arr_member);
    }

    async function processPoliciesSequentially() {
      for (const policy of allPaidPolicies) {
        await processPolicy(policy);
        // Wait for 2 seconds before processing the next policy
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Start processing policies
    await processPoliciesSequentially();

    return 'done';
  } catch (err) {
    console.error('Error:', err);
    return 'error';
  }
}

let combinedPayments = [
  { "phone_number": 701565319, "amount": 10000 },
  { "phone_number": 707886771, "amount": 208000 },
  { "phone_number": 700993744, "amount": 14000 },
  { "phone_number": 703695296, "amount": 10000 },
  { "phone_number": 757728878, "amount": 18000 },
  { "phone_number": 701106857, "amount": 10000 },
  { "phone_number": 754177440, "amount": 10000 },
  { "phone_number": 700787003, "amount": 18000 },
  { "phone_number": 702559647, "amount": 14000 },
  { "phone_number": 759750610, "amount": 14000 },
  { "phone_number": 709011694, "amount": 10000 },
  { "phone_number": 707420393, "amount": 14000 },
  { "phone_number": 751754051, "amount": 40000 },
  { "phone_number": 742877919, "amount": 14000 },
  { "phone_number": 755941923, "amount": 10000 },
  { "phone_number": 700456469, "amount": 10000 },
  { "phone_number": 707609316, "amount": 18000 },
  { "phone_number": 759916803, "amount": 10000 },
  { "phone_number": 702906710, "amount": 10000 },
  { "phone_number": 754008281, "amount": 10000 },
  { "phone_number": 707320708, "amount": 10000 },
  { "phone_number": 754416580, "amount": 10000 },
  { "phone_number": 759015513, "amount": 10000 },
  { "phone_number": 702790183, "amount": 10000 },
  { "phone_number": 707121789, "amount": 10000 },
  { "phone_number": 701072656, "amount": 14000 },
  { "phone_number": 702029927, "amount": 10000 },
  { "phone_number": 700787848, "amount": 10000 },
  { "phone_number": 759203499, "amount": 10000 },
  { "phone_number": 742316854, "amount": 14000 },
  { "phone_number": 742316854, "amount": 10000 },
  { "phone_number": 759074907, "amount": 10000 },
  { "phone_number": 709247131, "amount": 10000 },
  { "phone_number": 700659605, "amount": 10000 }
]


let policies = [];
// Function to handle errors during database operations
const handleDbError = (error, phoneNumber, amount) => {
  console.error(`Error processing payment (${phoneNumber}, ${amount}):`, error);

  // Save the phone_number and amount to a file
  const errorLog = {
    phone_number: phoneNumber,
    amount: amount,
    error: error.message,
  };

  fs.writeFile('error_log.json', JSON.stringify(errorLog), { flag: 'a' })
    .then(() => console.log('Error logged to file'))
    .catch((writeError) => console.error('Error writing error log to file:', writeError));
};

// Process combinedPayments array with delays
const processPayments = async () => {
  for (const payment of combinedPayments) {
    try {
      let user = await db.users.findOne({
        where: {
          phone_number: payment.phone_number.toString(),
        },
      });

      let userPolicies = await db.policies.findAll({
        where: {
          user_id: user.user_id,// Handle the case where user is not found
          premium: payment.amount,
        },
      });

      // Add the policies for the current user to the overall policies array
      policies.push(...userPolicies);
    } catch (error) {
      // Handle errors during database operations
      handleDbError(error, payment.phone_number, payment.amount);
    }
  }
};

// Process payments with delays
processPayments()
  .then(async () => {
    // Update policy_status to paid for policies with delays
    for (const policy of policies) {
      try {
        // Update policy_status to 'paid' for policies
        console.log("POLICY", policy.phone_number);
        await db.policies.update(
          { policy_status: 'paid' },
          { where: { policy_id: policy.policy_id } }
        );

        // Update payment_status to 'paid' for corresponding payments
        await db.payments.update(
          { payment_status: 'paid' },
          { where: { policy_id: policy.policy_id } }
        );

        // Add a delay between updates
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1000ms delay (adjust as needed)
      } catch (error) {
        // Handle errors during database updates
        handleDbError(error, policy.phone_number, policy.amount);
      }
    }
  })
  .then(async () => {
    // Write the policies to a file with a delay
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1000ms delay (adjust as needed)
    await fs.writeFile('all_paid_policies.json', JSON.stringify(policies));
    console.log('File written successfully');
  })
  .catch((error) => {
    console.error("Error processing payments:", error);
  });


// let policies_not_counted_for = [];

// db.policies.findAll({
//   where: {
//     policy_status: 'paid',
//   },
// }).then((policies: any) => {
//   // Function to update a policy with a delay
//   const updatePolicyWithDelay = async (policy: any) => {
//     let policyObj = {
//       phone_number: policy.phone_number,
//       amount: policy.premium,
//     };

//     if (!combinedPayments.includes(policyObj)) {
//       await db.policies.update(
//         { policy_status: 'pending' },
//         { where: { policy_id: policy.policy_id } }
//       );
//       policies_not_counted_for.push(policyObj);
//     }
//   };

//   // Set a delay of 1000 milliseconds (1 second) between updates
//   const delay = 1000;

//   // Iterate through policies with a delay
//   policies.forEach((policy: any, index: number) => {
//     setTimeout(() => {
//       updatePolicyWithDelay(policy);
//     }, index * delay);
//   });
// });


// updatePremiumArr()

// update number_of_policies in users table with the number of paid policies a user has
// db.users.findAll(
//   {
//     where: {
//        arr_member_number: {
//           [Op.ne]: null
//         },
//     }
//   }
// ).then((user: any) => {
//   user.forEach((user: any) => {
//     db.policies.findAll({
//       where: {
//         user_id: user.user_id,
//         policy_status: 'paid'
//       }
//     }).then((policy: any) => {

//       db.users.update(
//         { number_of_policies: policy.length },
//         { where: { user_id: user.user_id } }
//       )
//     }).catch((err: any) => {
//       console.log(err)
//     })
//   })

// }
// ).catch((err: any) => {
//   console.log(err)
// })




// get all paid installments  per unique policy_id and sum the amount paid
// db.policies.findAll(
//   {
//     where: {
//       policy_status: 'paid'
//     }
//   }
// ).then((policy: any) => {
//   let total = 0
//   policy.forEach((policy: any) => {
//     db.installments.findAll({
//       where: {
//         policy_id: policy.policy_id,
//       }
//     }).then((installment: any) => {
//       installment.forEach((installment: any) => {
//         total += installment.premium
//   console.log('TOTAL', total);

//       })
//     }).catch((err: any) => {
//       console.log(err)
//     })
//   })
//   console.log('TOTAL', total);

// }
// ).catch((err: any) => {
//   console.log(err)
// })



// RENEWAL
async function sendPolicyAnniversaryReminders() {
  const query = `
    SELECT *
    FROM policies
    WHERE 
      DATE_PART('year', policy_start_date) = DATE_PART('year', CURRENT_DATE)
      AND DATE_PART('month', policy_start_date) = DATE_PART('month', CURRENT_DATE)
      AND EXTRACT(DAY FROM policy_start_date) = EXTRACT(DAY FROM CURRENT_DATE) - 3
      AND policy_status = 'paid'
      AND partner_id = 2`;

  const policies = await db.sequelize.query(query, { type: QueryTypes.SELECT });

  console.log("POLICIES", policies.length);

  policies.forEach(async (policy) => {
    const { policy_start_date, premium, policy_type, phone_number, beneficiary } = policy;

    const message = `Your monthly premium payment for ${beneficiary} ${policy_type} Medical cover of UGX ${premium} is DUE in 3-days on ${policy_start_date.toDateString()}.`;

    console.log("MESSAGE", message);

    // Call the function to send an SMS
    await SMSMessenger.sendSMS(phone_number, message);
  });

  return policies;
}


// Call the function to send policy anniversary reminders
//sendPolicyAnniversaryReminders();
// Schedule the updatePolicies function to run every hour
// cron.schedule('0 * * * *', () => {
//   console.log('Running updateUserPolicies...');
//   updatePolicies();
//   console.log('Done.');
// });



module.exports = { db }

