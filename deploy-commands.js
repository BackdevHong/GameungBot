const {SlashCommandBuilder, REST, Routes, PermissionFlagsBits, ChannelType, SlashCommandStringOption} = require("discord.js")

const commands = [
    new SlashCommandBuilder()
        .setName("기획")
        .setDescription("기획 관련 명령어입니다.")
        .addSubcommand(
            sub => sub
                .setName('등록')
                .setDescription('등록 관련 명령어입니다')
                .addStringOption(
                    opt => opt
                        .setName("이름")
                        .setDescription("컨텐츠 이름을 넣어주세요!")
                        .setRequired(true)
                )
                .addStringOption(
                    opt => opt
                        .setName("설명")
                        .setDescription("간단한 컨텐츠 설명을 넣어주세요!")
                        .setRequired(true)
                )
                .addStringOption(
                    opt => opt
                        .setName("url")
                        .setDescription("기획본 URL을 넣어주세요! ( 노션, Google Docs 등 )")
                )
        )
        .addSubcommand(
            sub => sub
                .setName('수정')
                .setDescription('수정 관련 명령어입니다')
                .addStringOption(
                    opt => opt
                        .setName("컨텐츠")
                        .setDescription("수정할 컨텐츠 이름을 입력해주세요!")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(
                    opt => opt
                        .setName("이름")
                        .setDescription("새로운 컨텐츠 이름을 넣어주세요!")
                )
                .addStringOption(
                    opt => opt
                        .setName("설명")
                        .setDescription("새로운 설명을 적어주세요!")
                )
                .addStringOption(
                    opt => opt
                        .setName("url")
                        .setDescription("새로운 기획본 URL을 적어주세요!")
                )
        )
        .addSubcommand(
            sub => sub
                .setName("삭제")
                .setDescription("기획본을 삭제합니다.")
                .addStringOption(
                    opt => opt
                        .setName("컨텐츠")
                        .setDescription("수정할 컨텐츠 이름을 입력해주세요!")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ),
    new SlashCommandBuilder()
        .setName('관리')
        .setDescription('컨텐츠 관련 명령어입니다')
        .addSubcommandGroup(
            sub => sub
                .setName("제작자")
                .setDescription("제작자를 지정합니다.")
                .addSubcommand(
                    sub => sub
                        .setName("지정")
                        .setDescription("제작자를 지정합니다.")
                        .addStringOption(
                            opt => opt
                                .setName("제작타입")
                                .setDescription("제작자 타입을 기입해주세요.")
                                .addChoices(
                                    {
                                        name: "시스템 제작자",
                                        value: "system"
                                    },
                                    {
                                        name: "건축가",
                                        value: "build"
                                    },
                                    {
                                        name: "워크샵 제작자",
                                        value: "workshop"
                                    },
                                    {
                                        name: "모드 제작자",
                                        value: "mod"
                                    },
                                    {
                                        name: "리소스팩 제작자",
                                        value: "resourcePack"
                                    }
                                )
                                .setRequired(true)
                        )
                        .addUserOption(
                            opt => opt
                                .setName("유저")
                                .setDescription("유저를 기입해주세요.")
                                .setRequired(true)
                        )
                )
                .addSubcommand(
                    sub => sub
                        .setName("제외")
                        .setDescription("지정된 제작자를 제외합니다.")
                        .addStringOption(
                            opt => opt
                                .setName("제작타입")
                                .setDescription("제작자 타입을 기입해주세요.")
                                .addChoices(
                                    {
                                        name: "시스템 제작자",
                                        value: "system"
                                    },
                                    {
                                        name: "건축가",
                                        value: "build"
                                    },
                                    {
                                        name: "워크샵 제작자",
                                        value: "workshop"
                                    },
                                    {
                                        name: "모드 제작자",
                                        value: "mod"
                                    },
                                    {
                                        name: "리소스팩 제작자",
                                        value: "resourcePack"
                                    }
                                )
                                .setRequired(true)
                        )
                        .addUserOption(
                            opt => opt
                                .setName("유저")
                                .setDescription("유저를 기입해주세요.")
                                .setRequired(true)
                        )
                )
        )
        .addSubcommand(
            grp => grp
                .setName("상태")
                .setDescription("상태를 변경하는 명령어입니다")
                .addStringOption(
                    opt => opt
                        .setName("컨텐츠")
                        .setDescription("컨텐츠를 선택해주세요.")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(
                    opt => opt
                        .setName("상태")
                        .setDescription("변경할 상태를 기입해주세요.")
                        .setChoices(
                            {
                                name: "기획",
                                value: "PLANING"
                            },
                            {
                                name: "제작",
                                value: "RUNNING"
                            },
                            {
                                name: "완료",
                                value: "ENDING"
                            },
                            {
                                name: "업그레이드",
                                value: "UPGRADING"
                            }
                        )
                        .setRequired(true)
                )
        )

].map(command => command.toJSON());

module.exports = {
    registerCommands : (token, clientId) => {
        const rest = new REST({version: '10'}).setToken(token);
    
        rest.put(Routes.applicationCommands(clientId), {body: commands})
            .then(() => console.log('Successfully registered application commands.'))
            .catch(console.error);
    }
}