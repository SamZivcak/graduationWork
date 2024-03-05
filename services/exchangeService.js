const axios = require("axios");
require("dotenv").config();

async function getExchangeRateToDollar(currency) {
  if (currency.length !== 3) {
    return console.log("Currency must be 3 characters long.");
  }

  try {
    const response = await axios.get(
      `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_TOKEN}/pair/USD/${currency}`
    );
    console.log(response.data.conversion_rate);
  } catch (error) {
    console.log(error);
  }
}

getExchangeRateToDollar("USD");
