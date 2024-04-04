export function isValidKenyanPhoneNumber(phoneNumber: string) {
  const kenyanPhoneNumberRegex = /^(\+?254|0)[17]\d{8}$/;
  return kenyanPhoneNumberRegex.test(phoneNumber);
}


export function getRandomInt(min: any, max: any) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function globalSearch(array: any, searchTerm: any) {
  console.log("SEARCH TERM", searchTerm);
  //console.log("ARRAY", array);

  // Convert the searchTerm to lowercase for case-insensitive search
  const search = searchTerm.toLowerCase();

  // Use the filter() method to find objects matching the search term
  const results = array.filter((item) => {

    // Spread all object fields into the ITEM
    const ITEM = { ...item.dataValues, ...item?.user?.dataValues, ...item?.policy?.dataValues };

    //console.log("ITEM", ITEM);
    // Combine all object values into a single string for searching
    const objectValues = Object.values(ITEM).join(' ').toLowerCase();

    return objectValues.includes(search);
  });

  return results;
}


export function generateQuotationNumber(date: Date, uniqueIdentifier: number) {
  // Format the date as YYYYMMDD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const formattedDate = `${year}${month}${day}`;

  // Combine the date and unique identifier to create the quotation number
  const quotationNumber = `Q${formattedDate}${uniqueIdentifier}`;

  return quotationNumber;
}

//   // Example usage:
// const quotationNumber = "Q20230522100007-00";
// const policyNumber = generatePolicyNumber(quotationNumber);
// console.log(policyNumber); // Output: "P20230522-00007"


export function generatePolicyNumber(quotationNumber: any) {
  // Assuming the quotation number format is "QYYYYMMDDXXXXX-YY" where XXXXX is a number
  // Extract the date part (YYYYMMDD) from the quotation number
  const datePart = quotationNumber.substring(1, 9);

  // Extract the numeric part (XXXXX) from the quotation number and convert it to a number
  const numericPart = parseInt(quotationNumber.substring(10, 15), 10);

  // Generate a policy number by adding a prefix and a unique numeric part (e.g., 00)
  const policyNumber = `P${datePart}-${String(numericPart).padStart(5, '0')}`;

  return policyNumber;
}

// // Example usage:
// const quotationNumber = "Q20230522100007-00";
// const policyNumber = generatePolicyNumber(quotationNumber);
// console.log(policyNumber); // Output: "P20230522-00007"
export function generateClaimId() {
  const timestamp = new Date().getTime(); // Get current timestamp in milliseconds
  const randomNum = Math.floor(Math.random() * 10000); // Generate a random number between 0 and 9999 (adjust the range as needed)

  // Combine timestamp and random number to create the claim ID
  const claimId = `CLAIM-${timestamp}-${randomNum}`;

  return claimId;
}
export function calculatePaymentOptions(policyType: string, paymentOption: number) {
  let period, installmentType, sumInsured, premium;

  console.log("POLICY TYPE", policyType);

  if (policyType === "S MINI") {
    period = "yearly";
    installmentType = 1;
    sumInsured = 750000;
    premium = 60000;

    if (paymentOption === 1) {
      period = "monthly";
      premium = 5000;
      installmentType = 2;
    }
  } else if (policyType === "MINI") {
    period = "yearly";
    installmentType = 1;
    sumInsured = 1500000;
    premium = 120000;

    if (paymentOption === 1) {
      period = "monthly";
      premium = 10000;
      installmentType = 2;
    }
  } else if (policyType === "MIDI") {
    period = "yearly";
    installmentType = 1;
    sumInsured = 3000000;
    premium = 167000;

    if (paymentOption === 1) {
      period = "monthly";
      premium = 14000;
      installmentType = 2;
    }
  } else if (policyType === "BIGGIE") {
    period = "yearly";
    installmentType = 1;
    sumInsured = 5000000;
    premium = 208000;

    if (paymentOption === 1) {
      period = "monthly";
      premium = 18000;
      installmentType = 2;
    }

  } else {
    return {}
  }


  return { period, installmentType, sumInsured, premium };
}

export function calculatePaymentOptionsKenya(policyType: string, paymentOption: number) {
  let period, installmentType, sumInsured, premium, inPatient, outPatient, maternity, hospitalCash;

  console.log("POLICY TYPE", policyType);


  if (policyType === "BAMBA") {
    period = "yearly";
    installmentType = 1;
    inPatient = 0;
    outPatient = 0;
    maternity = 0;
    hospitalCash = 4500;

    if (paymentOption === 1) {
      period = "monthly";
      premium = 3294
      installmentType = 2;
    }

    sumInsured = 0;
    premium = 300
  }


  if (policyType === "ZIDI") {
    period = "yearly";
    installmentType = 1;

    inPatient = 300000;
    outPatient = 0;
    maternity = 100000;

    if (paymentOption === 1) {
      period = "monthly";
      premium = 650;
      installmentType = 2;
    }
    premium = 7140;
    sumInsured = 0;
    hospitalCash = 0;

  }


  if (policyType === "SMARTA") {
    period = "yearly";
    installmentType = 1;

    inPatient = 400000;
    outPatient = 30000;
    maternity = 100000;
    hospitalCash = 0;

    if (paymentOption === 1) {
      period = "monthly";
      premium = 1400;
      installmentType = 2;
    }

    sumInsured = 0;
    premium = 15873;
  }



  return { period, installmentType, sumInsured, premium, hospitalCash, inPatient, outPatient, maternity };
}


export const parseAmount = (amount) => {
  // Remove commas and any trailing white spaces
  amount = amount.replace(/,/g, "").trim();

  if (amount.includes("M")) {
    // Check if it's in millions (e.g., 1.5M)
    const parts = amount.split("M");
    if (parts.length === 2) {
      const wholePart = parseInt(parts[0]);
      const decimalPart = parseFloat(`0.${parts[1]}`);
      return (wholePart + decimalPart) * 1000000;
    }
  } else if (amount.includes("K")) {
    // Check if it's in thousands (e.g., 3500K or 3.5M)
    const parts = amount.split("K");
    if (parts.length === 2) {
      const wholePart = parseInt(parts[0]);
      const decimalPart = parseFloat(`0.${parts[1]}`);
      return (wholePart + decimalPart) * 1000;
    }
  } else {
    // Handle other formats, like plain integers
    return parseInt(amount);
  }
  return NaN; // Return NaN for unsupported formats
}

export const formatAmount = (number: number) => {
  const formattedNumber = (number / 1000000).toFixed(1);
  return formattedNumber + "M";
}


export const calculateProrationPercentage = (installments: number) => {
  if (installments >= 1 && installments <= 3) {
    return 10;
  } else if (installments >= 4 && installments <= 6) {
    return 40;
  } else if (installments >= 7 && installments <= 9) {
    return 60;
  } else if (installments >= 10 && installments <= 11) {
    return 80;
  } else if (installments === 12) {
    return 100;
  } else {
    return 10;
  }
}

// export const formatPhoneNumber = (phoneNumber) => {
//   if (phoneNumber.startsWith("7")) {
//     return `+256${phoneNumber}`;
//   } else if (phoneNumber.startsWith("0")) {
//     return `+256${phoneNumber.substring(1)}`;
//   } else if (phoneNumber.startsWith("+")) {
//     return phoneNumber;
//   } else {
//     return `+256${phoneNumber}`;
//   }
// };

// fileFilter.js
export const excelFilter = (req: any, file, cb) => {
  if (
    file.mimetype.includes("excel") ||
    file.mimetype.includes("spreadsheetml") ||
    file.mimetype.includes("xls") ||
    file.mimetype.includes("xlsx")
  ) {
    cb(null, true);
  } else {
    cb("Please upload only excel files.", false);
  }
};

export const isInRange = (value, rangeStart, rangeEnd) => {
  return value >= rangeStart && value <= rangeEnd;
};


export function calculatePremium(
  vehiclePremiums,
  vehicle_category,
  vehicle_type,
  vehicle_cv,
  vehicle_tonnage,
  vehicle_number_of_passengers,
  is_fleet) {

  console.log('vehiclePremiums', vehiclePremiums)
  console.log('vehicle_category', vehicle_category)
  console.log('vehicle_type', vehicle_type)
  console.log('vehicle_cv', vehicle_cv)
  console.log('vehicle_tonnage', vehicle_tonnage)
  console.log('vehicle_number_of_passengers', vehicle_number_of_passengers)
  console.log('is_fleet', is_fleet)



  let categoryOne =vehicle_category = vehicle_category.toUpperCase();
  vehicle_type = vehicle_type?.toUpperCase() || "";

  // Parse vehicle_cv to a numeric value
  let vehicleCV = parseInt(vehicle_cv);
  console.log('vehicleCV', vehicleCV)
  console.log("vehicle_category", vehicle_category)
  console.log("vehicle_type", vehicle_type)
  console.log("number of passengers", vehicle_number_of_passengers)
  console.log("vehicle_tonnage", vehicle_tonnage)

  // Calculate premium based on vehicle details
  let premium = 0, message = "Premium calculated successfully";
  if (["CAR", "JEEP", "PICKUP"].includes(vehicle_category)) {
    console.log('categoryOne', categoryOne)
    if (
      (vehicle_type === "PRIVATE" || vehicle_type === "CORPORATE") &&
      vehicleCV
    ) {
      switch (true) {
        case vehicleCV >= 0 && vehicleCV < 10:
          premium = vehiclePremiums["CAR_JEEP_PICKUP"][vehicle_type]["0-9 CV"];
          break;
        case vehicleCV >= 10 && vehicleCV < 14:
          console.log(vehiclePremiums[vehicle_category])
          premium = vehiclePremiums['CAR_JEEP_PICKUP'][vehicle_type]["10-13 CV"];
          break;
        case vehicleCV >= 14 && vehicleCV < 18:
          premium = vehiclePremiums["CAR_JEEP_PICKUP"][vehicle_type]["14-17 CV"];
          break;
        case vehicleCV >= 18:
          premium = vehiclePremiums['CAR_JEEP_PICKUP'][vehicle_type]["18+"];
          break;
        default:

          message = "Invalid vehicle_cv range."

      }
    }

    // Additional logic for CORPORATE category with specific passenger counts
    if (vehicle_type === "CORPORATE" && vehicle_number_of_passengers) {
      switch (vehicle_number_of_passengers) {
        case vehicle_number_of_passengers <= 15:
          premium = vehiclePremiums['CAR_JEEP_PICKUP'][vehicle_type]["Bus_Minibus_Minivan_15"];
          break;
        case vehicle_number_of_passengers >= 16 && vehicle_number_of_passengers <= 30:
          premium = vehiclePremiums['CAR_JEEP_PICKUP'][vehicle_type]["Bus_Minibus_Minivan_16-30"];
          break;
        case vehicle_number_of_passengers >= 31:
          premium = vehiclePremiums['CAR_JEEP_PICKUP'][vehicle_type]["Bus_Minibus_Minivan_31+"];
          break;
      }
    }

  } else if (["TAXI", "BUS", "MINIBUS", "MINIVAN"].includes(vehicle_category)) {

    //console.log('vehicle_number_of_passengers', vehicle_number_of_passengers)
    vehicle_number_of_passengers = parseInt(vehicle_number_of_passengers);

    is_fleet = JSON.parse(is_fleet);
    console.log('IS FLEET', is_fleet)

    if (vehicle_number_of_passengers && !is_fleet) {
      vehicle_number_of_passengers = parseInt(vehicle_number_of_passengers);
      if (vehicle_number_of_passengers <= 5) {
        premium = vehiclePremiums['TAXI_BUS_MINIBUS_MINIVAN']["Taxi_<=5_passengers"];
      } else if (vehicle_number_of_passengers >= 6 && vehicle_number_of_passengers <= 15) {
        premium = vehiclePremiums['TAXI_BUS_MINIBUS_MINIVAN']["Taxi_>5_passengers"];
      } else if (vehicle_number_of_passengers === 15) {
        premium = vehiclePremiums['TAXI_BUS_MINIBUS_MINIVAN']["Bus_Minibus_Minivan_15_paying"];
      } else if (vehicle_number_of_passengers >= 16 && vehicle_number_of_passengers <= 30) {
        premium = vehiclePremiums['TAXI_BUS_MINIBUS_MINIVAN']["Bus_Minibus_Minivan_16-30_paying"];
      } else if (vehicle_number_of_passengers >= 31) {
        premium = vehiclePremiums['TAXI_BUS_MINIBUS_MINIVAN']["Bus_Minibus_Minivan_31+_paying"];
      } else {

        message = "Invalid vehicle_number_of_passengers range."
      }

    } else if (vehicle_number_of_passengers && is_fleet) {
      console.log('vehicle_number_of_passengers', vehicle_number_of_passengers)
      console.log('vehicle_category', vehicle_category)

      vehicle_number_of_passengers = parseInt(vehicle_number_of_passengers);

      console.log(vehicle_number_of_passengers <= 5)

      if (vehicle_number_of_passengers <= 5) {
        premium = vehiclePremiums['TAXI_BUS_MINIBUS_MINIVAN']["Taxi_Fleet_<=5_passengers"];
        console.log('TAXI_FLEET_<=5_passengers', premium)
      } else if (vehicle_number_of_passengers >= 6 && vehicle_number_of_passengers <= 15) {
        premium = vehiclePremiums['TAXI_BUS_MINIBUS_MINIVAN']["Taxi_Fleet_>5_passengers"];
        console.log('Taxi_Fleet_>5_passengers', premium)
      } else {
        message = "Invalid vehicle_number_of_passengers range. Please provide vehicle_number_of_passengers range of 1 - 15  0r check if fleet is true or false"
      }

    } else {

      message = "Invalid vehicle_number_of_passengers range. Please provide vehicle_number_of_passengers range of 1 - 15  0r check if fleet is true or false"

    }

    console.log('BUS premium', premium)

  } else if (vehicle_category === "DRIVING_SCHOOL") {
    vehicle_number_of_passengers = parseInt(vehicle_number_of_passengers);

    // driver school
    if (vehicle_number_of_passengers && !vehicleCV) {
      if (vehicle_number_of_passengers <= 15) {

        premium = vehiclePremiums['DRIVING_SCHOOL']["Bus_Minibus_Minivan_15_paying"];

      } else if (vehicle_number_of_passengers >= 16 && vehicle_number_of_passengers <= 30) {
        premium = vehiclePremiums['DRIVING_SCHOOL']["Bus_Minibus_Minivan_16-30_paying"];

      } else if (vehicle_number_of_passengers >= 31) {
        premium = vehiclePremiums['DRIVING_SCHOOL']["Bus_Minibus_Minivan_31+_paying"];
      }
    } else if (vehicleCV && !vehicle_number_of_passengers) {
      if (vehicleCV >= 0 && vehicleCV < 10) {
        premium = vehiclePremiums['DRIVING_SCHOOL']["0-9 CV"];
      } else if (vehicleCV >= 10 && vehicleCV < 14) {
        premium = vehiclePremiums['DRIVING_SCHOOL']["10-13 CV"];
      } else if (vehicleCV >= 14 && vehicleCV < 18) {
        premium = vehiclePremiums['DRIVING_SCHOOL']["14-17 CV"];
      } else if (vehicleCV >= 18) {
        premium = vehiclePremiums['DRIVING_SCHOOL']["18+"];
      }
    } else if (vehicleCV && vehicle_number_of_passengers) {
      message = 'Please provide either vehicleCV or vehicle_number_of_passengers but not both'

    }
    console.log('DRIVING_SCHOOL premium', premium)


  } else if (vehicle_category === "TRUCKS") {

    // Function to check if a value is within a specific numerical range


    // Check for categoryThree and vehicle_tonnage
    if (vehicle_tonnage) {
      // Convert vehicle_tonnage to a numeric value
      const tonnageNumeric = parseFloat(vehicle_tonnage);
      console.log('tonnageNumeric', tonnageNumeric)

      // Determine the appropriate premium based on the tonnage range
      if (isInRange(tonnageNumeric, 0, 3.5)) {
        premium = vehiclePremiums['TRUCKS']['OWN_ACCOUNT_TRANSPORT']["Truck_<=3.5T"];
      } else if (isInRange(tonnageNumeric, 3.6, 8)) {
        premium = vehiclePremiums['TRUCKS']['OWN_ACCOUNT_TRANSPORT']["Truck_3.6T-8T"];
      } else if (isInRange(tonnageNumeric, 9, 15)) {
        premium = vehiclePremiums['TRUCKS']['OWN_ACCOUNT_TRANSPORT']["Truck_9T-15T"];
      } else if (tonnageNumeric > 15) {
        premium = vehiclePremiums['TRUCKS']['OWN_ACCOUNT_TRANSPORT']["Truck_15T+_Tracteur_routier"];
      } else {

        message = "Invalid vehicle_tonnage range."

      }
      console.log('TRUCKS Tonnage premium', premium)
      // } else if (vehicle_cv && !vehicle_tonnage) {
      //   vehicle_cv = parseInt(vehicle_cv);
      //   // Convert vehicle_tonnage to a numeric value
      //   console.log('TRUCK vehicle_cv', vehicle_cv)
      //   // Determine the appropriate premium based on the tonnage range
      //   if (isInRange(vehicle_cv, 0, 9)) {
      //     premium = vehiclePremiums["TRUCKS"]['OWN_ACCOUNT_TRANSPORT']["0-9 CV"];
      //   } else if (isInRange(vehicle_cv, 10, 13)) {
      //     premium = vehiclePremiums["TRUCKS"]['OWN_ACCOUNT_TRANSPORT']["10-13 CV"];
      //   } else if (isInRange(vehicle_cv, 14, 17)) {
      //     premium = vehiclePremiums["TRUCKS"]['OWN_ACCOUNT_TRANSPORT']["14-17 CV"];
      //   } else if (vehicle_cv > 18) {
      //     premium = vehiclePremiums["TRUCKS"]['OWN_ACCOUNT_TRANSPORT']["18+"];
      //   } else {

      //     message = "Invalid vehicle_cv range."

      //   }
      //   console.log('TRUCKS Cv premium', premium)

    } else if (vehicle_number_of_passengers && !vehicle_cv && !vehicle_tonnage) {
      vehicle_number_of_passengers = parseInt(vehicle_number_of_passengers);

      // Convert vehicle_tonnage to a numeric value
      console.log('TRUCK vehicle_number_of_passengers*', vehicle_number_of_passengers)
      // Determine the appropriate premium based on the tonnage range
      if (vehicle_number_of_passengers <= 15) {
        premium = vehiclePremiums["TRUCKS"]['OWN_ACCOUNT_TRANSPORT']["Bus_Minibus_Minivan_15_paying"];
      } else if (vehicle_number_of_passengers >= 16 && vehicle_number_of_passengers <= 30) {
        premium = vehiclePremiums["TRUCKS"]['OWN_ACCOUNT_TRANSPORT']["Bus_Minibus_Minivan_16-30_paying"];
      } else if (vehicle_number_of_passengers >= 31) {
        premium = vehiclePremiums["TRUCKS"]['OWN_ACCOUNT_TRANSPORT']["Bus_Minibus_Minivan_31+_paying"];
      }

      console.log('TRUCKS vehicle_number_of_passengers premium', premium)
    } else {

      message = "Invalid vehicle_tonnage range."
    }

  } else {
    message = "Invalid vehicle_category."
  }

  return {
    premium,
    message
  }

}



export async function formatPhoneNumber(number, partner) {
  // Check if number is a string
  if (typeof number === 'string') {
    // Check for 9-digit format
    if (number.length === 9 && /^\d+$/.test(number)) {
      if (partner === 1) {
        return "+254" + number;
      } else if (partner === 2) {
        return "+256" + number;
      }
    }
    // Check for 10-digit format with leading zero
    if (number.length === 10 && number.startsWith("0")) {
      const numberWithoutLeadingZero = number.slice(1);
      if (partner === 1) {
        return "+254" + numberWithoutLeadingZero;
      } else if (partner === 2) {
        return "+256" + numberWithoutLeadingZero;
      }
    }
  }
  // Return the original number if conditions are not met
  return number;
}