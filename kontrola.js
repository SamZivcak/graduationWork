const { getStockValue } = require("./testAxios.js");
require("dotenv").config();
const DatabaseClient = require("pg").Client;
const databaseClient = new DatabaseClient({
  host: "127.0.0.1",
  port: 5432,
  database: "botDatabase",
  user: process.env.CLIENT_USERNAME,
  password: process.env.CLIENT_PASSWORD,
});

databaseClient.connect();

async function portfolioValue(databaseClient, userId) {
  try {
    let databaseId = await databaseClient.query(
      `SELECT "id" FROM "users" WHERE "discord_id" = '${userId}'::text`
    );

    databaseId = databaseId.rows[0]?.id;
    //console.log(databaseId);

    const table = await databaseClient.query(
      `SELECT stock_name, stock_amount, stock_buy_price, action_type FROM "stocks_transactions" WHERE "foreign_id" = '${databaseId}'`
    );

    const tableRows = table.rows;

    let singleStocks = [];
    tableRows.forEach((stock) => {
      const index = singleStocks.findIndex(
        (item) => item[0] === stock.stock_name
      );
      if (index !== -1) {
        if (stock.action_type === "purchase") {
          singleStocks[index][1] += stock.stock_amount;
        } else {
          singleStocks[index][1] -= stock.stock_amount;
        }
      } else {
        if (stock.action_type === "purchase") {
          singleStocks.push([stock.stock_name, stock.stock_amount]);
        } else {
          singleStocks.push([stock.stock_name, -stock.stock_amount]);
        }
      }
    });

    const stockValues = [];
    await Promise.all(
      singleStocks.map(async (stock) => {
        const value = await getStockValue(stock[0]);
        stockValues.push([stock[0], value]);
      })
    );

    const writeOut = [];

    for (let i = 0; i < singleStocks.length; i++) {
      const name = singleStocks[i][0];
      const stockAmount = singleStocks[i][1];
      const stockValue = stockValues.find((item) => item[0] === name)[1];
      writeOut.push([name, stockAmount, stockValue]);
    }

    return writeOut;
  } catch (error) {
    console.error("Error in portfolioValue function:", error);
  }
}

async function totalInvested(databaseClient, userId) {
  try {
    let databaseId = await databaseClient.query(
      `SELECT "id" FROM "users" WHERE "discord_id" = '${userId}'::text`
    );

    databaseId = databaseId.rows[0]?.id;

    const buying = await databaseClient.query(
      `SELECT stock_name, stock_amount, stock_buy_price FROM "stocks_transactions" 
      WHERE "foreign_id" = '${databaseId}' 
      AND "action_type" = 'purchase'`
    );

    const selling = await databaseClient.query(
      `SELECT stock_name, stock_amount, stock_buy_price FROM "stocks_transactions" 
      WHERE "foreign_id" = '${databaseId}' 
      AND "action_type" = 'sell'`
    );

    const tableRows = buying.rows;
    const sellingRows = selling.rows;

    const singleStocks = [];
    tableRows.forEach((row) => {
      const index = singleStocks.findIndex(
        (item) => item[0] === row.stock_name
      );

      if (index != -1) {
        singleStocks[index].push([row.stock_buy_price, row.stock_amount]);
      } else {
        singleStocks.push([
          row.stock_name,
          [row.stock_buy_price, row.stock_amount],
        ]);
      }
    });

    singleStocks.forEach((single) => {
      single.sort((a, b) => b[0] - a[0]);
    });

    sellingRows.forEach((sold) => {
      const index = singleStocks.findIndex(
        (item) => item[0] === sold.stock_name
      );
      let amount = sold.stock_amount;
      if (
        index != -1 &&
        amount < singleStocks[index][singleStocks[index].length - 1][1]
      ) {
        singleStocks[index][singleStocks[index].length - 1][1] -= amount;
        amount = 0;
      } else if (
        index != -1 &&
        amount == singleStocks[index][singleStocks[index].length - 1][1]
      ) {
        singleStocks[index].pop();
        amount = 0;
      } else if (
        index != -1 &&
        amount > singleStocks[index][singleStocks[index].length - 1][1]
      ) {
        amount -= singleStocks[index][singleStocks[index].length - 1][1];
        singleStocks[index].pop();
        while (amount > 0) {
          if (
            index != -1 &&
            amount < singleStocks[index][singleStocks[index].length - 1][1]
          ) {
            singleStocks[index][singleStocks[index].length - 1][1] -= amount;
            amount = 0;
            break;
          } else if (
            index != -1 &&
            amount == singleStocks[index][singleStocks[index].length - 1][1]
          ) {
            singleStocks[index].pop();
            amount = 0;
            break;
          } else if (
            index != -1 &&
            amount > singleStocks[index][singleStocks[index].length - 1][1]
          ) {
            amount -= singleStocks[index][singleStocks[index].length - 1][1];
            singleStocks[index].pop();
          }
        }
      }
    });

    const writeOut = [];
    let value = 0;

    singleStocks.forEach((stock) => {
      for (let index = 1; index < stock.length; index++) {
        value += stock[index][0] * stock[index][1];
      }
      writeOut.push([stock[0], value]);
      value = 0;
    });

    return writeOut;
  } catch (error) {
    console.error("Error in portfolioValue function:", error);
  }
}

async function cashAvailable(databaseClient, userId) {
  try {
    let databaseId = await databaseClient.query(
      `SELECT "id" FROM "users" WHERE "discord_id" = '${userId}'::text`
    );

    databaseId = databaseId.rows[0]?.id;

    const table = await databaseClient.query(
      `SELECT stock_name, stock_amount, stock_buy_price FROM "stocks_transactions" 
      WHERE "foreign_id" = '${databaseId}' 
      AND "action_type" = 'sell'`
    );

    const tableRows = table.rows;

    let singleStocks = [];
    tableRows.forEach((stock) => {
      const index = singleStocks.findIndex(
        (item) => item[0] === stock.stock_name
      );
      if (index !== -1) {
        singleStocks[index][1] += stock.stock_amount * stock.stock_buy_price;
      } else {
        singleStocks.push([
          stock.stock_name,
          stock.stock_amount * stock.stock_buy_price,
        ]);
      }
    });
    let cash = 0;
    singleStocks.forEach((single) => {
      cash += single[1];
    });

    return cash;
  } catch (error) {
    console.error("Error in portfolioValue function:", error);
  }
}

async function compareStocks(databaseClient, userId) {
  try {
    let databaseId = await databaseClient.query(
      `SELECT "id" FROM "users" WHERE "discord_id" = '${userId}'::text`
    );

    databaseId = databaseId.rows[0]?.id;

    const buying = await databaseClient.query(
      `SELECT stock_name, stock_amount, stock_buy_price FROM "stocks_transactions" 
      WHERE "foreign_id" = '${databaseId}' 
      AND "action_type" = 'purchase'`
    );

    const selling = await databaseClient.query(
      `SELECT stock_name, stock_amount, stock_buy_price FROM "stocks_transactions" 
      WHERE "foreign_id" = '${databaseId}' 
      AND "action_type" = 'sell'`
    );

    const tableRows = buying.rows;
    const sellingRows = selling.rows;

    const singleStocks = [];
    tableRows.forEach((row) => {
      const index = singleStocks.findIndex(
        (item) => item[0] === row.stock_name
      );

      if (index != -1) {
        singleStocks[index].push([row.stock_buy_price, row.stock_amount]);
      } else {
        singleStocks.push([
          row.stock_name,
          [row.stock_buy_price, row.stock_amount],
        ]);
      }
    });

    singleStocks.forEach((single) => {
      single.sort((a, b) => b[0] - a[0]);
    });

    sellingRows.forEach((sold) => {
      const index = singleStocks.findIndex(
        (item) => item[0] === sold.stock_name
      );
      let amount = sold.stock_amount;
      if (
        index != -1 &&
        amount < singleStocks[index][singleStocks[index].length - 1][1]
      ) {
        singleStocks[index][singleStocks[index].length - 1][1] -= amount;
        amount = 0;
      } else if (
        index != -1 &&
        amount == singleStocks[index][singleStocks[index].length - 1][1]
      ) {
        singleStocks[index].pop();
        amount = 0;
      } else if (
        index != -1 &&
        amount > singleStocks[index][singleStocks[index].length - 1][1]
      ) {
        amount -= singleStocks[index][singleStocks[index].length - 1][1];
        singleStocks[index].pop();
        while (amount > 0) {
          if (
            index != -1 &&
            amount < singleStocks[index][singleStocks[index].length - 1][1]
          ) {
            singleStocks[index][singleStocks[index].length - 1][1] -= amount;
            amount = 0;
            break;
          } else if (
            index != -1 &&
            amount == singleStocks[index][singleStocks[index].length - 1][1]
          ) {
            singleStocks[index].pop();
            amount = 0;
            break;
          } else if (
            index != -1 &&
            amount > singleStocks[index][singleStocks[index].length - 1][1]
          ) {
            amount -= singleStocks[index][singleStocks[index].length - 1][1];
            singleStocks[index].pop();
          }
        }
      }
    });

    const averges = [];
    let getDivided = 0;
    let divideBy = 0;

    singleStocks.forEach((stock) => {
      averges.push([stock.shift(), 0]);
      stock.forEach((element) => {
        getDivided = getDivided + element[0] * element[1];
        divideBy = divideBy + element[1];
      });
      averges[averges.length - 1][1] += getDivided / divideBy;
      getDivided = 0;
      divideBy = 0;
    });

    const stockValues = [];

    await Promise.all(
      averges.map(async (average) => {
        const value = await getStockValue(average[0]);
        stockValues.push([average[0], value]);
      })
    );

    const writeOut = [];

    for (let i = 0; i < averges.length; i++) {
      const name = averges[i][0];
      const stockAmount = averges[i][1];
      const stockValue = stockValues.find((item) => item[0] === name)[1];
      writeOut.push([name, stockAmount, stockValue]);
    }

    return writeOut;
  } catch (error) {
    console.error("Error in portfolioValue function:", error);
  }
}

async function profitLoss(databaseClient, userId) {
  try {
    let databaseId = await databaseClient.query(
      `SELECT "id" FROM "users" WHERE "discord_id" = '${userId}'::text`
    );

    databaseId = databaseId.rows[0]?.id;

    const buying = await databaseClient.query(
      `SELECT stock_name, stock_amount, stock_buy_price FROM "stocks_transactions" 
      WHERE "foreign_id" = '${databaseId}' 
      AND "action_type" = 'purchase'`
    );

    const selling = await databaseClient.query(
      `SELECT stock_name, stock_amount, stock_buy_price FROM "stocks_transactions" 
      WHERE "foreign_id" = '${databaseId}' 
      AND "action_type" = 'sell'`
    );

    const tableRows = buying.rows;
    const sellingRows = selling.rows;

    const singleStocks = [];
    tableRows.forEach((row) => {
      const index = singleStocks.findIndex(
        (item) => item[0] === row.stock_name
      );

      if (index != -1) {
        singleStocks[index].push([row.stock_buy_price, row.stock_amount]);
      } else {
        singleStocks.push([
          row.stock_name,
          [row.stock_buy_price, row.stock_amount],
        ]);
      }
    });

    singleStocks.forEach((single) => {
      single.sort((a, b) => b[0] - a[0]);
    });

    sellingRows.forEach((sold) => {
      const index = singleStocks.findIndex(
        (item) => item[0] === sold.stock_name
      );
      let amount = sold.stock_amount;
      if (
        index != -1 &&
        amount < singleStocks[index][singleStocks[index].length - 1][1]
      ) {
        singleStocks[index][singleStocks[index].length - 1][1] -= amount;
        amount = 0;
      } else if (
        index != -1 &&
        amount == singleStocks[index][singleStocks[index].length - 1][1]
      ) {
        singleStocks[index].pop();
        amount = 0;
      } else if (
        index != -1 &&
        amount > singleStocks[index][singleStocks[index].length - 1][1]
      ) {
        amount -= singleStocks[index][singleStocks[index].length - 1][1];
        singleStocks[index].pop();
        while (amount > 0) {
          if (
            index != -1 &&
            amount < singleStocks[index][singleStocks[index].length - 1][1]
          ) {
            singleStocks[index][singleStocks[index].length - 1][1] -= amount;
            amount = 0;
            break;
          } else if (
            index != -1 &&
            amount == singleStocks[index][singleStocks[index].length - 1][1]
          ) {
            singleStocks[index].pop();
            amount = 0;
            break;
          } else if (
            index != -1 &&
            amount > singleStocks[index][singleStocks[index].length - 1][1]
          ) {
            amount -= singleStocks[index][singleStocks[index].length - 1][1];
            singleStocks[index].pop();
          }
        }
      }
    });

    const values = [];
    const amounts = [];
    let amount = 0;
    let sum = 0;
    for (let index = 0; index < singleStocks.length; index++) {
      for (
        let indexInside = 1;
        indexInside < singleStocks[index].length;
        indexInside++
      ) {
        amount = amount + singleStocks[index][indexInside][1];
        sum +=
          singleStocks[index][indexInside][0] *
          singleStocks[index][indexInside][1];
      }
      values.push([singleStocks[index][0], sum]);
      amounts.push([singleStocks[index][0], amount]);
      amount = 0;
      sum = 0;
    }

    const fusedArray = [];

    const map = new Map(values);

    for (const [name, value] of amounts) {
      if (map.has(name)) {
        fusedArray.push([name, map.get(name), value]);
      } else {
        fusedArray.push([name, undefined, value]);
      }
    }

    return Promise.all(
      fusedArray.map(async ([name, value1, value2]) => {
        const newValue = await getStockValue(name);
        return [name, value1, newValue * value2];
      })
    ).then((result) => {
      return result;
    });
  } catch (error) {
    console.error("Error in portfolioValue function:", error);
  }
}

module.exports = {
  portfolioValue,
  totalInvested,
  cashAvailable,
  compareStocks,
  profitLoss,
};
