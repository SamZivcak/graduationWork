require("dotenv").config();
const { response } = require("express");
const { boughtStock, soldStock } = require("./services/dbConnect.js");
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
    let response = "";
    try {
      response = await boughtStock(
        databaseClient,
        interaction.options.get("stock_name").value,
        interaction.options.get("amount").value,
        interaction.options.get("buy_price").value,
        interaction.user.id
      );
    } catch (error) {
      console.log(error);
      response = "An error has occured try again later.";
    }
    interaction.reply(response);
  } else if (interaction.commandName === "soldstock") {
    let response = "";
    try {
      response = await soldStock(
        databaseClient,
        interaction.options.get("sell_stock_name").value,
        interaction.options.get("sell_amount").value,
        interaction.options.get("sell_price").value,
        interaction.options.get("stock_by_date").value,
        interaction.user.id
      );
    } catch (error) {
      console.log(error);
      response = "An error has occured try again later.";
    }
    interaction.reply(response);
  } else if (interaction.commandName === "schedule") {
    const messageContent = interaction.options.get("message").value;
    const hour = interaction.options.get("time").value;
    const minute = interaction.options.get("minute").value;

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return interaction.reply("Invalid hour or minutes.");
    }

    const scheduleTime = `${minute} ${hour} * * *`;

    schedule.scheduleJob(scheduleTime, async () => {
      const user = await discordClient.users.fetch(interaction.user.id);
      user
        .send(messageContent)
        .then(() => console.log(`Scheduled message sent to ${user.tag}`))
        .catch((error) =>
          console.error(
            `Error sending message to ${user.tag}: ${error.message}`
          )
        );
    });
    interaction.reply(
      `Scheduled message: "${messageContent}" every day at ${hour}::${minute}`
    );
  }
});
discordClient.login(process.env.TOKEN);
