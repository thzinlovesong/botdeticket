module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        // Carregar descrição customizada se existir
        const storage = require('../utils/storage');
        let statusText = storage.loadCustomDescription();
        
        // Se não houver descrição customizada, usar a padrão
        if (!statusText) {
            statusText = String.fromCharCode(55357, 56460, 32, 67, 114, 105, 97, 100, 111, 32, 112, 111, 114, 32, 84, 104, 101, 100, 101, 118, 115, 32, 45, 32, 83, 105, 115, 116, 101, 109, 97, 32, 100, 101, 32, 84, 105, 99, 107, 101, 116, 115, 32, 68, 105, 115, 99, 111, 114, 100);
        }
        
        try {
            await client.user.setPresence({
                activities: [{
                    name: statusText,
                    type: 0
                }]
            });
            console.log('✅ Status inicializado');
        } catch (error) {
            console.error('⚠️ Erro ao definir status:', error.message);
        }
        
        console.log(`✅ Bot conectado como ${client.user.tag}!`);
        console.log(`📊 Servidores: ${client.guilds.cache.size}`);
        console.log(`👥 Usuários: ${client.users.cache.size}`);
        
        // Registrar comandos slash
        const { REST, Routes } = require('discord.js');
        const fs = require('fs');
        const path = require('path');
        
        const commands = [];
        const commandsPath = path.join(__dirname, '../commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const command = require(`../commands/${file}`);
            commands.push(command.data.toJSON());
        }

        const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

        (async () => {
            try {
                console.log('🔄 Registrando comandos slash...');

                await rest.put(
                    Routes.applicationCommands(client.user.id),
                    { body: commands },
                );

                console.log('✅ Comandos slash registrados com sucesso!');
            } catch (error) {
                console.error('❌ Erro ao registrar comandos:', error);
            }
        })();
    }
};

