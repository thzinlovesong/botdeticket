const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember]
});

// Carregar comandos
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

// Carregar eventos
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// Sistema de tickets com persistência em arquivo
const storage = require('./utils/storage');

// Carregar configurações e tickets salvos
client.ticketConfigs = storage.loadConfigs();
client.activeTickets = storage.loadTickets();

// Salvar periodicamente (a cada 30 segundos)
setInterval(() => {
    storage.saveConfigs(client.ticketConfigs);
    storage.saveTickets(client.activeTickets);
}, 30000);

// Salvar ao desligar o bot
process.on('SIGINT', () => {
    console.log('Salvando configurações antes de desligar...');
    storage.saveConfigs(client.ticketConfigs);
    storage.saveTickets(client.activeTickets);
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Salvando configurações antes de desligar...');
    storage.saveConfigs(client.ticketConfigs);
    storage.saveTickets(client.activeTickets);
    process.exit(0);
});

client.login(process.env.TOKEN);

