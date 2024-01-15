const { ChannelType } = require("discord.js")
const contentList = require("../content.json")
const dotenv = require("dotenv")
const fs = require("fs")
const { infoEmbed, alertEmbed } = require("../embed/contentInfo")

dotenv.config()

module.exports = {
  /**
   * 
   * @param {import("discord.js").ChatInputCommandInteraction} interaction 
   */
  planingManage : async (interaction) => {
    await interaction.deferReply({
      ephemeral: true
    })

    if (interaction.options.getSubcommand() === "등록") {
      const name = interaction.options.getString("이름")
      const description = interaction.options.getString("설명")
      const contentURL = interaction.options.getString("url")

      const prevContentList = contentList
      const checkContentName = prevContentList.some(content => content.name === name)
      
      if (checkContentName) {
        return interaction.editReply("이미 있는 컨텐츠 이름입니다.")
      }

      const newJson = {
        name,
        description,
        plan_userId: interaction.user.id,
        plan_url: contentURL,
        status: "PRE-PLAN",
        creator: {
          system: [
          ],
          build: [
          ],
          workshop: [
          ],
          mod: [
          ],
          resourcePack: [
          ]
        },
        messageId: "",
        channelId: ""
      }

      const channel = await interaction.guild.channels.fetch(process.env.CHANNEL_PRE_PLAN)

      const newChannel = channel.threads.create({
        name : `${name} - ${interaction.user.displayName}`,
        message: {
          embeds: [infoEmbed(newJson)]
        },
        reason: "새로운 컨텐츠 기획본 생성"
      }).then((v) => {
        newJson.channelId = v.id
        newJson.messageId = v.lastMessageId
        prevContentList.push(newJson)
        fs.writeFileSync("./content.json", JSON.stringify(prevContentList))
        return interaction.editReply({
          content: "새로운 컨텐츠 기획본이 만들어졌습니다!"
        })
      })
    }

    if (interaction.options.getSubcommand() === "수정") {
      const contentName = interaction.options.getString("컨텐츠")
      const newName = interaction.options.getString("이름")
      const newDesc = interaction.options.getString("설명")
      const newURL = interaction.options.getString("url")

      const prevContentList = contentList
      const checkContentName = prevContentList.some(user => user.name === contentName)

      if (!checkContentName) {
        return interaction.editReply({
          content: "컨텐츠가 존재하지 않습니다."
        })
      }
      
      const contentInfo = prevContentList.find((v) => v.name === contentName)
      
      if (contentInfo.plan_userId !== interaction.user.id || interaction.member.roles.cache.some(role => role.id === process.env.MANAGER_ROLE_ID)) {
        return interaction.editReply({
          content: "해당 컨텐츠 수정 권한이 없습니다. 기획자 혹은 팀장님께 문의하세요."
        })
      }

      const channel = interaction.guild.channels.cache.get(contentInfo.channelId)
      const message = await channel.messages.fetch(contentInfo.messageId)

      if (newName !== null && contentInfo.name !== newName) {
        contentInfo.name = newName
      }
      
      if (newDesc !== null && contentInfo.description !== newDesc) {
        contentInfo.description = newDesc
      }

      if (newURL !== null && contentInfo.plan_url !== newURL) {
        contentInfo.plan_url = newURL
      }

      fs.writeFileSync("./content.json", JSON.stringify(prevContentList))

      message.edit({
        embeds: [infoEmbed(contentInfo)]
      })
      return interaction.editReply({
        content: "수정이 완료되었습니다."
      })
    }
  },
  /**
   * 
   * @param {import("discord.js").ChatInputCommandInteraction} interaction 
   */
  manageContent : async (interaction) => {
    await interaction.deferReply({
      ephemeral: true
    })
    
    const prevContentList = contentList
    const content = prevContentList.find(v => v.channelId === interaction.channel.id)

    if (content === undefined || content === null) {
      return interaction.editReply({
        content: "해당 채널에서 사용할 수 없는 명령어입니다. 기획방에서 사용해주세요!"
      })
    }

    if (interaction.options.getSubcommandGroup() === "제작자") {
      if (interaction.options.getSubcommand() === "지정") {
        const makerType = interaction.options.getString("제작타입")
        const maker = interaction.options.getUser("유저")

        if (content.creator[makerType].some(v => v === maker.id)) {
          return interaction.editReply({
            content: "이미 지정되어 있는 제작자입니다."
          })
        }

        content.creator[makerType].push(maker.id)
        const channel = interaction.guild.channels.cache.get(content.channelId)

        channel.send({
          embeds : [alertEmbed("지정", maker.id, makerType.toUpperCase())]
        })
        fs.writeFileSync("./content.json", JSON.stringify(prevContentList))
        return interaction.editReply({
          content: "성공적으로 지정하였습니다."
        })
      }
      
      if (interaction.options.getSubcommand() === "제외") {
        const makerType = interaction.options.getString("제작타입")
        const maker = interaction.options.getUser("유저")
        const findUser = content.creator[makerType].some(v => v === maker.id)
        console.log(findUser)

        if (!findUser) {
          return interaction.editReply({
            content: "해당 사용자는 지정되어 있지 않습니다."
          })
        }

        const findIndex = content.creator[makerType].indexOf(maker.id);
        content.creator[makerType].splice(findIndex, 1)
        const channel = interaction.guild.channels.cache.get(content.channelId)

        channel.send({
          embeds : [alertEmbed("제거", maker.id, makerType.toUpperCase())]
        })
        fs.writeFileSync("./content.json", JSON.stringify(prevContentList))
        return interaction.editReply({
          content: "성공적으로 제거하였습니다."
        })
      }
    }
  }
}