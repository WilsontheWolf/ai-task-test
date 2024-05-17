import { Client } from "@projectdysnomia/dysnomia";
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

/**
 * 
 * @param {import('@projectdysnomia/dysnomia').Message} message 
 * @param {*} data 
 * @returns 
 */
function callbackHandler(message, data) {
    switch (data?.type) {
        case 'message':
            message.channel.createMessage(data.content);
            break;
        case 'userinfo':
            return `Name: ${message.author.username}`
        case 'done':
            if (!data.sent) {
                message.channel.createMessage('The AI finished but did not send anything.');
            }
            break;
        default:
            console.error('Unknown data type:', data);
            break;
    }
}

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(`<@!${client.user.id}>`) || message.content.startsWith(`<@${client.user.id}>`)) {
        const request = cleanContent(message.content, message.channel);
        const handler = new RequestHandler(request, callbackHandler.bind(null, message));
        await message.channel.sendTyping()
        await handler.doRequest().catch(e => message.channel.createMessage(`Error: ${e}`));
    }
});

client.on("ready", () => {
    console.log(`Logged in as ${client.user.username}`);
});

client.connect();

// const handler = new RequestHandler(request, callbackHandler);

// handler.doRequest();