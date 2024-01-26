require("dotenv").config();

async function boughtStock(
  databaseClient,
  stockName,
  stockAmount,
  stockBuyPrice,
  foreignId
) {
  try {
    const databaseUser = await databaseClient.query(
      `SELECT "id" FROM "users" WHERE "discord_id" = '${foreignId}'::text`
    );
    let userId = databaseUser.rows[0]?.id;
    if (!userId) {
      userId = (await createUser(databaseClient, foreignId)).rows[0]?.id;
    }

    await databaseClient.query(
      `INSERT INTO "stocks_transactions" ("stock_name","stock_amount","stock_buy_price", "foreign_id", "action_type")
      VALUES('${stockName}', '${stockAmount}', '${stockBuyPrice}', '${userId}','purchase')`
    );
    return "Transaction was recorded succesfully.";
  } catch (error) {
    console.log(error);
    return "Transaction was recorded unsuccesfully.";
  }
}

async function soldStock(
  databaseClient,
  sellStockName,
  sellAmount,
  sellPrice,
  foreignId
) {
  try {
    const userIdResult = await databaseClient.query(
      `SELECT "id" FROM "users" WHERE "discord_id" = '${foreignId}'::text`
    );

    const userId = userIdResult.rows[0].id;

    if (!userId) {
      userId = (await createUser(databaseClient, foreignId)).rows[0]?.id;
      return "My apologies but it looks like you don't corespond with the necessary stock.";
    }

    const purchase = "purchase";

    const stockAmount = await databaseClient.query(
      `SELECT "stock_amount" FROM "stocks_transactions" WHERE "foreign_id" = '${userId}' 
      AND "stock_name" = '${sellStockName}' AND "action_type" = '${purchase}' ORDER BY "timestamp"::date asc`
    );

    const stocksAmountSum = stockAmount.rows?.reduce(
      (acc, stocksAmount) => acc + stocksAmount.stock_amount,
      0
    );

    if (!stocksAmountSum) return "You don't have this stock.";

    if (stocksAmountSum >= sellAmount) {
      await databaseClient.query(`INSERT INTO "stocks_transactions" ("stock_name","stock_amount",
      "stock_buy_price", "foreign_id", "action_type")
      VALUES('${sellStockName}', '${sellAmount}', '${sellPrice}', '${userId}','sell')`);
      return "Transaction was recorded succesfully.";
    } else {
      return "Unfortunately you don't have this amount of assets.";
    }
  } catch (error) {
    console.log(error);
  }
}

async function createUser(databaseClient, discord_id) {
  return await databaseClient.query(
    `INSERT INTO "users" ("discord_id")
      VALUES('${discord_id}') RETURNING id`
  );
}

module.exports = { boughtStock, createUser, soldStock };
