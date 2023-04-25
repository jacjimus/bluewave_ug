const inputBody = {
    "client_id": "*****************************",
    "client_secret": "*****************************",
    "grant_type": "client_credentials"
};
const headers = {
'Content-Type':'application/json',
'Accept':'*/*'
};

fetch('https://openapiuat.airtel.africa/auth/oauth2/token',
{
method: 'POST',
body: inputBody,
headers: headers
})
.then(function(res) {
  return res.json();
}).then(function(body) {
  console.log(body);
});

  