const { EmbedBuilder } = require("discord.js")

module.exports = {
  infoEmbed : (content) => {
    const embed = new EmbedBuilder()
      .setTitle(`새로운 기획안 : ${content.name}`)
      .setDescription("새로운 기획안이 등록되었습니다!")
      .addFields({
        name: "기획자",
        value: `<@${content.plan_userId}>`
      },
      {
        name: "간단한 설명",
        value: `${content.description}`
      })

    if (content.plan_url === null) {
      embed.addFields({
        name: "URL",
        value: "등록되어 있지 않습니다. ( 등록됬다면 제목에 링크가 걸립니다. )"
      })
    } else {
      embed.setURL(content.plan_url)
    }
    
    return embed
  }
}