require("dotenv").config();
const { boughtStock, soldStock } = require("./services/dbConnect.js");
const {
  portfolioValue,
  totalInvested,
  cashAvailable,
  compareStocks,
  profitLoss,
} = require("./kontrola.js");
const { EmbedBuilder } = require("discord.js");
const DatabaseClient = require("pg").Client;
const schedule = require("node-schedule");
const welcome = require("./welcome");

const databaseClient = new DatabaseClient({
  host: "127.0.0.1",
  port: 5432,
  database: "botDatabase",
  user: process.env.CLIENT_USERNAME,
  password: process.env.CLIENT_PASSWORD,
});

databaseClient.connect();

const { Client, GatewayIntentBits } = require("discord.js");

const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

discordClient.on("ready", () => {
  welcome(discordClient);
});

discordClient.on("messageCreate", (message) => {
  console.log(message.content);
});

discordClient.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  else if (interaction.commandName === "boughtstock") {
    try {
      const response = await boughtStock(
        databaseClient,
        interaction.options.get("stock_name").value,
        interaction.options.get("amount").value,
        interaction.options.get("buy_price").value,
        interaction.user.id
      );

      interaction.reply(response);
    } catch (error) {
      console.log(error);
      response = "An error has occurred, please try again later.";
      interaction.reply(response);
    }
  } else if (interaction.commandName === "soldstock") {
    try {
      const response = await soldStock(
        databaseClient,
        interaction.options.get("sell_stock_name").value,
        interaction.options.get("sell_amount").value,
        interaction.options.get("sell_price").value,
        interaction.user.id
      );
      interaction.reply(response);
    } catch (error) {
      console.log(error);
      response = "An error has occurred, please try again later.";
      interaction.reply(response);
    }
  } else if (interaction.commandName === "schedule") {
    const messageContent = interaction.options.get("message").value;
    const hour = interaction.options.get("time").value;
    const minute = interaction.options.get("minute").value;

    try {
      const valueOfPortfolio = await portfolioValue(
        databaseClient,
        process.env.DISCORD_ID
      );
      const investedMoney = await totalInvested(
        databaseClient,
        process.env.DISCORD_ID
      );
      const availableCash = await cashAvailable(
        databaseClient,
        process.env.DISCORD_ID
      );
      const stocksCompared = await compareStocks(
        databaseClient,
        process.env.DISCORD_ID
      );

      const lossProfit = await profitLoss(
        databaseClient,
        process.env.DISCORD_ID
      );

      //#region valueEmbed
      // Transpose the array
      const transposedValues = valueOfPortfolio[0].map((_, colIndex) =>
        valueOfPortfolio.map((row) => row[colIndex])
      );

      // Initialize an empty array to hold the fields
      const valuefields = [];

      // Add the transposed data to fields
      transposedValues.forEach((column, index) => {
        const name = column.join("\n"); // Join the column elements with newline
        valuefields.push({
          name: index === 0 ? "Stock" : index === 1 ? "Quantity" : "Price", // Set appropriate column titles
          value: name,
          inline: true, // Assuming you want all fields to be inline
        });
      });

      // Now you can add the fields to your embed object using .addFields()

      const valueEmbed = new EmbedBuilder()
        .setColor("#33EAFF")
        .setTitle("Portfolio value")
        .setDescription("Here are the current values of your stocks")
        .setTimestamp()
        .addFields(...valuefields);

      //#endregion

      //#region investEmbed
      // Initialize an empty array to hold the fields
      let namesColumn = "";
      let investmentsColumn = "";

      // Populate the columns
      investedMoney.forEach(([name, investment]) => {
        namesColumn += name + "\n";
        investmentsColumn +=
          investment.toLocaleString("en-US", { maximumFractionDigits: 2 }) +
          "\n"; // Format investment
      });

      const investEmbed = new EmbedBuilder()
        .setColor("#33EAFF")
        .setTitle("Invested money")
        .setDescription("Here are the amounts of money you invested per stock")
        .setTimestamp();

      investEmbed.addFields(
        { name: "Stock", value: namesColumn, inline: true },
        { name: "Investment", value: investmentsColumn, inline: true }
      );
      //#endregion

      //#region cashEmbed
      const cashEmbed = new EmbedBuilder()
        .setColor("#33EAFF")
        .setTitle("Available cash")
        .setDescription(
          "This is the amount of cash you have available after selling your stocks."
        )
        .setTimestamp()
        .addFields({
          name: "Cash",
          value: availableCash.toString(),
          inline: true,
        });
      //#endregion

      //#region compareEmbed
      let nameColumn = "";
      let myPriceColumn = "";
      let marketPriceColumn = "";

      // Populate the columns
      stocksCompared.forEach(([name, myPrice, marketPrice]) => {
        nameColumn += name + "\n";
        myPriceColumn += myPrice.toFixed(2) + "\n";
        marketPriceColumn += marketPrice.toFixed(2) + "\n";
      });

      const compareEmbed = new EmbedBuilder()
        .setColor("#33EAFF")
        .setTitle("Compared stocks")
        .setDescription(
          "This table show the average price per stock compared to market price."
        )
        .setTimestamp()
        .addFields(
          { name: "Name", value: nameColumn, inline: true },
          { name: "My Price", value: myPriceColumn, inline: true },
          { name: "Market Price", value: marketPriceColumn, inline: true }
        );
      //#endregion

      //#region profitEmbed
      let stockNameColumn = "";
      let mySumColumn = "";
      let marketSumColumn = "";

      // Populate the columns
      stocksCompared.forEach(([name, myPrice, marketPrice]) => {
        stockNameColumn += name + "\n";
        mySumColumn += myPrice.toFixed(2) + "\n";
        marketSumColumn += marketPrice.toFixed(2) + "\n";
      });

      const profitEmbed = new EmbedBuilder()
        .setColor("#33EAFF")
        .setTitle("Profit Loss")
        .setDescription(
          "This table shows the sum of money you spent for your stocks compared to market price of all your stocks."
        )
        .setTimestamp()
        .addFields(
          { name: "Name", value: stockNameColumn, inline: true },
          { name: "My Price", value: mySumColumn, inline: true },
          { name: "Market Price", value: marketSumColumn, inline: true }
        );
      //#endregion

      if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        return interaction.reply("Invalid hour or minutes.");
      }

      const scheduleTime = `${minute} ${hour} * * *`;

      schedule.scheduleJob(scheduleTime, async () => {
        const user = await discordClient.users.fetch(interaction.user.id);
        user
          .send({ embeds: [valueEmbed, investEmbed, cashEmbed, compareEmbed, profitEmbed] })
          .then(() => console.log(`Scheduled message sent to ${user.tag}`))
          .catch((error) =>
            console.error(
              `Error sending message to ${user.tag}: ${error.message}`
            )
          );
      });

      interaction.reply(
        `Scheduled message: "${messageContent}" every day at ${hour}:${minute}`
      );
    } catch (error) {
      console.error("Error:", error);
      interaction.reply("An error occurred while processing your request.");
    }
  }
});

discordClient.login(process.env.TOKEN);
