const {
    Client,
    GatewayIntentBits,
    Events,
    Partials,
} = require("discord.js");
const dotenv = require("dotenv");
const { registerCommands } = require("./deploy-commands");
const { addContent, editContent, manageContent, planingManage } = require("./handling/manageContent");
const contentList = require("./content.json");

dotenv.config();

const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});


registerCommands(process.env.TOKEN, process.env.CLIENT_ID)

client.on(Events.ClientReady, async (client) => {
    console.log("Client Ready")
})


client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isAutocomplete()) {
    const focusedValue = interaction.options.getFocused();
    const choices = contentList.map(v => v.name)
    const filtered = choices.filter(choice => choice.startsWith(focusedValue))
    await interaction.respond(
      filtered.map(choice => ({name : choice, value: choice}))
    )
  }
  
  if (interaction.isCommand()) {
    switch (interaction.commandName) {
      case "기획":
        planingManage(interaction)
        break;
      case "관리":
        manageContent(interaction)
        break;
      default:
        break;
    }  
  }
})

client.login(process.env.TOKEN);
  