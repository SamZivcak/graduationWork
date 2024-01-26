require("dotenv").config();
module.exports = (client) => {
  client.on("guildMemberAdd", (member) => {
    const message = `Welcome <@${member.id}> to our discord server, default currency is USD.`;
    const channel = member.guild.channels.cache.get(process.env.CHANNEL_ID);
    channel.send(message);
  });
};
