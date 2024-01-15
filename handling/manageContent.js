const { ChannelType } = require("discord.js")
const contentList = require("../content.json")
const dotenv = require("dotenv")
const fs = require("fs")
const { infoEmbed, alertEmbed } = require("../embed/contentInfo")
const { STATUS } = require("../enum/status")

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

      if (contentInfo.plan_userId !== interaction.user.id) {
        if (!interaction.member.roles.cache.some(role => role.id === process.env.MANAGER_ROLE_ID)) {
          return interaction.editReply({
            content: "해당 컨텐츠 수정 권한이 없습니다. 기획자 혹은 팀장님께 문의하세요."
          })
        }
      }

      if (!contentInfo.status === STATUS.PRE_PLAN) {
        return interaction.editReply({
          content: "해당 컨텐츠는 수정할 수 없습니다."
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

    if (interaction.options.getSubcommand() === "삭제") {
      const contentName = interaction.options.getString("컨텐츠")

      const prevContentList = contentList
      const checkContentName = prevContentList.some(user => user.name === contentName)

      if (!checkContentName) {
        return interaction.editReply({
          content: "컨텐츠가 존재하지 않습니다."
        })
      }
      
      const contentInfo = prevContentList.find((v) => v.name === contentName)
      
      
      if (contentInfo.plan_userId !== interaction.user.id || !interaction.member.roles.cache.some(role => role.id === process.env.MANAGER_ROLE_ID)) {
        return interaction.editReply({
          content: "해당 컨텐츠 삭제 권한이 없습니다. 기획자 혹은 팀장님께 문의하세요."
        })
      }

      if (!contentInfo.status === STATUS.PRE_PLAN) {
        return interaction.editReply({
          content: "해당 컨텐츠는 삭제할 수 없습니다."
        })
      }

      const channel = interaction.guild.channels.cache.get(contentInfo.channelId)
      await channel.delete("컨텐츠 기획본 삭제 요청")
      
      const findIndex = prevContentList.findIndex((v) => v.name === contentName)
      prevContentList.splice(findIndex, 1)

      fs.writeFileSync("./content.json", JSON.stringify(prevContentList))

      return interaction.editReply({
        content: "삭제가 완료되었습니다."
      }).catch((e) => {
        console.log(e)
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
        content: "해당 채널에서 사용할 수 없는 명령어입니다. 맞는 기획방에서 사용해주세요!"
      })
    }

    if (!interaction.member.roles.cache.some(role => role.id === process.env.MANAGER_ROLE_ID)) {
      return interaction.editReply({
        content: "해당 기능은 팀장급 유저만 사용할 수 있습니다. 팀장님께 직접 요청해보세요!"
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

        if (content.status === STATUS.PRE_PLAN) {
          channel.send({
            embeds : [alertEmbed("지정", maker.id, makerType.toUpperCase())]
          })
          fs.writeFileSync("./content.json", JSON.stringify(prevContentList))
          return interaction.editReply({
            content: "성공적으로 지정하였습니다."
          })
        }

        const systemTeam = content.creator.system.map((v) => `<@${v}>`)
        const buildTeam = content.creator.build.map((v) => `<@${v}>`)
        const workshopTeam = content.creator.workshop.map((v) => `<@${v}>`)
        const modTeam = content.creator.mod.map((v) => `<@${v}>`)
        const resourcePackTeam = content.creator.resourcePack.map((v) => `<@${v}>`)

        const message = interaction.channel.messages.fetch(content.messageId).then((v) => {
          v.edit(
            `새로운 기획안입니다! 제작자분들은 확인해주시기 바랍니다!` +
            `\n- 컨텐츠 이름 : [ ${content.name} ]`+
            `\n- 컨텐츠 기획 담당자 : <@${content.plan_userId}>`+
            `\n- 컨텐츠 제작자`+
            `\n - 시스템(스크립트, 플러그인) 제작자 : ${systemTeam.length > 0 ? systemTeam : "없음"}`+
            `\n - 건축가 : ${buildTeam.length > 0 ? buildTeam : "없음"}`+
            `\n - 워크샵 제작자 : ${workshopTeam.length > 0 ? workshopTeam : "없음"}`+
            `\n - 모드 제작자 : ${modTeam.length > 0 ? modTeam : "없음"}`+
            `\n - 리소스팩 제작자 : ${resourcePackTeam.length > 0 ? resourcePackTeam : "없음"}`
          ).then((v) => {
            fs.writeFileSync("./content.json", JSON.stringify(prevContentList))
            return interaction.editReply({
              content: "성공적으로 지정하였습니다."
            })
          })
        })
      }
      
      if (interaction.options.getSubcommand() === "제외") {
        const makerType = interaction.options.getString("제작타입")
        const maker = interaction.options.getUser("유저")
        const findUser = content.creator[makerType].some(v => v === maker.id)

        if (!findUser) {
          return interaction.editReply({
            content: "해당 사용자는 지정되어 있지 않습니다."
          })
        }

        const findIndex = content.creator[makerType].indexOf(maker.id);
        content.creator[makerType].splice(findIndex, 1)
        const channel = interaction.guild.channels.cache.get(content.channelId)

        if (content.status === STATUS.PRE_PLAN) {
          channel.send({
            embeds : [alertEmbed("제거", maker.id, makerType.toUpperCase())]
          })
          fs.writeFileSync("./content.json", JSON.stringify(prevContentList))
          return interaction.editReply({
            content: "성공적으로 제거하였습니다."
          })
        }

        const systemTeam = content.creator.system.map((v) => `<@${v}>`)
        const buildTeam = content.creator.build.map((v) => `<@${v}>`)
        const workshopTeam = content.creator.workshop.map((v) => `<@${v}>`)
        const modTeam = content.creator.mod.map((v) => `<@${v}>`)
        const resourcePackTeam = content.creator.resourcePack.map((v) => `<@${v}>`)

        const message = interaction.channel.messages.fetch(content.messageId).then((v) => {
          v.edit(
            `새로운 기획안입니다! 제작자분들은 확인해주시기 바랍니다!` +
            `\n- 컨텐츠 이름 : [ ${content.name} ]`+
            `\n- 컨텐츠 기획 담당자 : <@${content.plan_userId}>`+
            `\n- 컨텐츠 제작자`+
            `\n - 시스템(스크립트, 플러그인) 제작자 : ${systemTeam.length > 0 ? systemTeam : "없음"}`+
            `\n - 건축가 : ${buildTeam.length > 0 ? buildTeam : "없음"}`+
            `\n - 워크샵 제작자 : ${workshopTeam.length > 0 ? workshopTeam : "없음"}`+
            `\n - 모드 제작자 : ${modTeam.length > 0 ? modTeam : "없음"}`+
            `\n - 리소스팩 제작자 : ${resourcePackTeam.length > 0 ? resourcePackTeam : "없음"}`
          ).then((v) => {
            fs.writeFileSync("./content.json", JSON.stringify(prevContentList))
            return interaction.editReply({
              content: "성공적으로 지정하였습니다."
            })
          })
        })
      }
    }

    if (interaction.options.getSubcommand() === "상태") {
      const contentName = interaction.options.getString("컨텐츠")
      const status = interaction.options.getString("상태")

      const prevContentList = contentList
      const checkContentName = prevContentList.some(user => user.name === contentName)

      if (!checkContentName) {
        return interaction.editReply({
          content: "컨텐츠가 존재하지 않습니다."
        })
      }

      const contentInfo = prevContentList.find((v) => v.name === contentName)
      
      if (interaction.channel.id !== contentInfo.channelId) {
        return interaction.editReply({
          content: "컨텐츠의 맞는 방으로 가서 명령어를 실행해주세요!"
        })
      }
      
      if (contentInfo.status === STATUS.PRE_PLAN) {
        if (status === STATUS.RUNNING || status === STATUS.ENDING || status === STATUS.UPGRADING) {
          return interaction.editReply({
            content: "해당 컨텐츠는 아직 기획본 상태입니다. 먼저 기획 상태로 바꿔주신 후 진행해주세요."
          })
        }

        contentInfo.status = STATUS.PLANING
        const category = interaction.guild.channels.cache.get(process.env.CATEGORY_PLANING)
        const user = interaction.guild.members.cache.get(contentInfo.plan_userId)

        const systemTeam = contentInfo.creator.system.map((v) => `<@${v}>`)
        const buildTeam = contentInfo.creator.build.map((v) => `<@${v}>`)
        const workshopTeam = contentInfo.creator.workshop.map((v) => `<@${v}>`)
        const modTeam = contentInfo.creator.mod.map((v) => `<@${v}>`)
        const resourcePackTeam = contentInfo.creator.resourcePack.map((v) => `<@${v}>`)
        
        await interaction.guild.channels.create({
          name: `${contentInfo.name}-${user.displayName}`,
          type: ChannelType.GuildText,
          parent: category.id
        }).then((v) => {
          contentInfo.channelId = v.id
          v.send({
            content: `새로운 기획안입니다! 제작자분들은 확인해주시기 바랍니다!` +
            `\n- 컨텐츠 이름 : [ ${contentInfo.name} ]`+
            `\n- 컨텐츠 기획 담당자 : <@${contentInfo.plan_userId}>`+
            `\n- 컨텐츠 제작자`+
            `\n - 시스템(스크립트, 플러그인) 제작자 : ${systemTeam.length > 0 ? systemTeam : "없음"}`+
            `\n - 건축가 : ${buildTeam.length > 0 ? buildTeam : "없음"}`+
            `\n - 워크샵 제작자 : ${workshopTeam.length > 0 ? workshopTeam : "없음"}`+
            `\n - 모드 제작자 : ${modTeam.length > 0 ? modTeam : "없음"}`+
            `\n - 리소스팩 제작자 : ${resourcePackTeam.length > 0 ? resourcePackTeam : "없음"}`
          }).then((v) => {
            contentInfo.messageId = v.id
            fs.writeFileSync("./content.json", JSON.stringify(prevContentList))
            interaction.channel.delete("기획화 완료")
          })
        })
      }

      if (status === contentInfo.status) {
        return interaction.editReply({
          content: "변경하려고 하는 상태로 이미 설정이 되어 있습니다."
        })
      }

      if (status === STATUS.PLANING) {
        if (content.status !== STATUS.PRE_PLAN) {
          return interaction.editReply({
            content: "이미 진행중인 컨텐츠는 다시 기획 상태로 되돌릴 수 없습니다."
          })
        }
      }
      
      if (status === STATUS.RUNNING) {
        contentInfo.status = STATUS.RUNNING
        const channel = interaction.guild.channels.cache.get(contentInfo.channelId)
        const category = interaction.guild.channels.cache.get(process.env.CATEGORY_RUNNING)
        
        channel.setParent(category)
        return interaction.editReply({
          content: "상태 변경이 완료되었습니다."
        })
      }

      if (status === STATUS.ENDING) {
        contentInfo.status = STATUS.ENDING
        const channel = interaction.guild.channels.cache.get(contentInfo.channelId)
        const category = interaction.guild.channels.cache.get(process.env.CATEGORY_END)

        channel.setParent(category)
        return interaction.editReply({
          content: "상태 변경이 완료되었습니다."
        })
      }

      if (status === STATUS.UPGRADING) {
        contentInfo.status = STATUS.UPGRADING
        const channel = interaction.guild.channels.cache.get(contentInfo.channelId)
        const category = interaction.guild.channels.cache.get(process.env.CATEGORY_UPGRADE)

        channel.setParent(category)
        return interaction.editReply({
          content: "상태 변경이 완료되었습니다."
        })
      }
    }
  }
}