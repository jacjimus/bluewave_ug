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
  console.log("ARRAY", array);

  // Convert the searchTerm to lowercase for case-insensitive search
  const search = searchTerm.toLowerCase();

  // Use the filter() method to find objects matching the search term
  const results = array.filter((item) => {

    // Spread all object fields into the ITEM
    const ITEM = { ...item.dataValues, ...item?.user?.dataValues, ...item?.policy?.dataValues };

   // console.log("ITEM", ITEM);
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

  if (policyType === "MINI") {
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

export const formatAmount=(number: number)=> {
  const formattedNumber = (number / 1000000).toFixed(1);
  return formattedNumber + "M";
}


    //   const proration_benefit_table = {
    //     '1-3months': 10,
    //     '4-6months': 40,
    //     '7-9months': 60,
    //     '10-11months': 80,
    //     '12months': 100
    // };

    export const calculateProrationPercentage=(installments: number) =>{
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