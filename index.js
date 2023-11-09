const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("messageCreate", (message) => {
  console.log(message.content);
});

client.on("interactionCreate", (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    interaction.reply("Pong!");
  }

  if (interaction.commandName === "write") {
    interaction.reply("Ahoj jsem bot nic neumim.");
  }
});

client.login(
  "MTE3MDcyNjI1MDM1MzAwMDYzMA.GjRYNE.IZ41bj0YgPj9UFZjecwyzmyKebUBXoJhRwBG_k"
);
