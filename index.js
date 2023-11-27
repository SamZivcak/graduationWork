require("dotenv").config();

const dbconnect = require("./services/dbConnect");

const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

dbconnect.testConnectDatabase();

client.on("messageCreate", (message) => {
  console.log(message.content);
});

client.on("interactionCreate", (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    interaction.reply("pong");
  }

  if (interaction.commandName === "boughtStock") {
    const vars = message.content.slice(prefix.length).trim().split(" ");
    vars.shift();

    if (!vars.length) {
      return interaction.reply(
        "Insufficient variables. Example: !boughtStock Cola 0.01 50000"
      );
    }
    dbconnect.boughtStock(vars[0], vars[1], vars[2], message.author.id);
    dbconnect.udateUsers(message.author, message.author.id);
  }

  if (interaction.commandName === "write") {
    interaction.reply("Ahoj jsem bot nic neumim.");
  }
});

client.login(process.env.TOKEN);
