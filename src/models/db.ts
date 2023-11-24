const { Sequelize, DataTypes } = require('sequelize')
import { v4 as uuidv4 } from 'uuid'
import cron from 'node-cron';
import { fetchMemberStatusData, registerDependant, registerPrincipal, updatePremium } from '../services/aar';

require('dotenv').config()
const fs = require('fs/promises'); // Use promises-based fs
const { Op } = require('sequelize');

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

// Schedule the updatePolicies function to run every hour
// cron.schedule('0 * * * *', () => {
//   console.log('Running updateUserPolicies...');
//   updatePolicies();
//   console.log('Done.');
// });


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
    }else{
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
                    } else{
                      console.log("AAR NOT  UPDATE PREMIUM", updatePremiumData);
                      resolve(true)

                    }
                    resolve(true)
                  }else{
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
          }else{
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
            arr_member_number: {
              [db.Sequelize.Op.not]: null,
            },
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



// let payment_data =[
//   { "phone_number": 707435246, "amount": 10000 },
//   { "phone_number": 751049130, "amount": 208000 },
//   { "phone_number": 706221424, "amount": 10000 },
//   { "phone_number": 756256667, "amount": 10000 },
//   { "phone_number": 752004558, "amount": 10000 },
//   { "phone_number": 741921576, "amount": 10000 },
//   { "phone_number": 753881127, "amount": 18000 },
//   { "phone_number": 704054344, "amount": 18000 },
//   { "phone_number": 752261049, "amount": 10000 },
//   { "phone_number": 740733972, "amount": 10000 },
//   { "phone_number": 755066981, "amount": 10000 },
//   { "phone_number": 709964362, "amount": 10000 },
//   { "phone_number": 753961676, "amount": 14000 },
//   { "phone_number": 703232255, "amount": 10000 },
//   { "phone_number": 752124320, "amount": 18000 },
//   { "phone_number": 744029899, "amount": 10000 },
//   { "phone_number": 757130372, "amount": 10000 },
//   { "phone_number": 743566845, "amount": 10000 },
//   { "phone_number": 708717752, "amount": 120000 },
//   { "phone_number": 758122393, "amount": 18000 },
//   { "phone_number": 700408523, "amount": 10000 },
//   { "phone_number": 706417423, "amount": 10000 },
//   { "phone_number": 706977279, "amount": 18000 },
//   { "phone_number": 708127676, "amount": 10000 },
//   { "phone_number": 704218308, "amount": 108000 },
//   { "phone_number": 759349269, "amount": 10000 },
//   { "phone_number": 756770737, "amount": 18000 },
//   { "phone_number": 753081661, "amount": 10000 },
//   { "phone_number": 742493662, "amount": 10000 },
//   { "phone_number": 701046300, "amount": 10000 },
//   { "phone_number": 704327265, "amount": 10000 },
//   { "phone_number": 701915814, "amount": 18000 },
//   { "phone_number": 703414915, "amount": 18000 },
//   { "phone_number": 744706599, "amount": 10000 },
//   { "phone_number": 701611993, "amount": 10000 },
//   { "phone_number": 709199151, "amount": 10000 },
//   { "phone_number": 700480272, "amount": 14000 },
//   { "phone_number": 709171407, "amount": 20000 },
//   { "phone_number": 700825044, "amount": 18000 },
//   { "phone_number": 756611025, "amount": 18000 },
//   { "phone_number": 705406897, "amount": 10000 },
//   { "phone_number": 709641543, "amount": 10000 },
//   { "phone_number": 756613732, "amount": 18000 },
//   { "phone_number": 743711785, "amount": 10000 },
//   { "phone_number": 709060253, "amount": 10000 },
//   { "phone_number": 709211649, "amount": 14000 },
//   { "phone_number": 753407715, "amount": 10000 },
//   { "phone_number": 709104617, "amount": 10000 },
//   { "phone_number": 704977612, "amount": 10000 },
//   { "phone_number": 755450017, "amount": 10000 },
//   { "phone_number": 753162332, "amount": 10000 },
//   { "phone_number": 701101451, "amount": 18000 },
//   { "phone_number": 758925177, "amount": 10000 },
//   { "phone_number": 753066923, "amount": 10000 },
//   { "phone_number": 759315147, "amount": 18000 },
//   { "phone_number": 752306916, "amount": 10000 },
//   { "phone_number": 741952443, "amount": 14000 },
//   { "phone_number": 704674642, "amount": 40000 },
//   { "phone_number": 756111390, "amount": 10000 }
// ]


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

// let policies = [];

// Promise.all(payment_data.map(async (payment) => {
//   let user = await db.users.findOne({
//     where: {
//       phone_number: payment.phone_number.toString(),
//     },
//   });

//   let userPolicies = await db.policies.findAll({
//     where: {
//       user_id: user.user_id,
//       policy_status: 'paid',
//       premium: payment.amount
      
//     },
//   });

//   // Add the policies for the current user to the overall policies array
//   policies.push(...userPolicies);
// }))
//   .then(async() => {
//     console.log("POLICIES", policies);
// // update policy_status to paid for policies 
//   // Use Promise.all to update policy and payment statuses simultaneously
//   await Promise.all(policies.map(async (policy) => {
//     // Update policy_status to 'paid' for policies
//     await db.policies.update(
//       { policy_status: 'paid' },
//       { where: { policy_id: policy.policy_id } }
//     );

//     // Update payment_status to 'paid' for corresponding payments
//     await db.payments.update(
//       { payment_status: 'paid' },
//       { where: { policy_id: policy.policy_id } }
//     );
//   }));
//     // Write the policies to a file
//     fs.writeFile('policies.json', JSON.stringify(policies))
//       .then(() => {
//         console.log('File written successfully');
//       })
//       .catch((err) => {
//         console.error('Error writing file:', err);
//       });
//   })
//   .catch((error) => {
//     console.error("Error fetching policies:", error);
//   });



// // Schedule the job to run after 300 minutes (5 hours)
// agenda.schedule('in 3 minutes', 'create_dependant');

// // Start the Agenda instance
// (async () => {
//   console.log('Starting agenda instance...');
//   await agenda.start();
// })();


//delete column bemeficiary_id from transactions table
//db.transactions.removeAttribute('beneficiary_id')

//insert a test pdf to policy table, colunm policy_documents which id jsonb[]
// db.policies.update(
//     { policy_documents: [{ name: "policy document", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" }] },
//     { where: { partner_id: 3 } }
// )

// add column policy_pending_premium to policy table 

//get policy by policy_id  policy_id ='6b586c01-d3d9-4870-8ee7-0ea543dc8501'
// db.policies.findAll({
//     // where: {
//     //   policy_id: 'eba7ad59-3277-444d-a8ba-c5c3108c07ac'
//     // }
//   }).then((policy:any) => {
//     console.log("POLICY: ", policy)

//   }).catch((err:any) => {
//     console.log(err)
//   })

//   db.transactions.findAll({
//     // where: {
//     //   policy_id: 'eba7ad59-3277-444d-a8ba-c5c3108c07ac'
//     // }
//   }).then((transaction:any) => {
//     console.log("TRANSACTIONS: ", transaction)

//   }).catch((err:any) => {
//     console.log(err)
//   })

//update users table column number_of_policies with the number of policies a user has
// db.users.findAll().then((user: any) => {
//   user.forEach((user: any) => {
//     db.policies.findAll({
//       where: {
//         user_id: user.user_id
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

// }).catch((err: any) => {
//   console.log(err)
// })

//update installment_order for policies with multiple installments
// db.policies.findAll().then((policy: any) => {
//   policy.forEach((policy: any) => {
//     db.installments.findAll({
//       where: {
//         policy_id: policy.policy_id,

//       }
//     }).then((installment: any) => {
//       let installmentOrder = 0
//       installment.forEach((installment: any) => {
//         installmentOrder += 1
//         db.policies.update(
//           { installment_order: installmentOrder },
//           {
//             where: { policy_id: policy.policy_id,  policy_status: 'paid' }
//           }
//         )

//       })
//     }).catch((err: any) => {
//       console.log(err)
//     })
//   })
// }).catch((err: any) => {
//   console.log(err)
// })






//update pending premium for policies
//   db.policies.findAll().then((policy:any) => {
//     console.log("POLICY: ", policy)
//    policy.forEach((policy:any) => {
//     db.transactions.findAll({
//         where: {
//           policy_id: policy.policy_id
//         }
//       }).then((transaction:any) => {
//         console.log("TRANSACTIONS: ", transaction)
//         let pendingPremium = 0
//         transaction.forEach((transaction:any) => {
//             pendingPremium += transaction.amount
//         })
//         db.policies.update(
//             { policy_pending_premium: pendingPremium },
//             { where: { policy_id: policy.policy_id } }
//         )
//       }).catch((err:any) => {
//         console.log(err)
//       })
//    })
//   }).catch((err:any) => {
//     console.log(err)
//   })


// const selectedPolicy = await db.policies.findOne({
//   where: {
//     policy_id: policy_id
//   }
// })
// console.log('POLICY', selectedPolicy);

// if(selectedPolicy.policy_status == 'paid' && selectedPolicy.policy_paid_amount == selectedPolicy.premium){
//   console.log('POLICY ALREADY PAID FOR');
//    // create installment
//    await db.installments.create({
//     installment_id: uuidv4(),
//     policy_id: selectedPolicy.policy_id,
//     installment_order: selectedPolicy.installment_order,
//     installment_date: new Date(),
//     installment_alert_date: new Date(),
//     tax_rate_vat: selectedPolicy.tax_rate_vat,
//     tax_rate_ext: selectedPolicy.tax_rate_ext,
//     premium: selectedPolicy.premium,
//     sum_insured: selectedPolicy.sum_insured,
//     excess_premium: selectedPolicy.excess_premium,
//     discount_premium: selectedPolicy.discount_premium,
//     currency_code: selectedPolicy.currency_code,
//     country_code: selectedPolicy.country_code,
//   });

// }

// delete users with user_id a1a3721d-18f8-4fd9-baca-0c1de553d182 and 5c7ae55c-76bf-43b7-979e-5fc16bfaab43
// db.users.destroy({
//     where: {
//       user_id: '5c7ae55c-76bf-43b7-979e-5fc16bfaab43'
//     }
//   }).then((user:any) => {
//     console.log("DELETED USER: ", user)

//   }).catch((err:any) => {
//     console.log(err)
//   })






//syncing the model
// sequelize.sync().then(() => {
//   console.log(`Database & tables created! time: ${new Date()}`)
// }).catch((err) => {
//   console.log(err)
// })


//clear the arr_member_number column in users table
//  db.users.update(
//     { arr_member_number: null },{where :{partner_id: 2}},{ multi: true }
//   ).then((user:any) => {
//     console.log("UPDATED USER: ", user)

//   }
//   ).catch((err:any) => {
//     console.log(err)
//   })

// get all users with policy_status == "paid" in polices table and no arr_member_number and partner_id = 2


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

// get all paid trnasactions and sum the amount paid

// db.transactions.findAll(
//   {
//     where: {
//       status: 'paid'
//     }
//   }
// ).then((transaction: any) => {
//   let total = 0
//   transaction.forEach((transaction: any) => {
//     total += transaction.amount
//   })
//   console.log('TOTAL', total);

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


module.exports = { db }

