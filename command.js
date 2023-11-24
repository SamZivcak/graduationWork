const { REST, Routes } = require("discord.js");

const commands = [
  {
    name: "ping",
    description: "Replies with Pong!",
  },
  {
    name: "write",
    description: "writes something about itself",
  },
  {
    name: "testToken",
    description: "writes token into console",
  },
];

const rest = new REST({ version: "10" }).setToken(toString(process.env.TOKEN));

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands("1170726250353000630"), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
