const axios = require("axios");
require("dotenv").config();

const apiToken = process.env.API_TOKEN;

async function getStockValue(symbol) {
  try {
    const response = await axios.get(
      `https://api.marketdata.app/v1/stocks/quotes/${symbol}/?dateformat=timestamp&token=${apiToken}`
    );
    return await response.data.last[0];
  } catch (error) {
    console.error("Error making API request:", error.message);
  }
}

module.exports = { getStockValue };
