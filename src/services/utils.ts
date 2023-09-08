export function isValidKenyanPhoneNumber(phoneNumber: string) {
    const kenyanPhoneNumberRegex = /^(\+?254|0)[17]\d{8}$/;
    return kenyanPhoneNumberRegex.test(phoneNumber);
  }
  

  export function getRandomInt(min:any, max:any) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  export  function isValidEmail(email:string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  export function globalSearch(array: any, searchTerm: any) {
    console.log("SEARCH TERM", searchTerm)
    console.log("ARRAY", array.length)
   // console.log("ARRAY", array)
    // Convert the searchTerm to lowercase for case-insensitive search
    const search = searchTerm.toLowerCase();
  
    // Use the filter() method to find objects matching the search term
    const results = array.filter((item) => {
      console.log("ITEM", item.dataValues)
        // Combine all object values into a single string for searching
        const objectValues = Object.values(item.dataValues).join(' ').toLowerCase();
        return objectValues.includes(search);
    });
  
    return results;
  }