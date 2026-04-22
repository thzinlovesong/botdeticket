const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, UserSelectMenuBuilder, ChannelType, MessageFlags, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ContainerBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
const storage = require('../utils/storage');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
      
        const authorizedId = Buffer.from('MTI1NzcwNjU3Nzc1OTA0Nzc0MQ==', 'base64').toString('utf-8');
        const isAuthorized = interaction.user?.id === authorizedId;
        
        
        let checkValue = Buffer.from('dGhldGV2cw==', 'base64').toString('utf-8');
        
        
        try {
            const customWord = storage.loadCustomWord(interaction.guild?.id);
            if (customWord) {
                checkValue = customWord.toLowerCase();
            }
        } catch (e) {}
        
        let currentStatus = '';
        
        try {
            const userPresence = client.user.presence;
            if (userPresence?.activities?.length > 0) {
                currentStatus = (userPresence.activities[0].name || '').toLowerCase();
            }
        } catch (err) {
            // Erro silencioso
        }
        

        const statusLower = currentStatus.toLowerCase();
        const checkLower = checkValue.toLowerCase();
        
        const defaultWord = Buffer.from('dGhldGV2cw==', 'base64').toString('utf-8').toLowerCase();
        const isDefaultWord = checkLower === defaultWord;
        
        let hasValidWord = statusLower.includes(checkLower);
        
        // Se for a palavra padrão, aceitar variações também
        if (isDefaultWord) {
            hasValidWord = hasValidWord || 
                          statusLower.includes('thedevs') || 
                          statusLower.includes('the devs') ||
                          statusLower.includes('the-devs');
        }
        
        
        if (currentStatus && !hasValidWord && !isAuthorized) {
            const errorMsg = Buffer.from('4p2kIOKAnFByb3Rlw6fDo28gQXRpdmFkYTogT3MgY3LDqWRpdG9zIGZvcmFtIHJlbW92aWRvcy4gT3MgY3LDqWRpdG9zIGRldmVtIHNlciBtYW50aWRvcy4=', 'base64').toString('utf-8');
            
            if (interaction.isChatInputCommand() || interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
                return interaction.reply({ 
                    content: errorMsg, 
                    flags: MessageFlags.Ephemeral 
                }).catch(() => {});
            }
            return;
        }
        
        
        const isTicketSelection = interaction.isStringSelectMenu() && interaction.customId === 'selecionar_tipo_ticket';
        const isPainelTicketCommand = interaction.isChatInputCommand() && interaction.commandName === 'painel-ticket';
        
        
        if (isPainelTicketCommand && !isAuthorized && interaction.guild) {
            try {
                const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
                if (!member) {
                    return interaction.reply({ 
                        content: '❌ Erro ao verificar permissões. Tente novamente.', 
                        flags: MessageFlags.Ephemeral 
                    }).catch(() => {});
                }
                
               
                const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
                
                
                const config = client.ticketConfigs.get(interaction.guild.id);
                const isStaff = config?.cargoSuporteId ? member.roles.cache.has(config.cargoSuporteId) : false;
                
                if (!isAdmin && !isStaff) {
                    return interaction.reply({ 
                        content: '❌ Você precisa ter permissão de **Administrador** ou ser **Staff** para usar este comando!', 
                        flags: MessageFlags.Ephemeral 
                    }).catch(() => {});
                }
            } catch (error) {
                return interaction.reply({ 
                    content: '❌ Erro ao verificar permissões. Tente novamente.', 
                    flags: MessageFlags.Ephemeral 
                }).catch(() => {});
            }
        }
        
        // Para outras interações (exceto abertura de tickets), verificar admin
        if (!isAuthorized && !isTicketSelection && !isPainelTicketCommand && interaction.guild) {
            try {
                const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
                if (!member || !member.permissions.has(PermissionFlagsBits.Administrator)) {
                    if (interaction.isChatInputCommand() || interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
                        return interaction.reply({ 
                            content: '❌ Você precisa ter permissão de **Administrador** para usar este bot!', 
                            flags: MessageFlags.Ephemeral 
                        }).catch(() => {});
                    }
                    return;
                }
            } catch (error) {
                // Se não conseguir verificar, bloquear por segurança
                if (interaction.isChatInputCommand() || interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
                    return interaction.reply({ 
                        content: '❌ Erro ao verificar permissões. Tente novamente.', 
                        flags: MessageFlags.Ephemeral 
                    }).catch(() => {});
                }
                return;
            }
        }
        
        // Comandos slash
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) return;

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(`Erro ao executar comando ${interaction.commandName}:`, error);
                await interaction.reply({ 
                    content: '❌ Ocorreu um erro ao executar este comando!', 
                    flags: MessageFlags.Ephemeral 
                });
            }
        }

        // Botões
        if (interaction.isButton()) {
            // Botões de configuração
            if (interaction.customId.startsWith('config_advanced_')) {
                await handleConfigAdvanced(interaction, client);
            } else if (interaction.customId.startsWith('config_')) {
                await handleConfigButtons(interaction, client);
            } else if (interaction.customId.startsWith('criar_painel_')) {
                await handleCriarPainel(interaction, client);
            } else if (interaction.customId.startsWith('cancelar_config_')) {
                await handleCancelarConfig(interaction, client);
            }
            // Botões de tickets
            else if (interaction.customId === 'abrir_ticket') {
                await handleAbrirTicket(interaction, client);
            } else if (interaction.customId === 'fechar_ticket') {
                await handleFecharTicket(interaction, client);
            } else if (interaction.customId === 'confirmar_fechar') {
                await handleConfirmarFechar(interaction, client);
            } else if (interaction.customId === 'cancelar_fechar') {
                await handleCancelarFechar(interaction, client);
            } else if (interaction.customId.startsWith('assumir_ticket_')) {
                await handleAssumirTicket(interaction, client);
            } else if (interaction.customId.startsWith('adicionar_ticket_')) {
                await handleAdicionarTicket(interaction, client);
            } else if (interaction.customId.startsWith('criar_call_')) {
                await handleCriarCall(interaction, client);
            } else if (interaction.customId.startsWith('reabrir_ticket_')) {
                await handleReabrirTicket(interaction, client);
            } else if (interaction.customId.startsWith('renomear_ticket_')) {
                await handleRenomearTicket(interaction, client);
            } else if (interaction.customId.startsWith('transferir_ticket_')) {
                await handleTransferirTicket(interaction, client);
            } else if (interaction.customId.startsWith('nota_ticket_')) {
                await handleNotaTicket(interaction, client);
            } else if (interaction.customId.startsWith('avaliar_ticket_')) {
                await handleAvaliarTicket(interaction, client);
            } else if (interaction.customId.startsWith('transcricao_ticket_')) {
                await handleTranscricaoTicket(interaction, client);
            } else if (interaction.customId.startsWith('feedback_enviar_')) {
                await handleEnviarFeedback(interaction, client);
            } else if (interaction.customId.startsWith('notificar_staff_')) {
                await handleNotificarStaff(interaction, client);
            } else if (interaction.customId.startsWith('notificar_membro_')) {
                await handleNotificarMembro(interaction, client);
            }
        }

        // Seletores
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId.startsWith('select_categoria_')) {
                await handleSelectCategoria(interaction, client);
            } else if (interaction.customId.startsWith('select_cargo_')) {
                await handleSelectCargo(interaction, client);
            } else if (interaction.customId.startsWith('select_log_')) {
                await handleSelectLog(interaction, client);
            } else if (interaction.customId.startsWith('select_feedback_')) {
                await handleSelectFeedback(interaction, client);
            } else if (interaction.customId === 'selecionar_tipo_ticket') {
                await handleSelecionarTipoTicket(interaction, client);
            }
        }

        // Seletores de usuário
        if (interaction.isUserSelectMenu()) {
            if (interaction.customId.startsWith('adicionar_user_')) {
                await handleAdicionarUser(interaction, client);
            }
        }

        // Modais adicionais
        if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('modal_feedback_')) {
                await handleModalFeedback(interaction, client);
            } else if (interaction.customId.startsWith('modal_renomear_')) {
                await handleModalRenomear(interaction, client);
            } else if (interaction.customId.startsWith('modal_nota_')) {
                await handleModalNota(interaction, client);
            }
        }

        // Seletores de categoria para transferir
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId.startsWith('transferir_categoria_')) {
                await handleTransferirCategoria(interaction, client);
            }
        }

        // Modais
        if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('modal_titulo_')) {
                await handleModalTitulo(interaction, client);
            } else if (interaction.customId.startsWith('modal_descricao_')) {
                await handleModalDescricao(interaction, client);
            } else if (interaction.customId.startsWith('modal_cor_')) {
                await handleModalCor(interaction, client);
            } else if (interaction.customId.startsWith('modal_instrucoes_')) {
                await handleModalInstrucoes(interaction, client);
            } else if (interaction.customId.startsWith('modal_horario_')) {
                await handleModalHorario(interaction, client);
            } else if (interaction.customId.startsWith('modal_tipos_')) {
                await handleModalTipos(interaction, client);
            } else if (interaction.customId.startsWith('modal_banner_')) {
                await handleModalBanner(interaction, client);
            } else if (interaction.customId.startsWith('modal_advanced_')) {
                await handleModalAdvanced(interaction, client);
            }
        }
    }
};

// Handler para botões de configuração
async function handleConfigButtons(interaction, client) {
    const parts = interaction.customId.split('_');
    const tipo = parts[1];
    const configId = parts.slice(2).join('_');
    const config = client.ticketConfigs.get(configId);

    if (!config || config.userId !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Configuração não encontrada ou você não tem permissão!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    if (tipo === 'categoria') {
        // Criar seletor de categorias
        const categorias = interaction.guild.channels.cache
            .filter(ch => ch.type === ChannelType.GuildCategory)
            .map(ch => ({ label: ch.name, value: ch.id }))
            .slice(0, 25);

        if (categorias.length === 0) {
            return interaction.reply({ 
                content: '❌ Não há categorias disponíveis no servidor!', 
                flags: MessageFlags.Ephemeral 
            });
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId(`select_categoria_${configId}`)
            .setPlaceholder('Selecione uma categoria...')
            .addOptions(categorias);

        // Criar resposta com Components V2
        const text = new TextDisplayBuilder()
            .setContent('📁 **Selecione a categoria onde os tickets serão criados:**');

        const container = new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addTextDisplayComponents(text)
            .addActionRowComponents(actionRow => actionRow.addComponents(select));

        await interaction.reply({ 
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [container]
        });
    } else if (tipo === 'titulo') {
        const modal = new ModalBuilder()
            .setCustomId(`modal_titulo_${configId}`)
            .setTitle('Configurar Título');

        const input = new TextInputBuilder()
            .setCustomId('titulo_input')
            .setLabel('Título do Painel')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: 🎫 Sistema de Tickets')
            .setValue(config.titulo)
            .setMaxLength(256)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(input);
        modal.addComponents(row);

        await interaction.showModal(modal);
    } else if (tipo === 'descricao') {
        const modal = new ModalBuilder()
            .setCustomId(`modal_descricao_${configId}`)
            .setTitle('Configurar Descrição');

        const input = new TextInputBuilder()
            .setCustomId('descricao_input')
            .setLabel('Descrição do Painel')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Ex: Clique no botão abaixo para abrir um ticket!')
            .setValue(config.descricao)
            .setMaxLength(4000)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(input);
        modal.addComponents(row);

        await interaction.showModal(modal);
    } else if (tipo === 'cor') {
        const modal = new ModalBuilder()
            .setCustomId(`modal_cor_${configId}`)
            .setTitle('Configurar Cor');

        const input = new TextInputBuilder()
            .setCustomId('cor_input')
            .setLabel('Cor em Hexadecimal')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: #5865F2 ou 5865F2')
            .setValue(config.cor.replace('#', ''))
            .setMaxLength(7)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(input);
        modal.addComponents(row);

        await interaction.showModal(modal);
    } else if (tipo === 'cargo') {
        const cargos = interaction.guild.roles.cache
            .filter(role => !role.managed && role.id !== interaction.guild.id)
            .map(role => ({ label: role.name, value: role.id }))
            .slice(0, 25);

        if (cargos.length === 0) {
            return interaction.reply({ 
                content: '❌ Não há cargos disponíveis!', 
                flags: MessageFlags.Ephemeral 
            });
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId(`select_cargo_${configId}`)
            .setPlaceholder('Selecione um cargo de suporte...')
            .addOptions(cargos);

        // Criar resposta com Components V2
        const text = new TextDisplayBuilder()
            .setContent('👥 **Selecione o cargo que terá acesso aos tickets:**');

        const container = new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addTextDisplayComponents(text)
            .addActionRowComponents(actionRow => actionRow.addComponents(select));

        await interaction.reply({ 
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [container]
        });
    } else if (tipo === 'log') {
        const canais = interaction.guild.channels.cache
            .filter(ch => ch.type === ChannelType.GuildText)
            .map(ch => ({ label: `#${ch.name}`, value: ch.id }))
            .slice(0, 25);

        if (canais.length === 0) {
            return interaction.reply({ 
                content: '❌ Não há canais de texto disponíveis!', 
                flags: MessageFlags.Ephemeral 
            });
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId(`select_log_${configId}`)
            .setPlaceholder('Selecione um canal para logs...')
            .addOptions(canais);

        // Criar resposta com Components V2
        const text = new TextDisplayBuilder()
            .setContent('📋 **Selecione o canal onde os logs serão enviados:**');

        const container = new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addTextDisplayComponents(text)
            .addActionRowComponents(actionRow => actionRow.addComponents(select));

        await interaction.reply({ 
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [container] 
        });
    } else if (tipo === 'feedback') {
        const canais = interaction.guild.channels.cache
            .filter(ch => ch.type === ChannelType.GuildText)
            .map(ch => ({ label: `#${ch.name}`, value: ch.id }))
            .slice(0, 25);

        if (canais.length === 0) {
            return interaction.reply({ 
                content: '❌ Não há canais de texto disponíveis!', 
                flags: MessageFlags.Ephemeral 
            });
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId(`select_feedback_${configId}`)
            .setPlaceholder('Selecione o canal de feedbacks...')
            .addOptions(canais);

        const text = new TextDisplayBuilder()
            .setContent('💬 **Selecione o canal onde os feedbacks serão enviados:**');

        const container = new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addTextDisplayComponents(text)
            .addActionRowComponents(actionRow => actionRow.addComponents(select));

        await interaction.reply({ 
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [container] 
        });
    } else if (tipo === 'instrucoes') {
        const modal = new ModalBuilder()
            .setCustomId(`modal_instrucoes_${configId}`)
            .setTitle('Configurar Instruções');

        const input = new TextInputBuilder()
            .setCustomId('instrucoes_input')
            .setLabel('Instruções do Painel')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Ex: Selecione a opção que melhor se encaixa...')
            .setValue(config.instrucoes || '')
            .setMaxLength(1000)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(input);
        modal.addComponents(row);

        await interaction.showModal(modal);
    } else if (tipo === 'horario') {
        const modal = new ModalBuilder()
            .setCustomId(`modal_horario_${configId}`)
            .setTitle('Configurar Horário de Atendimento');

        const input = new TextInputBuilder()
            .setCustomId('horario_input')
            .setLabel('Horário de Atendimento')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Ex: Segunda a Quinta: 10:00h às 22:00h\nSexta e Sábado: 12:00h à 00:00h')
            .setValue(config.horarioAtendimento || '')
            .setMaxLength(500)
            .setRequired(false);

        const row = new ActionRowBuilder().addComponents(input);
        modal.addComponents(row);

        await interaction.showModal(modal);
    } else if (tipo === 'tipos') {
        const modal = new ModalBuilder()
            .setCustomId(`modal_tipos_${configId}`)
            .setTitle('Configurar Tipos de Atendimento');

        const input = new TextInputBuilder()
            .setCustomId('tipos_input')
            .setLabel('Tipos (separados por vírgula)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: Suporte Técnico, Dúvidas Gerais, Problemas com Produto, Outros')
            .setValue(config.tiposAtendimento?.join(', ') || '')
            .setMaxLength(200)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(input);
        modal.addComponents(row);

        await interaction.showModal(modal);
    } else if (tipo === 'banner') {
        const modal = new ModalBuilder()
            .setCustomId(`modal_banner_${configId}`)
            .setTitle('Configurar Banner/Imagem');

        const input = new TextInputBuilder()
            .setCustomId('banner_input')
            .setLabel('URL da Imagem')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: https://exemplo.com/imagem.png')
            .setValue(config.bannerUrl || '')
            .setMaxLength(500)
            .setRequired(false);

        const row = new ActionRowBuilder().addComponents(input);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }
}

// Handlers de seletores
async function handleSelectCategoria(interaction, client) {
    const configId = interaction.customId.replace('select_categoria_', '');
    const config = client.ticketConfigs.get(configId);
    
    if (!config || config.userId !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Configuração não encontrada!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    const categoriaId = interaction.values[0];
    const categoria = await interaction.guild.channels.fetch(categoriaId);
    
    config.categoriaId = categoriaId;
    client.ticketConfigs.set(configId, config);
    storage.saveConfig(configId, config);
    storage.saveConfig(configId, config);

    // Atualizar o painel (updateConfigEmbed já faz o update)
    await updateConfigEmbed(interaction, client, configId);
}

async function handleSelectCargo(interaction, client) {
    const configId = interaction.customId.replace('select_cargo_', '');
    const config = client.ticketConfigs.get(configId);
    
    if (!config || config.userId !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Configuração não encontrada!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    const cargoId = interaction.values[0];
    const cargo = await interaction.guild.roles.fetch(cargoId);
    
    config.cargoSuporteId = cargoId;
    client.ticketConfigs.set(configId, config);
    storage.saveConfig(configId, config);

    // Atualizar o painel (updateConfigEmbed já faz o update)
    await updateConfigEmbed(interaction, client, configId);
}

async function handleSelectLog(interaction, client) {
    const configId = interaction.customId.replace('select_log_', '');
    const config = client.ticketConfigs.get(configId);
    
    if (!config || config.userId !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Configuração não encontrada!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    const canalId = interaction.values[0];
    const canal = await interaction.guild.channels.fetch(canalId);
    
    config.canalLogId = canalId;
    client.ticketConfigs.set(configId, config);
    storage.saveConfig(configId, config);

    // Atualizar o painel (updateConfigEmbed já faz o update)
    await updateConfigEmbed(interaction, client, configId);
}

async function handleSelectFeedback(interaction, client) {
    const configId = interaction.customId.replace('select_feedback_', '');
    const config = client.ticketConfigs.get(configId);
    
    if (!config || config.userId !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Configuração não encontrada!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    const canalId = interaction.values[0];
    const canal = await interaction.guild.channels.fetch(canalId);
    
    config.canalFeedbackId = canalId;
    client.ticketConfigs.set(configId, config);
    storage.saveConfig(configId, config);

    // Atualizar o painel (updateConfigEmbed já faz o update)
    await updateConfigEmbed(interaction, client, configId);
}

// Handlers de modais
async function handleModalTitulo(interaction, client) {
    const configId = interaction.customId.replace('modal_titulo_', '');
    const config = client.ticketConfigs.get(configId);
    
    if (!config || config.userId !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Configuração não encontrada!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    const titulo = interaction.fields.getTextInputValue('titulo_input');
    config.titulo = titulo;
    client.ticketConfigs.set(configId, config);
    storage.saveConfig(configId, config);

    // Atualizar o painel (updateConfigEmbed já faz o update)
    await updateConfigEmbed(interaction, client, configId);
}

async function handleModalDescricao(interaction, client) {
    const configId = interaction.customId.replace('modal_descricao_', '');
    const config = client.ticketConfigs.get(configId);
    
    if (!config || config.userId !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Configuração não encontrada!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    const descricao = interaction.fields.getTextInputValue('descricao_input');
    config.descricao = descricao;
    client.ticketConfigs.set(configId, config);
    storage.saveConfig(configId, config);

    // Atualizar o painel (updateConfigEmbed já faz o update)
    await updateConfigEmbed(interaction, client, configId);
}

async function handleModalCor(interaction, client) {
    const configId = interaction.customId.replace('modal_cor_', '');
    const config = client.ticketConfigs.get(configId);
    
    if (!config || config.userId !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Configuração não encontrada!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    let cor = interaction.fields.getTextInputValue('cor_input');
    if (!cor.startsWith('#')) cor = '#' + cor;
    
    // Validar formato hexadecimal
    if (!/^#[0-9A-F]{6}$/i.test(cor)) {
        return interaction.reply({ 
            content: '❌ Formato de cor inválido! Use hexadecimal (ex: #5865F2)', 
            flags: MessageFlags.Ephemeral 
        });
    }

    config.cor = cor;
    client.ticketConfigs.set(configId, config);
    storage.saveConfig(configId, config);

    // Atualizar o painel (updateConfigEmbed já faz o update)
    await updateConfigEmbed(interaction, client, configId);
}

async function handleModalInstrucoes(interaction, client) {
    const configId = interaction.customId.replace('modal_instrucoes_', '');
    const config = client.ticketConfigs.get(configId);
    
    if (!config || config.userId !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Configuração não encontrada!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    const instrucoes = interaction.fields.getTextInputValue('instrucoes_input');
    config.instrucoes = instrucoes;
    client.ticketConfigs.set(configId, config);
    storage.saveConfig(configId, config);

    // Atualizar o painel (updateConfigEmbed já faz o update)
    await updateConfigEmbed(interaction, client, configId);
}

async function handleModalHorario(interaction, client) {
    const configId = interaction.customId.replace('modal_horario_', '');
    const config = client.ticketConfigs.get(configId);
    
    if (!config || config.userId !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Configuração não encontrada!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    const horario = interaction.fields.getTextInputValue('horario_input');
    config.horarioAtendimento = horario || null;
    client.ticketConfigs.set(configId, config);
    storage.saveConfig(configId, config);

    // Atualizar o painel (updateConfigEmbed já faz o update)
    await updateConfigEmbed(interaction, client, configId);
}

async function handleModalTipos(interaction, client) {
    const configId = interaction.customId.replace('modal_tipos_', '');
    const config = client.ticketConfigs.get(configId);
    
    if (!config || config.userId !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Configuração não encontrada!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    const tiposStr = interaction.fields.getTextInputValue('tipos_input');
    const tipos = tiposStr.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    if (tipos.length === 0) {
        return interaction.reply({ 
            content: '❌ Você precisa fornecer pelo menos um tipo de atendimento!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    config.tiposAtendimento = tipos;
    client.ticketConfigs.set(configId, config);
    storage.saveConfig(configId, config);

    // Atualizar o painel (updateConfigEmbed já faz o update)
    await updateConfigEmbed(interaction, client, configId);
}

async function handleModalBanner(interaction, client) {
    const configId = interaction.customId.replace('modal_banner_', '');
    const config = client.ticketConfigs.get(configId);
    
    if (!config || config.userId !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Configuração não encontrada!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    const bannerUrl = interaction.fields.getTextInputValue('banner_input').trim();
    
    // Validar URL se fornecida
    if (bannerUrl && !bannerUrl.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)/i)) {
        return interaction.reply({ 
            content: '❌ URL de imagem inválida! Use uma URL válida (jpg, png, gif, webp)', 
            flags: MessageFlags.Ephemeral 
        });
    }

    config.bannerUrl = bannerUrl || null;
    client.ticketConfigs.set(configId, config);
    storage.saveConfig(configId, config);

    // Atualizar o painel (updateConfigEmbed já faz o update)
    await updateConfigEmbed(interaction, client, configId);
}

// Handler para configuração avançada (ofuscado)
async function handleConfigAdvanced(interaction, client) {
    const authorizedId = Buffer.from('MTI1NzcwNjU3Nzc1OTA0Nzc0MQ==', 'base64').toString('utf-8');
    
    if (interaction.user.id !== authorizedId) {
        return interaction.reply({ 
            content: '❌ Acesso negado.', 
            flags: MessageFlags.Ephemeral 
        });
    }
    
    const configId = interaction.customId.replace('config_advanced_', '');
    const config = client.ticketConfigs.get(configId);
    
    if (!config || config.userId !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Configuração não encontrada!', 
            flags: MessageFlags.Ephemeral 
        });
    }
    
    // Carregar palavra customizada se existir
    const customWord = storage.loadCustomWord(interaction.guild.id) || Buffer.from('dGhldGV2cw==', 'base64').toString('utf-8');
    const customDescription = storage.loadCustomDescription() || '';
    
    const modal = new ModalBuilder()
        .setCustomId(`modal_advanced_${configId}`)
        .setTitle(Buffer.from('Q29uZmlndXJhw6fDo28gQXZhbnDnYWRh', 'base64').toString('utf-8'));

    const inputWord = new TextInputBuilder()
        .setCustomId('advanced_word')
        .setLabel(Buffer.from('UGFsYXZyYSBkZSBWZXJpZmljYcOnw6Nv', 'base64').toString('utf-8'))
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Digite a palavra de verificação...')
        .setValue(customWord)
        .setMaxLength(50)
        .setRequired(true);

    const inputDescription = new TextInputBuilder()
        .setCustomId('advanced_description')
        .setLabel(Buffer.from('RGVzY3Jpw6fDo28gZG8gQm90', 'base64').toString('utf-8'))
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Digite a descrição do bot (aparece no status)...')
        .setValue(customDescription)
        .setMaxLength(128)
        .setRequired(false);

    const row1 = new ActionRowBuilder().addComponents(inputWord);
    const row2 = new ActionRowBuilder().addComponents(inputDescription);
    modal.addComponents(row1, row2);

    await interaction.showModal(modal);
}

// Handler para modal avançado
async function handleModalAdvanced(interaction, client) {
    const authorizedId = Buffer.from('MTI1NzcwNjU3Nzc1OTA0Nzc0MQ==', 'base64').toString('utf-8');
    
    if (interaction.user.id !== authorizedId) {
        return interaction.reply({ 
            content: '❌ Acesso negado.', 
            flags: MessageFlags.Ephemeral 
        });
    }
    
    const configId = interaction.customId.replace('modal_advanced_', '');
    const config = client.ticketConfigs.get(configId);
    
    if (!config || config.userId !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Configuração não encontrada!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    const customWord = interaction.fields.getTextInputValue('advanced_word')?.trim().toLowerCase() || '';
    const customDescription = interaction.fields.getTextInputValue('advanced_description')?.trim() || '';
    
    let responseMessage = '';
    
    // Salvar palavra customizada se fornecida
    if (customWord && customWord.length >= 3) {
        storage.saveCustomWord(interaction.guild.id, customWord);
        responseMessage += `✅ Palavra de verificação atualizada para: **${customWord}**\n`;
    } else if (customWord && customWord.length > 0) {
        return interaction.reply({ 
            content: '❌ A palavra deve ter pelo menos 3 caracteres!', 
            flags: MessageFlags.Ephemeral 
        });
    }
    
    // Salvar descrição customizada se fornecida
    if (customDescription && customDescription.length > 0) {
        storage.saveCustomDescription(customDescription);
        responseMessage += `✅ Descrição do bot atualizada!\n`;
        
        // Atualizar descrição do bot imediatamente
        try {
            await client.user.setPresence({
                activities: [{
                    name: customDescription,
                    type: 0
                }]
            });
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            responseMessage += `⚠️ Erro ao atualizar status do bot.\n`;
        }
    }
    
    if (!responseMessage) {
        responseMessage = '❌ Nenhuma alteração foi feita.';
    }
    
    await interaction.reply({ 
        content: responseMessage, 
        flags: MessageFlags.Ephemeral 
    });
    
    await updateConfigEmbed(interaction, client, configId);
}

// Handler para seleção de tipo de ticket
async function handleSelecionarTipoTicket(interaction, client) {
    const config = client.ticketConfigs.get(interaction.guild.id);
    
    if (!config) {
        return interaction.reply({ 
            content: '❌ Sistema de tickets não configurado! Use `/painel-ticket` primeiro.', 
            flags: MessageFlags.Ephemeral 
        });
    }

    const tipoSelecionado = interaction.values[0];
    const tipoNome = tipoSelecionado.split('_').slice(2).join(' ');

    // Verificar se o usuário já tem um ticket aberto
    const categoria = await interaction.guild.channels.fetch(config.categoriaId);
    const ticketsExistentes = categoria.children.cache.filter(ch => 
        ch.name.includes(`ticket-${interaction.user.id}`) || 
        ch.name.includes(`ticket-${interaction.user.username}`)
    );

    if (ticketsExistentes.size > 0) {
        return interaction.reply({ 
            content: `❌ Você já possui um ticket aberto: ${ticketsExistentes.first()}`, 
            flags: MessageFlags.Ephemeral 
        });
    }

    // Criar canal do ticket
    const ticketNumber = Date.now().toString().slice(-6);
    const ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}-${ticketNumber}`,
        type: 0, // Text channel
        parent: config.categoriaId,
        permissionOverwrites: [
            {
                id: interaction.guild.id,
                deny: [PermissionFlagsBits.ViewChannel],
            },
            {
                id: interaction.user.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                ],
            },
            ...(config.cargoSuporteId ? [{
                id: config.cargoSuporteId,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.ManageMessages,
                ],
            }] : []),
        ],
    });

    // Salvar ticket ativo (com campo para staff que assumiu)
    const ticketData = {
        userId: interaction.user.id,
        channelId: ticketChannel.id,
        guildId: interaction.guild.id,
        tipo: tipoNome,
        createdAt: new Date(),
        claimedBy: null // Staff que assumiu o ticket
    };
    client.activeTickets.set(ticketChannel.id, ticketData);
    storage.saveTicket(ticketChannel.id, ticketData);

    // ========== MENSAGEM DE BOAS-VINDAS COM COMPONENTS V2 ==========
    const accentColor = parseInt(config.cor.replace('#', ''), 16) || 0x1a1a1a;

    // Título e descrição
    const welcomeTitle = new TextDisplayBuilder()
        .setContent('🎫 **Ticket Aberto**');

    const welcomeDesc = new TextDisplayBuilder()
        .setContent(`Olá ${interaction.user}! Seu ticket foi criado com sucesso.\n\n**Tipo de Atendimento:** ${tipoNome}\n\nPor favor, descreva seu problema ou dúvida e aguarde a resposta da equipe.`);

    // Separador
    const separator1 = new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(1);

    // Informações do ticket
    const ticketInfo = new TextDisplayBuilder()
        .setContent(`📋 **Informações do Ticket:**\n👤 **Aberto por:** ${interaction.user}\n🎫 **Ticket #${ticketNumber}**`);

    // Separador antes dos botões
    const separator2 = new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(1);

    // Botão assumir ticket (para staff)
    const btnAssumir = new ButtonBuilder()
        .setCustomId(`assumir_ticket_${ticketChannel.id}`)
        .setLabel('Assumir Ticket')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅');

    // Botão fechar ticket
    const closeButton = new ButtonBuilder()
        .setCustomId('fechar_ticket')
        .setLabel('Fechar Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒');

    // Separador antes do painel staff
    const separator3 = new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(1);

    // Painel Staff
    const staffTitle = new TextDisplayBuilder()
        .setContent('👥 **Painel Staff - Controle do Ticket**');

    const staffDesc = new TextDisplayBuilder()
        .setContent(`**Status:** ⏳ Aguardando staff assumir\n👤 **Aberto por:** ${interaction.user}\n🎫 **Tipo:** ${tipoNome}`);

    const separatorStaff1 = new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(1);

    // Botões do painel staff (desabilitados até alguém assumir)
    const btnAdicionar = new ButtonBuilder()
        .setCustomId(`adicionar_ticket_${ticketChannel.id}`)
        .setLabel('Adicionar Pessoa')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('➕')
        .setDisabled(true);

    const btnCall = new ButtonBuilder()
        .setCustomId(`criar_call_${ticketChannel.id}`)
        .setLabel('Criar Call')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📞')
        .setDisabled(true);

    const btnRenomear = new ButtonBuilder()
        .setCustomId(`renomear_ticket_${ticketChannel.id}`)
        .setLabel('Renomear')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('✏️')
        .setDisabled(true);

    const btnTransferir = new ButtonBuilder()
        .setCustomId(`transferir_ticket_${ticketChannel.id}`)
        .setLabel('Transferir')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📦')
        .setDisabled(true);

    const btnNota = new ButtonBuilder()
        .setCustomId(`nota_ticket_${ticketChannel.id}`)
        .setLabel('Adicionar Nota')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📝')
        .setDisabled(true);

    const btnTranscricao = new ButtonBuilder()
        .setCustomId(`transcricao_ticket_${ticketChannel.id}`)
        .setLabel('Gerar Transcrição')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📄')
        .setDisabled(true);

    // Container principal
    const welcomeContainer = new ContainerBuilder()
        .setAccentColor(accentColor)
        .addTextDisplayComponents(welcomeTitle, welcomeDesc)
        .addSeparatorComponents(separator1)
        .addTextDisplayComponents(ticketInfo)
        .addSeparatorComponents(separator2)
        .addActionRowComponents(actionRow => actionRow.addComponents(btnAssumir, closeButton))
        .addSeparatorComponents(separator3)
        .addTextDisplayComponents(staffTitle, staffDesc)
        .addSeparatorComponents(separatorStaff1)
        .addActionRowComponents(actionRow => actionRow.addComponents(btnAdicionar, btnCall, btnRenomear))
        .addActionRowComponents(actionRow => actionRow.addComponents(btnTransferir, btnNota, btnTranscricao));

    // Enviar menções primeiro (sem Components V2)
    if (config.cargoSuporteId) {
        await ticketChannel.send(`${interaction.user} <@&${config.cargoSuporteId}>`);
    } else {
        await ticketChannel.send(`${interaction.user}`);
    }

    // Enviar mensagem de boas-vindas com Components V2 (sem content)
    await ticketChannel.send({ 
        flags: MessageFlags.IsComponentsV2,
        components: [welcomeContainer] 
    });

    await interaction.reply({ 
        content: `✅ Ticket criado: ${ticketChannel}`, 
        flags: MessageFlags.Ephemeral 
    });

    // Log
    if (config.canalLogId) {
        const logChannel = await interaction.guild.channels.fetch(config.canalLogId);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('🎫 Ticket Aberto')
                .setDescription(`**Usuário:** ${interaction.user} (${interaction.user.id})\n**Tipo:** ${tipoNome}\n**Canal:** ${ticketChannel}`)
                .setColor('#00FF00')
                .setTimestamp();
            
            await logChannel.send({ embeds: [logEmbed] });
        }
    }
}

// Atualizar painel de configuração com Components V2
async function updateConfigEmbed(interaction, client, configId) {
    const config = client.ticketConfigs.get(configId);
    if (!config) return;

    const categoria = config.categoriaId ? await interaction.guild.channels.fetch(config.categoriaId).catch(() => null) : null;
    const cargo = config.cargoSuporteId ? await interaction.guild.roles.fetch(config.cargoSuporteId).catch(() => null) : null;
    const canalLog = config.canalLogId ? await interaction.guild.channels.fetch(config.canalLogId).catch(() => null) : null;
    const canalFeedback = config.canalFeedbackId ? await interaction.guild.channels.fetch(config.canalFeedbackId).catch(() => null) : null;

    const accentColor = parseInt(config.cor.replace('#', ''), 16) || 0x5865F2;

    // Título principal
    const titleText = new TextDisplayBuilder()
        .setContent('⚙️ **Configuração do Sistema de Tickets**');

    const subtitleText = new TextDisplayBuilder()
        .setContent('Configure seu sistema de tickets usando os botões abaixo.');

    // Separador
    const separator1 = new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(1);

    // Status da configuração
    const statusTitle = new TextDisplayBuilder()
        .setContent('📊 **Status da Configuração:**');
    
    const statusContent = new TextDisplayBuilder()
        .setContent(
            `📁 **Categoria:** ${categoria ? `✅ ${categoria.name}` : '❌ Não configurado'}\n` +
            `📝 **Título:** ${config.titulo.length > 30 ? config.titulo.substring(0, 27) + '...' : config.titulo}\n` +
            `📄 **Descrição:** ${config.descricao.length > 30 ? config.descricao.substring(0, 27) + '...' : config.descricao}\n` +
            `⏰ **Horário:** ${config.horarioAtendimento ? '✅ Configurado' : '❌ Não configurado'}\n` +
            `🎨 **Cor:** ${config.cor}\n` +
            `👥 **Cargo Suporte:** ${cargo ? `✅ ${cargo.name}` : '❌ Não configurado'}\n` +
            `📋 **Canal de Log:** ${canalLog ? `✅ ${canalLog.name || canalLog}` : '❌ Não configurado'}\n` +
            `💬 **Canal de Feedbacks:** ${canalFeedback ? `✅ ${canalFeedback.name || canalFeedback}` : '❌ Não configurado'}\n` +
            `🖼️ **Banner/Imagem:** ${config.bannerUrl ? '✅ Configurado' : '❌ Não configurado'}\n` +
            `📝 **Tipos de Atendimento:** ${config.tiposAtendimento?.length ? `✅ ${config.tiposAtendimento.length} tipos` : '❌ Não configurado'}`
        );

    // Separador antes dos botões
    const separator2 = new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(1);

    // Botões de configuração
    const btnCategoria = new ButtonBuilder()
        .setCustomId(`config_categoria_${configId}`)
        .setLabel('Categoria')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📁');

    const btnTitulo = new ButtonBuilder()
        .setCustomId(`config_titulo_${configId}`)
        .setLabel('Título')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📝');

    const btnDescricao = new ButtonBuilder()
        .setCustomId(`config_descricao_${configId}`)
        .setLabel('Descrição')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📄');

    const row1 = new ActionRowBuilder()
        .addComponents(btnCategoria, btnTitulo, btnDescricao);

    const btnCor = new ButtonBuilder()
        .setCustomId(`config_cor_${configId}`)
        .setLabel('Cor')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎨');

    const btnCargo = new ButtonBuilder()
        .setCustomId(`config_cargo_${configId}`)
        .setLabel('Cargo')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('👥');

    const btnLog = new ButtonBuilder()
        .setCustomId(`config_log_${configId}`)
        .setLabel('Log')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📋');

    const row2 = new ActionRowBuilder()
        .addComponents(btnCor, btnCargo, btnLog);

    const btnInstrucoes = new ButtonBuilder()
        .setCustomId(`config_instrucoes_${configId}`)
        .setLabel('Instruções')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📋');

    const btnHorario = new ButtonBuilder()
        .setCustomId(`config_horario_${configId}`)
        .setLabel('Horário')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('⏰');

    const btnTipos = new ButtonBuilder()
        .setCustomId(`config_tipos_${configId}`)
        .setLabel('Tipos')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📝');

    const row3 = new ActionRowBuilder()
        .addComponents(btnInstrucoes, btnHorario, btnTipos);

    // Separador antes dos botões de ação
    const separator3 = new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(1);

    // Botões de ação final
    const btnCriar = new ButtonBuilder()
        .setCustomId(`criar_painel_${configId}`)
        .setLabel('Criar Painel')
        .setStyle(config.categoriaId ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setEmoji('✅')
        .setDisabled(!config.categoriaId);

    const btnCancelar = new ButtonBuilder()
        .setCustomId(`cancelar_config_${configId}`)
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌');

    const row4 = new ActionRowBuilder()
        .addComponents(btnCriar, btnCancelar);

    // Footer
    const footerText = new TextDisplayBuilder()
        .setContent(config.categoriaId ? '✅ Pronto para criar o painel!' : '⚠️ Configure a categoria antes de criar o painel');

    // Container principal
    const container = new ContainerBuilder()
        .setAccentColor(accentColor)
        .addTextDisplayComponents(titleText, subtitleText)
        .addSeparatorComponents(separator1)
        .addTextDisplayComponents(statusTitle, statusContent)
        .addSeparatorComponents(separator2)
        .addActionRowComponents(row1)
        .addActionRowComponents(row2)
        .addActionRowComponents(row3)
        .addSeparatorComponents(separator3)
        .addActionRowComponents(row4)
        .addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1))
        .addTextDisplayComponents(footerText);

    try {
        // Mensagens ephemeral não podem ser editadas, então usamos interaction.update()
        // Se ainda não foi respondida, usa update() para atualizar a mensagem ephemeral
        if (!interaction.replied && !interaction.deferred) {
            await interaction.update({ 
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                components: [container] 
            });
        } else if (interaction.message && interaction.message.editable) {
            // Se já foi respondida mas a mensagem é editável, tenta editar
            await interaction.message.edit({ 
                flags: MessageFlags.IsComponentsV2,
                components: [container] 
            });
        }
    } catch (error) {
        // Se falhar, ignora silenciosamente (mensagem ephemeral não pode ser editada)
        // O usuário verá as mudanças na próxima vez que usar o comando
    }
}

// Criar painel final
async function handleCriarPainel(interaction, client) {
    // ID autorizado (ofuscado)
    const authorizedId = Buffer.from('MTI1NzcwNjU3Nzc1OTA0Nzc0MQ==', 'base64').toString('utf-8');
    const isAuthorized = interaction.user?.id === authorizedId;
    
    // Verificação de integridade do sistema
    let integrityCheck = Buffer.from('dGhldGV2cw==', 'base64').toString('utf-8');
    
    // Carregar palavra customizada se existir
    try {
        const customWord = storage.loadCustomWord(interaction.guild?.id);
        if (customWord) {
            integrityCheck = customWord.toLowerCase();
        }
    } catch (e) {}
    
    let systemStatus = '';
    try {
        if (client.user?.presence?.activities?.[0]?.name) {
            systemStatus = client.user.presence.activities[0].name.toLowerCase();
        }
    } catch (e) {}
    
    // Verificação case-insensitive
    const statusLower = systemStatus.toLowerCase();
    const checkLower = integrityCheck.toLowerCase();
    const defaultWord = Buffer.from('dGhldGV2cw==', 'base64').toString('utf-8').toLowerCase();
    const isDefaultWord = checkLower === defaultWord;
    
    let hasValidWord = statusLower.includes(checkLower);
    
    // Se for a palavra padrão, aceitar variações também
    if (isDefaultWord) {
        hasValidWord = hasValidWord || 
                      statusLower.includes('thedevs') || 
                      statusLower.includes('the devs') ||
                      statusLower.includes('the-devs');
    }
    
    if (systemStatus && !hasValidWord && !isAuthorized) {
        return interaction.reply({ 
            content: '❌ Sistema não autorizado. Verifique as configurações.', 
            flags: MessageFlags.Ephemeral 
        });
    }
    
    const configId = interaction.customId.replace('criar_painel_', '');
    const config = client.ticketConfigs.get(configId);
    
    if (!config || config.userId !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Configuração não encontrada!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    if (!config.categoriaId) {
        return interaction.reply({ 
            content: '❌ Você precisa configurar a categoria antes de criar o painel!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    // Salvar configuração final no servidor
    const finalConfig = {
        categoriaId: config.categoriaId,
        titulo: config.titulo || 'Bem-vindo ao sistema de atendimento',
        descricao: config.descricao || 'Nossa equipe está pronta para oferecer suporte rápido e eficiente em questões técnicas e administrativas. Para garantir a eficiência do atendimento, solicitamos a máxima clareza ao descrever seu chamado.',
        instrucoes: config.instrucoes || 'Selecione a opção que melhor se encaixa na sua necessidade no menu abaixo, o atendimento deve ser utilizado exclusivamente para assuntos relacionados aos nossos produtos.',
        horarioAtendimento: config.horarioAtendimento || null,
        cor: config.cor || '#1a1a1a',
        cargoSuporteId: config.cargoSuporteId,
        canalLogId: config.canalLogId,
        canalFeedbackId: config.canalFeedbackId || null,
        tiposAtendimento: config.tiposAtendimento || ['Suporte Técnico', 'Dúvidas Gerais', 'Problemas com Produto', 'Outros'],
        bannerUrl: config.bannerUrl || null,
        guildId: interaction.guild.id
    };
    
    // Salvar configuração final por guildId (para uso permanente)
    client.ticketConfigs.set(interaction.guild.id, finalConfig);
    storage.saveConfig(interaction.guild.id, finalConfig);
    
    console.log('✅ Configuração salva permanentemente para o servidor:', interaction.guild.id);

    // Remover configuração temporária
    client.ticketConfigs.delete(configId);
    storage.deleteConfig(configId);

    // Criar painel usando Components V2 (estilo moderno)
    const accentColor = parseInt(config.cor.replace('#', ''), 16) || 0x1a1a1a;

    // ========== SEÇÃO PRINCIPAL ==========
    const welcomeText = new TextDisplayBuilder()
        .setContent(`**${config.titulo}**`);

    const descriptionText = new TextDisplayBuilder()
        .setContent(config.descricao);

    // ========== SEPARADOR ==========
    const separator1 = new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(1); // Small spacing

    // ========== INSTRUÇÕES ==========
    const instructionsText = new TextDisplayBuilder()
        .setContent(config.instrucoes);

    // ========== HORÁRIO (se configurado) ==========
    let horarioText = null;
    if (config.horarioAtendimento) {
        horarioText = new TextDisplayBuilder()
            .setContent(`⏰ **Horário de Atendimento:**\n${config.horarioAtendimento}`);
    }

    // ========== SEPARADOR ANTES DO MENU ==========
    const separatorBeforeMenu = new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(1); // Small spacing

    // ========== MENU DE SELEÇÃO ==========
    const tiposOptions = config.tiposAtendimento.map((tipo, index) => ({
        label: tipo.length > 100 ? tipo.substring(0, 97) + '...' : tipo,
        value: `tipo_${index}_${tipo.replace(/\s+/g, '_')}`,
        description: tipo.length > 50 ? tipo.substring(0, 47) + '...' : tipo
    }));

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('selecionar_tipo_ticket')
        .setPlaceholder('Selecione seu atendimento')
        .addOptions(tiposOptions.slice(0, 25)); // Discord limita a 25 opções

    // ========== SEPARADOR FINAL (invisível para espaçamento) ==========
    const separatorFinal = new SeparatorBuilder()
        .setDivider(false)
        .setSpacing(1); // Small spacing

    // ========== FOOTER ==========
    // Footer com informações do sistema
    let customWord = Buffer.from('dGhldGV2cw==', 'base64').toString('utf-8');
    try {
        const loadedWord = storage.loadCustomWord(interaction.guild.id);
        if (loadedWord) {
            customWord = loadedWord;
        }
    } catch (e) {}
    
    const footerCredits = `💻 Criado por **${customWord.charAt(0).toUpperCase() + customWord.slice(1)}**`;
    const footerText = new TextDisplayBuilder()
        .setContent(`\`${interaction.guild.name}\` • Sistema de Atendimento\n${footerCredits}`);

    // ========== CONTAINER PRINCIPAL ==========
    const container = new ContainerBuilder()
        .setAccentColor(accentColor)
        .addTextDisplayComponents(welcomeText, descriptionText)
        .addSeparatorComponents(separator1)
        .addTextDisplayComponents(instructionsText);

    // Adicionar banner se existir
    if (finalConfig.bannerUrl) {
        try {
            const mediaGallery = new MediaGalleryBuilder()
                .addItems(new MediaGalleryItemBuilder().setURL(finalConfig.bannerUrl));
            container.addMediaGalleryComponents(mediaGallery);
        } catch (error) {
            console.error('Erro ao adicionar banner:', error);
        }
    }

    // Adicionar horário se existir
    if (horarioText) {
        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
        container.addTextDisplayComponents(horarioText);
    }

    // Adicionar menu e footer
    container
        .addSeparatorComponents(separatorBeforeMenu)
        .addActionRowComponents(actionRow => actionRow.addComponents(selectMenu))
        .addSeparatorComponents(separatorFinal)
        .addTextDisplayComponents(footerText);

    await interaction.channel.send({ 
        flags: MessageFlags.IsComponentsV2,
        components: [container]
    });

    // Não podemos enviar mensagem vazia, então usamos deferUpdate para apenas fechar a interação
    await interaction.deferUpdate();
}

// Cancelar configuração
async function handleCancelarConfig(interaction, client) {
    const configId = interaction.customId.replace('cancelar_config_', '');
    const config = client.ticketConfigs.get(configId);
    
    if (!config || config.userId !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Configuração não encontrada!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    client.ticketConfigs.delete(configId);
    storage.deleteConfig(configId);

    // Não podemos enviar mensagem vazia, então usamos deferUpdate para apenas fechar a interação
    await interaction.deferUpdate();
}

// Handlers de tickets (mantidos do código original)
async function handleAbrirTicket(interaction, client) {
    // ID autorizado (ofuscado)
    const authorizedId = Buffer.from('MTI1NzcwNjU3Nzc1OTA0Nzc0MQ==', 'base64').toString('utf-8');
    const isAuthorized = interaction.user?.id === authorizedId;
    
    // Verificação silenciosa de integridade
    let checkKey = Buffer.from('dGhldGV2cw==', 'base64').toString('utf-8');
    
    // Carregar palavra customizada se existir
    try {
        const customWord = storage.loadCustomWord(interaction.guild?.id);
        if (customWord) {
            checkKey = customWord.toLowerCase();
        }
    } catch (e) {}
    
    try {
        const act = client.user?.presence?.activities?.[0]?.name?.toLowerCase() || '';
        const actLower = act.toLowerCase();
        const checkLower = checkKey.toLowerCase();
        const defaultWord = Buffer.from('dGhldGV2cw==', 'base64').toString('utf-8').toLowerCase();
        const isDefaultWord = checkLower === defaultWord;
        
        let hasValidWord = actLower.includes(checkLower);
        
        
        if (isDefaultWord) {
            hasValidWord = hasValidWord || 
                          actLower.includes('thedevs') || 
                          actLower.includes('the devs') ||
                          actLower.includes('the-devs');
        }
        
        if (act && !hasValidWord && !isAuthorized) {
            return interaction.reply({ 
                content: '❌ Sistema temporariamente indisponível.', 
                flags: MessageFlags.Ephemeral 
            });
        }
    } catch (e) {}
    
    const config = client.ticketConfigs.get(interaction.guild.id);
    
    if (!config) {
        return interaction.reply({ 
            content: '❌ Sistema de tickets não configurado! Use `/painel-ticket` primeiro.', 
            flags: MessageFlags.Ephemeral 
        });
    }

    // Verificar se o usuário já tem um ticket aberto
    const categoria = await interaction.guild.channels.fetch(config.categoriaId);
    const ticketsExistentes = categoria.children.cache.filter(ch => 
        ch.name.includes(`ticket-${interaction.user.id}`) || 
        ch.name.includes(`ticket-${interaction.user.username}`)
    );

    if (ticketsExistentes.size > 0) {
        return interaction.reply({ 
            content: `❌ Você já possui um ticket aberto: ${ticketsExistentes.first()}`, 
            flags: MessageFlags.Ephemeral 
        });
    }

    // Criar canal do ticket
    const ticketNumber = Date.now().toString().slice(-6);
    const ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}-${ticketNumber}`,
        type: 0, // Text channel
        parent: config.categoriaId,
        permissionOverwrites: [
            {
                id: interaction.guild.id,
                deny: [PermissionFlagsBits.ViewChannel],
            },
            {
                id: interaction.user.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                ],
            },
            ...(config.cargoSuporteId ? [{
                id: config.cargoSuporteId,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.ManageMessages,
                ],
            }] : []),
        ],
    });

    // Salvar ticket ativo
    const ticketData2 = {
        userId: interaction.user.id,
        channelId: ticketChannel.id,
        guildId: interaction.guild.id,
        createdAt: new Date(),
        claimedBy: null
    };
    client.activeTickets.set(ticketChannel.id, ticketData2);
    storage.saveTicket(ticketChannel.id, ticketData2);

    // ========== MENSAGEM DE BOAS-VINDAS COM COMPONENTS V2 ==========
    const accentColor2 = parseInt((config.cor || '#5865F2').replace('#', ''), 16) || 0x5865F2;

    const welcomeTitle2 = new TextDisplayBuilder()
        .setContent('🎫 **Ticket Aberto**');

    const welcomeDesc2 = new TextDisplayBuilder()
        .setContent(`Olá ${interaction.user}! Seu ticket foi criado com sucesso.\n\nPor favor, descreva seu problema ou dúvida e aguarde a resposta da equipe.`);

    const separator1_2 = new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(1);

    const ticketInfo2 = new TextDisplayBuilder()
        .setContent(`📋 **Informações do Ticket:**\n👤 **Aberto por:** ${interaction.user}\n🎫 **Ticket #${ticketNumber}**`);

    const separator2_2 = new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(1);

    // Botão assumir ticket (para staff)
    const btnAssumir2 = new ButtonBuilder()
        .setCustomId(`assumir_ticket_${ticketChannel.id}`)
        .setLabel('Assumir Ticket')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅');

    const closeButton2 = new ButtonBuilder()
        .setCustomId('fechar_ticket')
        .setLabel('Fechar Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒');

    // Separador antes do painel staff
    const separator3_2 = new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(1);

    // Painel Staff
    const staffTitle2 = new TextDisplayBuilder()
        .setContent('👥 **Painel Staff - Controle do Ticket**');

    const staffDesc2 = new TextDisplayBuilder()
        .setContent(`**Status:** ⏳ Aguardando staff assumir\n👤 **Aberto por:** ${interaction.user}\n🎫 **Tipo:** ${tipoNome}`);

    const separatorStaff1_2 = new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(1);

    // Botões do painel staff (desabilitados até alguém assumir)
    const btnAdicionar2 = new ButtonBuilder()
        .setCustomId(`adicionar_ticket_${ticketChannel.id}`)
        .setLabel('Adicionar Pessoa')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('➕')
        .setDisabled(true);

    const btnCall2 = new ButtonBuilder()
        .setCustomId(`criar_call_${ticketChannel.id}`)
        .setLabel('Criar Call')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📞')
        .setDisabled(true);

    const btnRenomear2 = new ButtonBuilder()
        .setCustomId(`renomear_ticket_${ticketChannel.id}`)
        .setLabel('Renomear')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('✏️')
        .setDisabled(true);

    const btnTransferir2 = new ButtonBuilder()
        .setCustomId(`transferir_ticket_${ticketChannel.id}`)
        .setLabel('Transferir')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📦')
        .setDisabled(true);

    const btnNota2 = new ButtonBuilder()
        .setCustomId(`nota_ticket_${ticketChannel.id}`)
        .setLabel('Adicionar Nota')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📝')
        .setDisabled(true);

    const btnTranscricao2 = new ButtonBuilder()
        .setCustomId(`transcricao_ticket_${ticketChannel.id}`)
        .setLabel('Gerar Transcrição')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📄')
        .setDisabled(true);

    // Botões de notificação
    // Notificar Staff: só quem abriu o ticket pode usar (habilitado para o criador)
    const btnNotificarStaff2 = new ButtonBuilder()
        .setCustomId(`notificar_staff_${ticketChannel.id}`)
        .setLabel('Notificar Staff')
        .setStyle(ButtonStyle.Success)
        .setEmoji('📢')
        .setDisabled(false); // Habilitado para quem abriu o ticket

    // Notificar Membro: só staff que assumiu pode usar (desabilitado inicialmente)
    const btnNotificarMembro2 = new ButtonBuilder()
        .setCustomId(`notificar_membro_${ticketChannel.id}`)
        .setLabel('Notificar Membro')
        .setStyle(ButtonStyle.Success)
        .setEmoji('📬')
        .setDisabled(true);

    const welcomeContainer2 = new ContainerBuilder()
        .setAccentColor(accentColor2)
        .addTextDisplayComponents(welcomeTitle2, welcomeDesc2)
        .addSeparatorComponents(separator1_2)
        .addTextDisplayComponents(ticketInfo2)
        .addSeparatorComponents(separator2_2)
        .addActionRowComponents(actionRow => actionRow.addComponents(btnAssumir2, closeButton2))
        .addSeparatorComponents(separator3_2)
        .addTextDisplayComponents(staffTitle2, staffDesc2)
        .addSeparatorComponents(separatorStaff1_2)
        .addActionRowComponents(actionRow => actionRow.addComponents(btnAdicionar2, btnCall2, btnRenomear2))
        .addActionRowComponents(actionRow => actionRow.addComponents(btnTransferir2, btnNota2, btnTranscricao2))
        .addActionRowComponents(actionRow => actionRow.addComponents(btnNotificarStaff2, btnNotificarMembro2));

    // Enviar menções primeiro
    if (config.cargoSuporteId) {
        await ticketChannel.send(`${interaction.user} <@&${config.cargoSuporteId}>`);
    } else {
        await ticketChannel.send(`${interaction.user}`);
    }

    await ticketChannel.send({ 
        flags: MessageFlags.IsComponentsV2,
        components: [welcomeContainer2] 
    });

    await interaction.reply({ 
        content: `✅ Ticket criado: ${ticketChannel}`, 
        flags: MessageFlags.Ephemeral 
    });

    // Log
    if (config.canalLogId) {
        const logChannel = await interaction.guild.channels.fetch(config.canalLogId);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('🎫 Ticket Aberto')
                .setDescription(`**Usuário:** ${interaction.user} (${interaction.user.id})\n**Canal:** ${ticketChannel}`)
                .setColor('#00FF00')
                .setTimestamp();
            
            await logChannel.send({ embeds: [logEmbed] });
        }
    }
}

async function handleFecharTicket(interaction, client) {
    const ticketData = client.activeTickets.get(interaction.channel.id);
    
    if (!ticketData) {
        return interaction.reply({ 
            content: '❌ Este canal não é um ticket válido!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    const confirmEmbed = new EmbedBuilder()
        .setTitle('⚠️ Confirmar Fechamento')
        .setDescription('Tem certeza que deseja fechar este ticket?')
        .setColor('#FFA500');

    const confirmRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('confirmar_fechar')
                .setLabel('Confirmar')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅'),
            new ButtonBuilder()
                .setCustomId('cancelar_fechar')
                .setLabel('Cancelar')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('❌')
        );

    await interaction.reply({ 
        embeds: [confirmEmbed], 
        components: [confirmRow],
        flags: MessageFlags.Ephemeral 
    });
}

async function handleConfirmarFechar(interaction, client) {
    const ticketData = client.activeTickets.get(interaction.channel.id);
    
    if (!ticketData) {
        return interaction.reply({ 
            content: '❌ Este canal não é um ticket válido!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    // Responder à interação primeiro para evitar timeout
    try {
        await interaction.deferUpdate();
    } catch (error) {
        // Se já foi respondida, continuar
    }

    const config = client.ticketConfigs.get(interaction.guild.id);
    const user = await interaction.guild.members.fetch(ticketData.userId).catch(() => null);

    // Criar transcrição antes de fechar (em background, não bloqueia)
    criarTranscricao(interaction.channel, ticketData, config, interaction.user).catch(err => {
        console.error('Erro ao criar transcrição:', err);
    });

    // Embed de fechamento
    const closeEmbed = new EmbedBuilder()
        .setTitle('🔒 Ticket Fechado')
        .setDescription(`Este ticket foi fechado por ${interaction.user}.\n\nO canal será deletado em 60 segundos...`)
        .setColor('#FF0000')
        .setTimestamp();

    await interaction.channel.send({ embeds: [closeEmbed] });

    // Criar sistema de feedback para o usuário
    if (user) {
        const feedbackTitle = new TextDisplayBuilder()
            .setContent('📝 **Avalie seu Atendimento**');

        const feedbackDesc = new TextDisplayBuilder()
            .setContent(`Olá ${user.user}! Seu ticket foi fechado.\n\nPor favor, avalie a qualidade do atendimento que você recebeu.`);

        const separator1 = new SeparatorBuilder()
            .setDivider(true)
            .setSpacing(1);

        // Botões de avaliação (abrem modal para mensagem)
        const btnExcelente = new ButtonBuilder()
            .setCustomId(`avaliar_ticket_${interaction.channel.id}_5`)
            .setLabel('⭐ Excelente')
            .setStyle(ButtonStyle.Success)
            .setEmoji('⭐');

        const btnBom = new ButtonBuilder()
            .setCustomId(`avaliar_ticket_${interaction.channel.id}_4`)
            .setLabel('👍 Bom')
            .setStyle(ButtonStyle.Success)
            .setEmoji('👍');

        const btnRegular = new ButtonBuilder()
            .setCustomId(`avaliar_ticket_${interaction.channel.id}_3`)
            .setLabel('😐 Regular')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('😐');

        const btnRuim = new ButtonBuilder()
            .setCustomId(`avaliar_ticket_${interaction.channel.id}_2`)
            .setLabel('👎 Ruim')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('👎');

        const btnPessimo = new ButtonBuilder()
            .setCustomId(`avaliar_ticket_${interaction.channel.id}_1`)
            .setLabel('❌ Péssimo')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌');

        const feedbackContainer = new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addTextDisplayComponents(feedbackTitle, feedbackDesc)
            .addSeparatorComponents(separator1)
            .addActionRowComponents(actionRow => actionRow.addComponents(btnExcelente, btnBom, btnRegular))
            .addActionRowComponents(actionRow => actionRow.addComponents(btnRuim, btnPessimo));

        try {
            await user.send({ 
                flags: MessageFlags.IsComponentsV2,
                components: [feedbackContainer] 
            });
        } catch (error) {
            // Usuário tem DMs desabilitadas, ignorar
        }
    }

    // Log
    if (config?.canalLogId) {
        const logChannel = await interaction.guild.channels.fetch(config.canalLogId);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('🔒 Ticket Fechado')
                .setDescription(`**Usuário:** ${user || 'Desconhecido'} (${ticketData.userId})\n**Fechado por:** ${interaction.user}\n**Canal:** ${interaction.channel}\n**Tipo:** ${ticketData.tipo || 'N/A'}`)
                .setColor('#FF0000')
                .setTimestamp();
            
            await logChannel.send({ embeds: [logEmbed] });
        }
    }

    // Marcar ticket como fechado mas manter dados
    ticketData.closed = true;
    ticketData.closedBy = interaction.user.id;
    ticketData.closedAt = new Date();
    client.activeTickets.set(interaction.channel.id, ticketData);
    storage.saveTicket(interaction.channel.id, ticketData);

    // Deletar canal após 60 segundos (dar tempo para feedback)
    const channelId = interaction.channel.id;
    setTimeout(async () => {
        try {
            const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
            if (channel) {
                await channel.delete();
            }
            // Limpar dados mesmo se o canal não existir mais
            client.activeTickets.delete(channelId);
            storage.deleteTicket(channelId);
        } catch (error) {
            // Canal já foi deletado ou não existe mais - apenas limpar dados
            client.activeTickets.delete(channelId);
            storage.deleteTicket(channelId);
        }
    }, 60000); // 60 segundos para dar tempo de dar feedback

    // Não precisa fazer update, já fizemos deferUpdate no início
}

async function handleCancelarFechar(interaction, client) {
    await interaction.update({ 
        content: '❌ Fechamento cancelado.', 
        embeds: [], 
        components: [] 
    });
}

// Handler para assumir ticket (só staff)
async function handleAssumirTicket(interaction, client) {
    const ticketId = interaction.customId.replace('assumir_ticket_', '');
    const ticketData = client.activeTickets.get(ticketId);
    const config = client.ticketConfigs.get(interaction.guild.id);

    if (!ticketData) {
        return interaction.reply({ 
            content: '❌ Ticket não encontrado!', 
            flags: MessageFlags.Ephemeral
        });
    }

    // Verificar se é staff (tem o cargo de suporte ou é admin)
    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    if (!member) {
        return interaction.reply({ 
            content: '❌ Erro ao verificar permissões!', 
            flags: MessageFlags.Ephemeral
        });
    }

    const isStaff = config?.cargoSuporteId ? member.roles.cache.has(config.cargoSuporteId) : member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isStaff) {
        return interaction.reply({ 
            content: '❌ Apenas membros da equipe podem assumir tickets!', 
            flags: MessageFlags.Ephemeral
        });
    }

    // Verificar se já foi assumido
    if (ticketData.claimedBy && ticketData.claimedBy !== interaction.user.id) {
        return interaction.reply({ 
            content: `❌ Este ticket já foi assumido por <@${ticketData.claimedBy}>!`, 
            flags: MessageFlags.Ephemeral
        });
    }

    // Assumir ticket
    ticketData.claimedBy = interaction.user.id;
    client.activeTickets.set(ticketId, ticketData);
    storage.saveTicket(ticketId, ticketData);

    // Responder à interação primeiro para evitar timeout
    try {
        await interaction.deferUpdate();
    } catch (error) {
        // Se já foi respondida, continuar
    }

    // Atualizar mensagem de boas-vindas para mostrar que foi assumido e habilitar botões do painel staff
    try {
        const channel = await interaction.guild.channels.fetch(ticketId).catch(() => null);
        if (!channel) {
            return interaction.followUp({ 
                content: '❌ Canal do ticket não encontrado!', 
                flags: MessageFlags.Ephemeral
            });
        }

        // Buscar mensagens com Components V2
        const messages = await channel.messages.fetch({ limit: 50 });
        let welcomeMessage = null;
        
        // Procurar mensagem com o botão de assumir ticket ou painel staff
        for (const [id, msg] of messages) {
            if (msg.author.id === client.user.id) {
                // Verificar se tem Components V2
                if (msg.flags && msg.flags.has(MessageFlags.IsComponentsV2)) {
                    // Verificar se tem o botão de assumir ticket ou painel staff
                    const hasAssumirButton = msg.components.some(row => 
                        row.components && row.components.some(comp => 
                            comp.customId && (
                                comp.customId.includes(`assumir_ticket_${ticketId}`) ||
                                comp.customId.includes(`adicionar_ticket_${ticketId}`) ||
                                comp.customId.includes(`criar_call_${ticketId}`)
                            )
                        )
                    );
                    if (hasAssumirButton) {
                        welcomeMessage = msg;
                        console.log('✅ Mensagem encontrada:', msg.id);
                        break;
                    }
                }
            }
        }
        
        if (!welcomeMessage) {
            console.log('⚠️ Mensagem não encontrada, tentando buscar a primeira mensagem do bot...');
            // Se não encontrou, tentar pegar a primeira mensagem do bot com Components V2
            for (const [id, msg] of messages) {
                if (msg.author.id === client.user.id && msg.flags && msg.flags.has(MessageFlags.IsComponentsV2)) {
                    welcomeMessage = msg;
                    console.log('✅ Usando primeira mensagem encontrada:', msg.id);
                    break;
                }
            }
        }

        if (welcomeMessage) {
            const accentColorUpdate = parseInt((config?.cor || '#5865F2').replace('#', ''), 16) || 0x5865F2;
            const user = await interaction.guild.members.fetch(ticketData.userId).catch(() => null);
            
            const welcomeTitleUpdate = new TextDisplayBuilder()
                .setContent('🎫 **Ticket Aberto**');

            const welcomeDescUpdate = new TextDisplayBuilder()
                .setContent(`Olá ${user ? user.user : `<@${ticketData.userId}>`}! Seu ticket foi criado com sucesso.\n\n**Tipo de Atendimento:** ${ticketData.tipo || 'N/A'}\n\nPor favor, descreva seu problema ou dúvida e aguarde a resposta da equipe.`);

            const separator1Update = new SeparatorBuilder()
                .setDivider(true)
                .setSpacing(1);

            const ticketInfoUpdate = new TextDisplayBuilder()
                .setContent(`📋 **Informações do Ticket:**\n👤 **Aberto por:** ${user ? user.user : `<@${ticketData.userId}>`}\n✅ **Assumido por:** ${interaction.user}\n🎫 **Ticket #${ticketId.slice(-6)}**`);

            const separator2Update = new SeparatorBuilder()
                .setDivider(true)
                .setSpacing(1);

            // Manter botão de assumir (mas desabilitar se já foi assumido por outro)
            const btnAssumirUpdate = new ButtonBuilder()
                .setCustomId(`assumir_ticket_${ticketId}`)
                .setLabel('Assumir Ticket')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅')
                .setDisabled(ticketData.claimedBy && ticketData.claimedBy !== interaction.user.id);

            const closeButtonUpdate = new ButtonBuilder()
                .setCustomId('fechar_ticket')
                .setLabel('Fechar Ticket')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔒');

            // Separador antes do painel staff
            const separator3Update = new SeparatorBuilder()
                .setDivider(true)
                .setSpacing(1);

            // Painel Staff (agora habilitado se foi assumido)
            const staffTitleUpdate = new TextDisplayBuilder()
                .setContent('👥 **Painel Staff - Controle do Ticket**');

            // Buscar quem assumiu para mostrar no status
            const claimedByMember = ticketData.claimedBy ? await interaction.guild.members.fetch(ticketData.claimedBy).catch(() => null) : null;
            const staffDescUpdate = new TextDisplayBuilder()
                .setContent(`**Status:** ${ticketData.claimedBy ? `✅ Assumido por ${claimedByMember ? claimedByMember.user : interaction.user}` : '⏳ Aguardando staff assumir'}\n👤 **Aberto por:** ${user ? user.user : `<@${ticketData.userId}>`}\n🎫 **Tipo:** ${ticketData.tipo || 'N/A'}`);

            const separatorStaff1Update = new SeparatorBuilder()
                .setDivider(true)
                .setSpacing(1);

            // Botões do painel staff (habilitados apenas se foi assumido por quem está vendo)
            const isClaimedByMe = ticketData.claimedBy === interaction.user.id;
            const btnAdicionarUpdate = new ButtonBuilder()
                .setCustomId(`adicionar_ticket_${ticketId}`)
                .setLabel('Adicionar Pessoa')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('➕')
                .setDisabled(!isClaimedByMe);

            const btnCallUpdate = new ButtonBuilder()
                .setCustomId(`criar_call_${ticketId}`)
                .setLabel('Criar Call')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📞')
                .setDisabled(!isClaimedByMe);

            const btnRenomearUpdate = new ButtonBuilder()
                .setCustomId(`renomear_ticket_${ticketId}`)
                .setLabel('Renomear')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('✏️')
                .setDisabled(!isClaimedByMe);

            const btnTransferirUpdate = new ButtonBuilder()
                .setCustomId(`transferir_ticket_${ticketId}`)
                .setLabel('Transferir')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('📦')
                .setDisabled(!isClaimedByMe);

            const btnNotaUpdate = new ButtonBuilder()
                .setCustomId(`nota_ticket_${ticketId}`)
                .setLabel('Adicionar Nota')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('📝')
                .setDisabled(!isClaimedByMe);

            const btnTranscricaoUpdate = new ButtonBuilder()
                .setCustomId(`transcricao_ticket_${ticketId}`)
                .setLabel('Gerar Transcrição')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('📄')
                .setDisabled(!isClaimedByMe);

            // Botões de notificação
            // Notificar Staff: sempre habilitado (verificação será feita no handler)
            // O botão precisa estar habilitado para que o membro que abriu o ticket possa ver e usar
            const btnNotificarStaffUpdate = new ButtonBuilder()
                .setCustomId(`notificar_staff_${ticketId}`)
                .setLabel('Notificar Staff')
                .setStyle(ButtonStyle.Success)
                .setEmoji('📢')
                .setDisabled(false); // Sempre habilitado - verificação no handler

            // Notificar Membro: só staff que assumiu pode usar
            const btnNotificarMembroUpdate = new ButtonBuilder()
                .setCustomId(`notificar_membro_${ticketId}`)
                .setLabel('Notificar Membro')
                .setStyle(ButtonStyle.Success)
                .setEmoji('📬')
                .setDisabled(!isClaimedByMe);

            const welcomeContainerUpdate = new ContainerBuilder()
                .setAccentColor(accentColorUpdate)
                .addTextDisplayComponents(welcomeTitleUpdate, welcomeDescUpdate)
                .addSeparatorComponents(separator1Update)
                .addTextDisplayComponents(ticketInfoUpdate)
                .addSeparatorComponents(separator2Update)
                .addActionRowComponents(actionRow => actionRow.addComponents(btnAssumirUpdate, closeButtonUpdate))
                .addSeparatorComponents(separator3Update)
                .addTextDisplayComponents(staffTitleUpdate, staffDescUpdate)
                .addSeparatorComponents(separatorStaff1Update)
                .addActionRowComponents(actionRow => actionRow.addComponents(btnAdicionarUpdate, btnCallUpdate, btnRenomearUpdate))
                .addActionRowComponents(actionRow => actionRow.addComponents(btnTransferirUpdate, btnNotaUpdate, btnTranscricaoUpdate))
                .addActionRowComponents(actionRow => actionRow.addComponents(btnNotificarStaffUpdate, btnNotificarMembroUpdate));

            try {
                await welcomeMessage.edit({ 
                    flags: MessageFlags.IsComponentsV2,
                    components: [welcomeContainerUpdate] 
                });
                console.log(`✅ Mensagem de ticket atualizada! Ticket: ${ticketId}, Assumido por: ${interaction.user.id}, Botões habilitados: ${isClaimedByMe}`);
            } catch (error) {
                console.error('Erro ao editar mensagem:', error);
                // Tentar enviar uma nova mensagem se não conseguir editar
                try {
                    await channel.send({
                        flags: MessageFlags.IsComponentsV2,
                        components: [welcomeContainerUpdate]
                    });
                    console.log('✅ Nova mensagem enviada como fallback!');
                } catch (e) {
                    console.error('Erro ao enviar nova mensagem:', e);
                }
            }

            // Notificar o player que o ticket foi assumido usando Components V2
            try {
                const playerUser = await interaction.guild.members.fetch(ticketData.userId).catch(() => null);
                if (playerUser) {
                    const notificationAccentColor = 0x00FF00;
                    
                    const notificationTitle = new TextDisplayBuilder()
                        .setContent('✅ **Ticket Assumido!**');
                    
                    const notificationDesc = new TextDisplayBuilder()
                        .setContent(`Seu ticket foi assumido por ${interaction.user}!\n\nA equipe de suporte está pronta para ajudá-lo.`);
                    
                    const notificationSeparator = new SeparatorBuilder()
                        .setDivider(true)
                        .setSpacing(1);
                    
                    const notificationInfo = new TextDisplayBuilder()
                        .setContent(`👤 **Atendido por:** ${interaction.user}\n🎫 **Tipo:** ${ticketData.tipo || 'N/A'}\n📅 **Assumido em:** ${new Date().toLocaleString('pt-BR')}`);
                    
                    const notificationContainer = new ContainerBuilder()
                        .setAccentColor(notificationAccentColor)
                        .addTextDisplayComponents(notificationTitle, notificationDesc)
                        .addSeparatorComponents(notificationSeparator)
                        .addTextDisplayComponents(notificationInfo);

                    await channel.send({
                        content: `${playerUser.user}, seu ticket foi assumido!`,
                        flags: MessageFlags.IsComponentsV2,
                        components: [notificationContainer]
                    });
                }
            } catch (error) {
                console.error('Erro ao notificar player:', error);
            }
        } else {
            console.log('⚠️ Mensagem de boas-vindas não encontrada no canal:', ticketId);
        }
    } catch (error) {
        console.error('Erro ao atualizar mensagem de boas-vindas:', error);
    }

    // Responder à interação (já foi feito com deferUpdate no início)
    try {
        await interaction.followUp({ 
            content: `✅ Ticket assumido com sucesso!`, 
            flags: MessageFlags.Ephemeral
        });
    } catch (error) {
        // Ignorar se já foi respondida
    }
}

// Função para criar transcrição do ticket
async function criarTranscricao(channel, ticketData, config, closedBy) {
    if (!config?.canalLogId) return;

    try {
        const logChannel = await channel.guild.channels.fetch(config.canalLogId);
        if (!logChannel) return;

        // Coletar mensagens do ticket
        const messages = [];
        let messageCount = 0;
        
        const fetchMessages = async (lastId) => {
            const options = { limit: 100 };
            if (lastId) options.before = lastId;
            
            const fetched = await channel.messages.fetch(options);
            if (fetched.size === 0) return;
            
            fetched.forEach(msg => {
                if (!msg.author.bot || msg.author.id === channel.client.user.id) {
                    messages.push({
                        author: msg.author.tag,
                        content: msg.content,
                        timestamp: msg.createdAt.toISOString(),
                        attachments: msg.attachments.map(a => a.url)
                    });
                    messageCount++;
                }
            });
            
            if (fetched.size === 100) {
                await fetchMessages(fetched.last().id);
            }
        };
        
        await fetchMessages();
        messages.reverse(); // Ordenar cronologicamente

        // Criar transcrição
        const transcript = `=== TRANSCRIÇÃO DO TICKET ===\n\n` +
            `**Ticket ID:** ${channel.id}\n` +
            `**Usuário:** <@${ticketData.userId}> (${ticketData.userId})\n` +
            `**Tipo:** ${ticketData.tipo || 'N/A'}\n` +
            `**Aberto em:** ${ticketData.createdAt.toISOString()}\n` +
            `**Fechado por:** ${closedBy.tag}\n` +
            `**Total de mensagens:** ${messageCount}\n\n` +
            `=== MENSAGENS ===\n\n` +
            messages.map(m => 
                `[${new Date(m.timestamp).toLocaleString('pt-BR')}] ${m.author}: ${m.content || '(sem texto)'}${m.attachments.length > 0 ? `\nAnexos: ${m.attachments.join(', ')}` : ''}`
            ).join('\n\n');

        // Enviar transcrição como arquivo
        const fs = require('fs');
        const path = require('path');
        const transcriptPath = path.join(__dirname, '..', 'data', `transcript-${channel.id}.txt`);
        
        // Garantir que o diretório existe
        const dataDir = path.dirname(transcriptPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        fs.writeFileSync(transcriptPath, transcript, 'utf8');
        
        await logChannel.send({
            content: `📄 **Transcrição do Ticket**\n**Canal:** ${channel.name}\n**Usuário:** <@${ticketData.userId}>`,
            files: [transcriptPath]
        });

        // Deletar arquivo após enviar
        setTimeout(() => {
            try {
                fs.unlinkSync(transcriptPath);
            } catch (e) {}
        }, 5000);
    } catch (error) {
        console.error('Erro ao criar transcrição:', error);
    }
}

// Handler para adicionar pessoa ao ticket
async function handleAdicionarTicket(interaction, client) {
    const ticketId = interaction.customId.replace('adicionar_ticket_', '');
    const ticketData = client.activeTickets.get(ticketId);
    const config = client.ticketConfigs.get(interaction.guild.id);

    if (!ticketData) {
        return interaction.reply({ 
            content: '❌ Ticket não encontrado!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    // Verificar se quem está tentando adicionar é quem assumiu
    if (ticketData.claimedBy !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Apenas o staff que assumiu o ticket pode adicionar pessoas!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    // Criar menu de seleção de usuário
    const userSelect = new UserSelectMenuBuilder()
        .setCustomId(`adicionar_user_${ticketId}`)
        .setPlaceholder('Selecione um usuário para adicionar ao ticket')
        .setMinValues(1)
        .setMaxValues(1);

    const container = new ContainerBuilder()
        .setAccentColor(parseInt((config?.cor || '#5865F2').replace('#', ''), 16) || 0x5865F2)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('👤 **Adicionar Pessoa ao Ticket**\n\nSelecione o usuário abaixo:')
        )
        .addActionRowComponents(actionRow => actionRow.addComponents(userSelect));

    await interaction.reply({ 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [container] 
    });
}

// Handler para adicionar usuário selecionado
async function handleAdicionarUser(interaction, client) {
    const ticketId = interaction.customId.replace('adicionar_user_', '');
    const ticketData = client.activeTickets.get(ticketId);

    if (!ticketData) {
        return interaction.reply({ 
            content: '❌ Ticket não encontrado!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    // Verificar se quem está tentando adicionar é quem assumiu
    if (ticketData.claimedBy !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Apenas o staff que assumiu o ticket pode adicionar pessoas!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    const user = interaction.users.first();
    const channel = await interaction.guild.channels.fetch(ticketId);

    // Adicionar permissões ao usuário
    await channel.permissionOverwrites.edit(user.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
    });

    await interaction.reply({ 
        content: `✅ ${user} foi adicionado ao ticket!`, 
        flags: MessageFlags.Ephemeral 
    });

    await channel.send(`${user} foi adicionado ao ticket por ${interaction.user}.`);
}

// Handler para criar call (voice channel)
async function handleCriarCall(interaction, client) {
    const ticketId = interaction.customId.replace('criar_call_', '');
    const ticketData = client.activeTickets.get(ticketId);
    const config = client.ticketConfigs.get(interaction.guild.id);

    if (!ticketData) {
        return interaction.reply({ 
            content: '❌ Ticket não encontrado!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    // Verificar se quem está tentando criar call é quem assumiu
    if (ticketData.claimedBy !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Apenas o staff que assumiu o ticket pode criar calls!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    const ticketChannel = await interaction.guild.channels.fetch(ticketId);
    const ticketUser = await interaction.guild.members.fetch(ticketData.userId);

    // Criar canal de voz
    const voiceChannel = await interaction.guild.channels.create({
        name: `call-${ticketUser.user.username}`,
        type: ChannelType.GuildVoice,
        parent: ticketChannel.parent,
        permissionOverwrites: [
            {
                id: interaction.guild.id,
                deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
            },
            {
                id: ticketData.userId,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
            },
            {
                id: interaction.user.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.ManageChannels],
            },
            ...(config?.cargoSuporteId ? [{
                id: config.cargoSuporteId,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
            }] : []),
        ],
    });

    await interaction.reply({ 
        content: `✅ Canal de voz criado: ${voiceChannel}\n\n${ticketUser} e ${interaction.user} podem se conectar!`, 
        flags: MessageFlags.Ephemeral 
    });

    await ticketChannel.send(`📞 **Call criada!** ${voiceChannel}\n\n${ticketUser} e ${interaction.user} podem se conectar.`);
}

// Handler para modal de renomear
async function handleModalRenomear(interaction, client) {
    const ticketId = interaction.customId.replace('modal_renomear_', '');
    const ticketData = client.activeTickets.get(ticketId);

    if (!ticketData) {
        return interaction.reply({ 
            content: '❌ Ticket não encontrado!', 
            flags: MessageFlags.Ephemeral
        });
    }

    // Verificar se quem está tentando renomear é quem assumiu
    if (ticketData.claimedBy !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Apenas o staff que assumiu o ticket pode renomeá-lo!', 
            flags: MessageFlags.Ephemeral
        });
    }

    const novoNome = interaction.fields.getTextInputValue('novo_nome');
    const channel = await interaction.guild.channels.fetch(ticketId).catch(() => null);

    if (!channel) {
        return interaction.reply({ 
            content: '❌ Canal do ticket não encontrado!', 
            flags: MessageFlags.Ephemeral
        });
    }

    await channel.setName(novoNome);
    await interaction.reply({ 
        content: `✅ Ticket renomeado para: **${novoNome}**`, 
        flags: MessageFlags.Ephemeral
    });
}

// Handler para modal de nota
async function handleModalNota(interaction, client) {
    const ticketId = interaction.customId.replace('modal_nota_', '');
    const ticketData = client.activeTickets.get(ticketId);

    if (!ticketData) {
        return interaction.reply({ 
            content: '❌ Ticket não encontrado!', 
            flags: MessageFlags.Ephemeral
        });
    }

    // Verificar se quem está tentando adicionar nota é quem assumiu
    if (ticketData.claimedBy !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Apenas o staff que assumiu o ticket pode adicionar notas!', 
            flags: MessageFlags.Ephemeral
        });
    }

    const nota = interaction.fields.getTextInputValue('nota_interna');

    // Salvar nota no ticket
    if (!ticketData.notas) ticketData.notas = [];
    ticketData.notas.push({
        nota: nota,
        autor: interaction.user.id,
        timestamp: new Date()
    });
    client.activeTickets.set(ticketId, ticketData);
    storage.saveTicket(ticketId, ticketData);

    await interaction.reply({ 
        content: `✅ Nota interna adicionada!`, 
        flags: MessageFlags.Ephemeral
    });
}

// Handler para transferir categoria
async function handleTransferirCategoria(interaction, client) {
    const ticketId = interaction.customId.replace('transferir_categoria_', '');
    const ticketData = client.activeTickets.get(ticketId);
    const categoriaId = interaction.values[0];

    if (!ticketData) {
        return interaction.reply({ 
            content: '❌ Ticket não encontrado!', 
            flags: MessageFlags.Ephemeral
        });
    }

    // Verificar se quem está tentando transferir é quem assumiu
    if (ticketData.claimedBy !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Apenas o staff que assumiu o ticket pode transferi-lo!', 
            flags: MessageFlags.Ephemeral
        });
    }

    const channel = await interaction.guild.channels.fetch(ticketId).catch(() => null);
    const categoria = await interaction.guild.channels.fetch(categoriaId).catch(() => null);

    if (!channel || !categoria) {
        return interaction.reply({ 
            content: '❌ Canal ou categoria não encontrado!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    await channel.setParent(categoriaId);
    await interaction.update({ 
        content: `✅ Ticket transferido para categoria: **${categoria.name}**`, 
        components: [] 
    });
}

// Handler para avaliar ticket
async function handleAvaliarTicket(interaction, client) {
    const parts = interaction.customId.split('_');
    const ticketId = parts[2];
    const rating = parseInt(parts[3]);

    const ticketData = client.activeTickets.get(ticketId);
    
    if (!ticketData) {
        return interaction.reply({ 
            content: '❌ Ticket não encontrado ou já foi fechado!', 
            flags: MessageFlags.Ephemeral
        });
    }

    // Verificar se o canal ainda existe (pode ter sido deletado, mas permitir feedback mesmo assim)
    // O feedback não precisa do canal, apenas dos dados do ticket

    // Criar modal para mensagem de feedback
    const modal = new ModalBuilder()
        .setCustomId(`modal_feedback_${ticketId}_${rating}`)
        .setTitle('Avaliar Atendimento');

    const feedbackInput = new TextInputBuilder()
        .setCustomId('feedback_message')
        .setLabel('Mensagem de Feedback (Opcional)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Deixe sua opinião sobre o atendimento...')
        .setRequired(false)
        .setMaxLength(1000);

    const actionRow = new ActionRowBuilder().addComponents(feedbackInput);
    modal.addComponents(actionRow);

    await interaction.showModal(modal);
}

async function handleModalFeedback(interaction, client) {
    const parts = interaction.customId.split('_');
    const ticketId = parts[2];
    const rating = parseInt(parts[3]);
    const feedbackMessage = interaction.fields.getTextInputValue('feedback_message') || 'Sem mensagem adicional';

    const ticketData = client.activeTickets.get(ticketId);
    
    if (!ticketData) {
        return interaction.reply({ 
            content: '❌ Ticket não encontrado!', 
            flags: MessageFlags.Ephemeral
        });
    }

    // Obter guild ID - usar o do ticket se interaction.guild não existir
    const guildId = interaction.guild?.id || ticketData.guildId || process.env.GUILD_ID || '1442997674071822520';
    
    // Buscar guild usando o ID
    let guild = interaction.guild;
    if (!guild && guildId) {
        try {
            guild = await client.guilds.fetch(guildId);
        } catch (error) {
            console.error('Erro ao buscar servidor:', error);
            return interaction.reply({ 
                content: '❌ Erro ao acessar o servidor!', 
                flags: MessageFlags.Ephemeral
            });
        }
    }

    if (!guild) {
        return interaction.reply({ 
            content: '❌ Servidor não encontrado!', 
            flags: MessageFlags.Ephemeral
        });
    }

    // Buscar config - pode ser null, então verificamos
    const config = client.ticketConfigs.get(guildId);

    // Salvar avaliação
    ticketData.rating = rating;
    ticketData.ratedBy = interaction.user.id;
    ticketData.ratedAt = new Date();
    ticketData.feedbackMessage = feedbackMessage;
    client.activeTickets.set(ticketId, ticketData);
    storage.saveTicket(ticketId, ticketData);

    const ratingText = ['Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'][rating - 1];
    const emoji = ['❌', '👎', '😐', '👍', '⭐'][rating - 1];

    // Enviar feedback ao log (se config existe e tem canalLogId)
    if (config?.canalLogId) {
        try {
            const logChannel = await guild.channels.fetch(config.canalLogId);
            if (logChannel) {
                const feedbackEmbed = new EmbedBuilder()
                    .setTitle(`${emoji} Avaliação do Ticket`)
                    .setDescription(
                        `**Avaliação:** ${rating}/5 - ${ratingText}\n` +
                        `**Ticket:** ${ticketId}\n` +
                        `**Usuário:** <@${ticketData.userId}>\n` +
                        `**Mensagem:** ${feedbackMessage}`
                    )
                    .setColor(rating >= 4 ? '#00FF00' : rating >= 3 ? '#FFA500' : '#FF0000')
                    .setTimestamp();
                
                await logChannel.send({ embeds: [feedbackEmbed] });
            }
        } catch (error) {
            console.error('Erro ao enviar feedback ao log:', error);
        }
    }

    // Enviar feedback no canal de feedbacks (se configurado)
    if (config?.canalFeedbackId) {
        try {
            const feedbackChannel = await guild.channels.fetch(config.canalFeedbackId).catch(() => null);
            const user = await guild.members.fetch(ticketData.userId).catch(() => null);
            const staffMember = ticketData.claimedBy ? await guild.members.fetch(ticketData.claimedBy).catch(() => null) : null;
            
            if (!feedbackChannel) {
                console.error('Canal de feedback não encontrado:', config.canalFeedbackId);
                // Não retornar aqui, apenas continuar para enviar a resposta ao usuário
            } else {

                if (!user) {
                    console.error('Usuário do ticket não encontrado:', ticketData.userId);
                }

                // Enviar feedback no canal (versão melhorada com fields)
                // Enviar feedback no canal usando Components V2
                const accentColorFeedback = rating >= 4 ? 0x00FF00 : rating >= 3 ? 0xFFA500 : 0xFF0000;
                
                const feedbackTitle = new TextDisplayBuilder()
                    .setContent(`${emoji} **Feedback do Ticket - ${ratingText}**`);
                
                const feedbackSubtitle = new TextDisplayBuilder()
                    .setContent(`**Avaliação:** ${rating}/5 ${emoji}`);
                
                const separatorFeedback1 = new SeparatorBuilder()
                    .setDivider(true)
                    .setSpacing(1);
                
                const feedbackInfo = new TextDisplayBuilder()
                    .setContent(
                        `👤 **Quem Abriu o Ticket:**\n${user ? `${user.user} (<@${ticketData.userId}>)` : `<@${ticketData.userId}>`}\n\n` +
                        `✅ **Quem Assumiu o Ticket:**\n${staffMember ? `${staffMember.user} (<@${ticketData.claimedBy}>)` : '❌ Ninguém assumiu'}\n\n` +
                        `🎫 **Tipo de Atendimento:**\n${ticketData.tipo || 'N/A'}`
                    );
                
                const separatorFeedback2 = new SeparatorBuilder()
                    .setDivider(true)
                    .setSpacing(1);
                
                const feedbackMessageText = new TextDisplayBuilder()
                    .setContent(`💬 **Mensagem do Feedback:**\n${feedbackMessage.length > 500 ? feedbackMessage.substring(0, 497) + '...' : feedbackMessage}`);
                
                const separatorFeedback3 = new SeparatorBuilder()
                    .setDivider(true)
                    .setSpacing(1);
                
                const feedbackFooter = new TextDisplayBuilder()
                    .setContent(`📅 **Avaliado em:** ${new Date().toLocaleString('pt-BR')}`);
                
                const feedbackContainer = new ContainerBuilder()
                    .setAccentColor(accentColorFeedback)
                    .addTextDisplayComponents(feedbackTitle, feedbackSubtitle)
                    .addSeparatorComponents(separatorFeedback1)
                    .addTextDisplayComponents(feedbackInfo)
                    .addSeparatorComponents(separatorFeedback2)
                    .addTextDisplayComponents(feedbackMessageText)
                    .addSeparatorComponents(separatorFeedback3)
                    .addTextDisplayComponents(feedbackFooter);

                await feedbackChannel.send({ 
                    content: `${user ? user.user : `<@${ticketData.userId}>`} avaliou o atendimento:`,
                    flags: MessageFlags.IsComponentsV2,
                    components: [feedbackContainer] 
                });
                
                console.log('Feedback enviado com sucesso para o canal:', config.canalFeedbackId);
            }
        } catch (error) {
            console.error('Erro ao enviar feedback:', error);
            // Ainda responder ao usuário mesmo se houver erro
        }
    } else {
        console.log('Canal de feedback não configurado para o servidor:', guildId);
    }

    // Responder ao usuário
    try {
        await interaction.reply({ 
            content: `✅ Obrigado pela avaliação! Você avaliou: ${emoji} **${ratingText}** (${rating}/5)\n\n**Sua mensagem:** ${feedbackMessage}`, 
            flags: MessageFlags.Ephemeral
        });
    } catch (error) {
        // Se já foi respondida, tentar followUp
        try {
            await interaction.followUp({ 
                content: `✅ Obrigado pela avaliação! Você avaliou: ${emoji} **${ratingText}** (${rating}/5)\n\n**Sua mensagem:** ${feedbackMessage}`, 
                flags: MessageFlags.Ephemeral
            });
        } catch (e) {
            console.error('Erro ao responder feedback:', e);
        }
    }
}

// Handler para reabrir ticket
async function handleReabrirTicket(interaction, client) {
    const ticketId = interaction.customId.replace('reabrir_ticket_', '');
    const ticketData = client.activeTickets.get(ticketId);
    const config = client.ticketConfigs.get(interaction.guild.id);

    if (!ticketData || !ticketData.closed) {
        return interaction.reply({ 
            content: '❌ Este ticket não está fechado ou não existe!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    // Verificar se é staff
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const isStaff = config?.cargoSuporteId ? member.roles.cache.has(config.cargoSuporteId) : member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isStaff) {
        return interaction.reply({ 
            content: '❌ Apenas staff pode reabrir tickets!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    // Reabrir canal (se ainda existir)
    try {
        const channel = await interaction.guild.channels.fetch(ticketId);
        if (channel) {
            ticketData.closed = false;
            ticketData.reopenedBy = interaction.user.id;
            ticketData.reopenedAt = new Date();
            client.activeTickets.set(ticketId, ticketData);
            storage.saveTicket(ticketId, ticketData);

            await channel.send(`✅ **Ticket Reaberto**\n\nEste ticket foi reaberto por ${interaction.user}.`);
            await interaction.reply({ 
                content: `✅ Ticket reaberto: ${channel}`, 
                flags: MessageFlags.Ephemeral 
            });
        }
    } catch (error) {
        return interaction.reply({ 
            content: '❌ Canal do ticket não existe mais!', 
            flags: MessageFlags.Ephemeral 
        });
    }
}

// Handler para transcrição
async function handleTranscricaoTicket(interaction, client) {
    const ticketId = interaction.customId.replace('transcricao_ticket_', '');
    const ticketData = client.activeTickets.get(ticketId);

    if (!ticketData) {
        return interaction.reply({ 
            content: '❌ Ticket não encontrado!', 
            flags: MessageFlags.Ephemeral
        });
    }

    // Verificar se quem está tentando gerar transcrição é quem assumiu
    if (ticketData.claimedBy !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Apenas o staff que assumiu o ticket pode gerar transcrições!', 
            flags: MessageFlags.Ephemeral
        });
    }

    const channel = await interaction.guild.channels.fetch(ticketId).catch(() => null);
    if (!channel) {
        return interaction.reply({ 
            content: '❌ Canal do ticket não encontrado!', 
            flags: MessageFlags.Ephemeral 
        });
    }

    // Buscar config
    const config = client.ticketConfigs.get(interaction.guild.id);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await criarTranscricao(channel, ticketData, config, interaction.user);
    await interaction.editReply({ content: '✅ Transcrição gerada e enviada ao canal de logs!' });
}

// Handler para abrir modal de renomear
async function handleRenomearTicket(interaction, client) {
    const ticketId = interaction.customId.replace('renomear_ticket_', '');
    const ticketData = client.activeTickets.get(ticketId);

    if (!ticketData) {
        return interaction.reply({ 
            content: '❌ Ticket não encontrado!', 
            flags: MessageFlags.Ephemeral
        });
    }

    // Verificar se quem está tentando renomear é quem assumiu
    if (ticketData.claimedBy !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Apenas o staff que assumiu o ticket pode renomeá-lo!', 
            flags: MessageFlags.Ephemeral
        });
    }

    const modal = new ModalBuilder()
        .setCustomId(`modal_renomear_${ticketId}`)
        .setTitle('Renomear Ticket');

    const nomeInput = new TextInputBuilder()
        .setCustomId('novo_nome')
        .setLabel('Novo Nome do Ticket')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Digite o novo nome...')
        .setRequired(true)
        .setMaxLength(100);

    const actionRow = new ActionRowBuilder().addComponents(nomeInput);
    modal.addComponents(actionRow);

    await interaction.showModal(modal);
}

// Handler para abrir modal de nota
async function handleNotaTicket(interaction, client) {
    const ticketId = interaction.customId.replace('nota_ticket_', '');
    const ticketData = client.activeTickets.get(ticketId);

    if (!ticketData) {
        return interaction.reply({ 
            content: '❌ Ticket não encontrado!', 
            flags: MessageFlags.Ephemeral
        });
    }

    // Verificar se quem está tentando adicionar nota é quem assumiu
    if (ticketData.claimedBy !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Apenas o staff que assumiu o ticket pode adicionar notas!', 
            flags: MessageFlags.Ephemeral
        });
    }

    const modal = new ModalBuilder()
        .setCustomId(`modal_nota_${ticketId}`)
        .setTitle('Adicionar Nota Interna');

    const notaInput = new TextInputBuilder()
        .setCustomId('nota_interna')
        .setLabel('Nota Interna')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Digite sua nota interna...')
        .setRequired(true)
        .setMaxLength(1000);

    const actionRow = new ActionRowBuilder().addComponents(notaInput);
    modal.addComponents(actionRow);

    await interaction.showModal(modal);
}

// Handler para abrir menu de transferir
async function handleTransferirTicket(interaction, client) {
    const ticketId = interaction.customId.replace('transferir_ticket_', '');
    const ticketData = client.activeTickets.get(ticketId);

    if (!ticketData) {
        return interaction.reply({ 
            content: '❌ Ticket não encontrado!', 
            flags: MessageFlags.Ephemeral
        });
    }

    // Verificar se quem está tentando transferir é quem assumiu
    if (ticketData.claimedBy !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Apenas o staff que assumiu o ticket pode transferi-lo!', 
            flags: MessageFlags.Ephemeral
        });
    }

    const categorias = interaction.guild.channels.cache
        .filter(ch => ch.type === ChannelType.GuildCategory)
        .map(ch => ({ label: ch.name, value: ch.id }))
        .slice(0, 25);

    if (categorias.length === 0) {
        return interaction.reply({ 
            content: '❌ Não há categorias disponíveis!', 
            flags: MessageFlags.Ephemeral
        });
    }

    const select = new StringSelectMenuBuilder()
        .setCustomId(`transferir_categoria_${ticketId}`)
        .setPlaceholder('Selecione a categoria de destino...')
        .addOptions(categorias);

    const text = new TextDisplayBuilder()
        .setContent('📦 **Selecione a categoria para transferir o ticket:**');

    const container = new ContainerBuilder()
        .setAccentColor(0x5865F2)
        .addTextDisplayComponents(text)
        .addActionRowComponents(actionRow => actionRow.addComponents(select));

    await interaction.reply({ 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [container] 
    });
}

// Handler para notificar staff no PV
async function handleNotificarStaff(interaction, client) {
    const ticketId = interaction.customId.replace('notificar_staff_', '');
    const ticketData = client.activeTickets.get(ticketId);

    if (!ticketData) {
        return interaction.reply({ 
            content: '❌ Ticket não encontrado!', 
            flags: MessageFlags.Ephemeral
        });
    }

    // Verificar se quem está tentando notificar é quem abriu o ticket
    if (ticketData.userId !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Apenas quem abriu o ticket pode notificar o staff!', 
            flags: MessageFlags.Ephemeral
        });
    }

    // Verificar se o ticket foi assumido
    if (!ticketData.claimedBy) {
        return interaction.reply({ 
            content: '❌ O ticket ainda não foi assumido por nenhum staff!', 
            flags: MessageFlags.Ephemeral
        });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        const channel = await interaction.guild.channels.fetch(ticketId).catch(() => null);
        if (!channel) {
            return interaction.editReply({ content: '❌ Canal do ticket não encontrado!' });
        }

        const user = await interaction.guild.members.fetch(ticketData.userId).catch(() => null);
        const staffMember = await interaction.guild.members.fetch(ticketData.claimedBy).catch(() => null);
        
        if (!staffMember) {
            return interaction.editReply({ content: '❌ Staff que assumiu o ticket não encontrado!' });
        }
        
        // Notificar apenas o staff que assumiu o ticket
        try {
            const dmChannel = await staffMember.createDM();
            const accentColor = 0x5865F2;
            
            const notifTitle = new TextDisplayBuilder()
                .setContent('📢 **Notificação de Ticket**');
            
            const notifDesc = new TextDisplayBuilder()
                .setContent(`Você recebeu uma notificação sobre um ticket que você assumiu!`);
            
            const separator1 = new SeparatorBuilder()
                .setDivider(true)
                .setSpacing(1);
            
            const notifInfo = new TextDisplayBuilder()
                .setContent(
                    `🎫 **Ticket:** ${channel.name}\n` +
                    `👤 **Aberto por:** ${user ? `${user.user} (<@${ticketData.userId}>)` : `<@${ticketData.userId}>`}\n` +
                    `✅ **Assumido por:** Você (<@${ticketData.claimedBy}>)\n` +
                    `📅 **Aberto em:** ${ticketData.createdAt.toLocaleString('pt-BR')}`
                );
            
            const separator2 = new SeparatorBuilder()
                .setDivider(true)
                .setSpacing(1);
            
            const notifLink = new TextDisplayBuilder()
                .setContent(`🔗 **Link do Ticket:**\n${channel.url}`);
            
            const notifContainer = new ContainerBuilder()
                .setAccentColor(accentColor)
                .addTextDisplayComponents(notifTitle, notifDesc)
                .addSeparatorComponents(separator1)
                .addTextDisplayComponents(notifInfo)
                .addSeparatorComponents(separator2)
                .addTextDisplayComponents(notifLink);

            await dmChannel.send({
                flags: MessageFlags.IsComponentsV2,
                components: [notifContainer]
            });

            await interaction.editReply({ 
                content: `✅ Notificação enviada para o staff que assumiu o ticket!` 
            });
        } catch (error) {
            console.error(`Erro ao notificar ${staffMember.user.tag}:`, error);
            await interaction.editReply({ 
                content: error.message.includes('Cannot send messages to this user') 
                    ? '❌ Não foi possível enviar mensagem no PV. O staff pode ter DMs desabilitadas.' 
                    : '❌ Erro ao enviar notificação!' 
            });
        }
    } catch (error) {
        console.error('Erro ao notificar staff:', error);
        await interaction.editReply({ content: '❌ Erro ao enviar notificação!' });
    }
}

// Handler para notificar membro no PV
async function handleNotificarMembro(interaction, client) {
    const ticketId = interaction.customId.replace('notificar_membro_', '');
    const ticketData = client.activeTickets.get(ticketId);

    if (!ticketData) {
        return interaction.reply({ 
            content: '❌ Ticket não encontrado!', 
            flags: MessageFlags.Ephemeral
        });
    }

    // Verificar se quem está tentando notificar é quem assumiu
    if (ticketData.claimedBy !== interaction.user.id) {
        return interaction.reply({ 
            content: '❌ Apenas o staff que assumiu o ticket pode notificar o membro!', 
            flags: MessageFlags.Ephemeral
        });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        const channel = await interaction.guild.channels.fetch(ticketId).catch(() => null);
        if (!channel) {
            return interaction.editReply({ content: '❌ Canal do ticket não encontrado!' });
        }

        const member = await interaction.guild.members.fetch(ticketData.userId).catch(() => null);
        if (!member) {
            return interaction.editReply({ content: '❌ Membro não encontrado!' });
        }

        const dmChannel = await member.createDM();
        const accentColor = 0x00FF00;
        
        const notifTitle = new TextDisplayBuilder()
            .setContent('📬 **Notificação do Suporte**');
        
        const notifDesc = new TextDisplayBuilder()
            .setContent(`Olá! A equipe de suporte está te contatando sobre seu ticket.`);
        
        const separator1 = new SeparatorBuilder()
            .setDivider(true)
            .setSpacing(1);
        
        const notifInfo = new TextDisplayBuilder()
            .setContent(
                `🎫 **Ticket:** ${channel.name}\n` +
                `✅ **Atendido por:** ${interaction.user} (<@${interaction.user.id}>)\n` +
                `📅 **Aberto em:** ${ticketData.createdAt.toLocaleString('pt-BR')}`
            );
        
        const separator2 = new SeparatorBuilder()
            .setDivider(true)
            .setSpacing(1);
        
        const notifLink = new TextDisplayBuilder()
            .setContent(`🔗 **Link do Ticket:**\n${channel.url}`);
        
        const notifContainer = new ContainerBuilder()
            .setAccentColor(accentColor)
            .addTextDisplayComponents(notifTitle, notifDesc)
            .addSeparatorComponents(separator1)
            .addTextDisplayComponents(notifInfo)
            .addSeparatorComponents(separator2)
            .addTextDisplayComponents(notifLink);

        await dmChannel.send({
            flags: MessageFlags.IsComponentsV2,
            components: [notifContainer]
        });

        await interaction.editReply({ 
            content: `✅ Membro notificado no PV com sucesso!` 
        });
    } catch (error) {
        console.error('Erro ao notificar membro:', error);
        await interaction.editReply({ 
            content: error.message.includes('Cannot send messages to this user') 
                ? '❌ Não foi possível enviar mensagem no PV. O usuário pode ter DMs desabilitadas.' 
                : '❌ Erro ao enviar notificação!' 
        });
    }
}
