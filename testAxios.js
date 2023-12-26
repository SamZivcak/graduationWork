const express = require("express");
const axios = require("axios");

async function getStockValue(){
try {
  const response = await axios.get(
    "https://api.marketdata.app/v1/stocks/quotes/AAPL/?dateformat=timestamp"
  );
  console.log(response.data.last);
  
} catch (error) {
  console.error("Error making API request:", error.message);
}
}

getStockValue();
