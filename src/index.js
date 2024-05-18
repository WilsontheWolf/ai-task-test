import { Client, Constants } from "@projectdysnomia/dysnomia";
import RequestHandler from "./RequestHandler.js";

// Stolen from https://github.com/discordjs/discord.js/blob/main/packages/discord.js/src/util/Util.js#L543
function cleanContent(str, channel) {
    return str.replace(/<(@[!&]?|#)(\d{17,19})>/g, (match, type, id) => {
        switch (type) {
            case '@':
            case '@!': {
                const member = channel.guild?.members.get(id);
                if (member) {
                    return `@${member.nick || member.username}`;
                }

                const user = channel.client.users.get(id);
                return user ? `@${user.username}` : match;
            }
            case '@&': {
                const role = channel.guild.roles.get(id);
                return role ? `@${role.name}` : match;
            }
            case '#': {
                const mentionedChannel = channel.client.getChannel(id);
                return mentionedChannel ? `#${mentionedChannel.name}` : match;
            }
            default: {
                return match;
            }
        }
    })
        .replace(/<(:[\w~]+:)(\d{17,19})>/g, '$1');
}

const token = process.env.TOKEN;

const client = new Client("Bot " + token, {
    allowedMentions: {
        users: false,
        roles: false,
        repliedUser: true,
        everyone: false,
    },
    gateway: {
        intents: ["guilds", "guildMessages", "messageContent"],
    },
});

let pingRegex;
function getPingRegex() {
    if (pingRegex) return pingRegex;
    pingRegex = new RegExp(`^<@!?${client.user.id}> ?`);
    return pingRegex;
}
const responseMap = new Map();

/**
 * 
 * @param {import('@projectdysnomia/dysnomia').Message} message 
 * @param {*} data 
 * @returns 
 */
async function callbackHandler(message, data) {
    switch (data?.type) {
        case 'message':
            message.channel.createMessage(data.content);
            break;
        case 'username':
            return message.author.globalName || message.author.username;
        case 'userinfo':
            return `Name: ${message.author.username}`
        case 'done':
            if (!data.sent) {
                message.channel.createMessage('The AI finished but did not send anything.');
            }
            break;
        case 'askYN':
            return new Promise(async (resolve, reject) => {
                await message.channel.createMessage({
                    content: data.content, components: [
                        {
                            type: Constants.ComponentTypes.ACTION_ROW,
                            components: [
                                {
                                    type: Constants.ComponentTypes.BUTTON,
                                    style: Constants.ButtonStyles.SUCCESS,
                                    label: 'Yes',
                                    custom_id: `yes.${message.id}`,
                                },
                                {
                                    type: Constants.ComponentTypes.BUTTON,
                                    style: Constants.ButtonStyles.DANGER,
                                    label: 'No',
                                    custom_id: `no.${message.id}`,
                                }
                            ]
                        }
                    ]
                }).catch(reject);
                responseMap.set(message.id, resolve);
            });
        default:
            console.error('Unknown data type:', data);
            break;
    }
}

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.content.match(getPingRegex())) {
        const request = cleanContent(message.content.replace(pingRegex, ''), message.channel).trim();
        if(!request) return;
        const handler = new RequestHandler(request, callbackHandler.bind(null, message));
        await message.channel.sendTyping()
        await handler.doRequest().catch(e => {
            console.error(e);
            message.channel.createMessage(`There was an error processing your request: ${e}`)
        });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.type !== Constants.InteractionTypes.MESSAGE_COMPONENT) return;
    if (interaction.data.component_type !== Constants.ComponentTypes.BUTTON) return;

    const [type, id] = interaction.data.custom_id.split('.');
    if (!responseMap.has(id)) return;
    const resolve = responseMap.get(id);
    responseMap.delete(id);
    resolve(type);
    const button = {
        type: Constants.ComponentTypes.BUTTON,
        style: Constants.ButtonStyles.SUCCESS,
        label: 'Yes',
        custom_id: `yes.${id}`,
        disabled: true,
    };
    if (type === 'no') {
        button.style = Constants.ButtonStyles.DANGER;
        button.label = 'No';
    }
    await interaction.editParent({
        components: [
            {
                type: Constants.ComponentTypes.ACTION_ROW,
                components: [
                    button,
                ]
            }
        ]
    });
});

client.on("ready", () => {
    console.log(`Logged in as ${client.user.username}`);
});

client.connect();

// const handler = new RequestHandler(request, callbackHandler);

// handler.doRequest();