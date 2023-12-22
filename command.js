const { REST, Routes, ApplicationCommandOptionType } = require("discord.js");
require("dotenv").config();

const commands = [
  {
    name: "boughtstock",
    description:
      "variables: name amount buy_price separated by SPACE, adds them to database",
    options: [
      {
        name: "stock_name",
        description: "abrrevation of the stock",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "amount",
        description: "amount of the stock",
        type: ApplicationCommandOptionType.Number,
        required: true,
      },
      {
        name: "buy_price",
        description: "price of the stock at the time of buying",
        type: ApplicationCommandOptionType.Number,
        required: true,
      },
    ],
  },
  {
    name: "soldstock",
    description: "removes stock from database",
    options: [
      {
        name: "sell_stock_name",
        description: "Abbrevation of the stock you sold.",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "sell_amount",
        description: "Amount of the stock you sold.",
        type: ApplicationCommandOptionType.Number,
        required: true,
      },
      {
        name: "sell_price",
        description: "Price you sold the stock for.",
        type: ApplicationCommandOptionType.Number,
        required: true,
      },
      {
        name: "stock_by_date",
        description:
          "proceeds from the oldest",
        type: ApplicationCommandOptionType.Boolean,
        required: true,
      }
    ],
  },
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(
      Routes.applicationGuildCommands(process.env.BOT_ID, process.env.GUILD_ID),
      {
        body: commands,
      }
    );

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.log(error);
  }
})();
