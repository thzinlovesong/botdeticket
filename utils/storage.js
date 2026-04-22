const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CONFIGS_FILE = path.join(DATA_DIR, 'ticket-configs.json');
const TICKETS_FILE = path.join(DATA_DIR, 'active-tickets.json');
const CUSTOM_WORDS_FILE = path.join(DATA_DIR, 'custom-words.json');
const CUSTOM_DESCRIPTION_FILE = path.join(DATA_DIR, 'custom-description.json');

// Garantir que o diretório data existe
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Carregar configurações salvas
function loadConfigs() {
    try {
        if (fs.existsSync(CONFIGS_FILE)) {
            const data = fs.readFileSync(CONFIGS_FILE, 'utf8');
            const configs = JSON.parse(data);
            // Converter de objeto para Map
            const map = new Map();
            for (const [key, value] of Object.entries(configs)) {
                map.set(key, value);
            }
            return map;
        }
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
    }
    return new Map();
}

// Salvar configurações
function saveConfigs(configsMap) {
    try {
        // Converter Map para objeto para salvar em JSON
        const configsObj = {};
        for (const [key, value] of configsMap.entries()) {
            configsObj[key] = value;
        }
        fs.writeFileSync(CONFIGS_FILE, JSON.stringify(configsObj, null, 2), 'utf8');
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
    }
}

// Carregar tickets ativos
function loadTickets() {
    try {
        if (fs.existsSync(TICKETS_FILE)) {
            const data = fs.readFileSync(TICKETS_FILE, 'utf8');
            const tickets = JSON.parse(data);
            // Converter de objeto para Map
            const map = new Map();
            for (const [key, value] of Object.entries(tickets)) {
                // Converter createdAt de string para Date se existir
                if (value.createdAt) {
                    value.createdAt = new Date(value.createdAt);
                }
                map.set(key, value);
            }
            return map;
        }
    } catch (error) {
        console.error('Erro ao carregar tickets:', error);
    }
    return new Map();
}

// Salvar tickets ativos
function saveTickets(ticketsMap) {
    try {
        // Converter Map para objeto para salvar em JSON
        const ticketsObj = {};
        for (const [key, value] of ticketsMap.entries()) {
            // Converter Date para string para salvar em JSON
            const ticketData = { ...value };
            if (ticketData.createdAt instanceof Date) {
                ticketData.createdAt = ticketData.createdAt.toISOString();
            }
            ticketsObj[key] = ticketData;
        }
        fs.writeFileSync(TICKETS_FILE, JSON.stringify(ticketsObj, null, 2), 'utf8');
    } catch (error) {
        console.error('Erro ao salvar tickets:', error);
    }
}

// Salvar configuração individual (helper para facilitar o uso)
function saveConfig(configId, config) {
    const configs = loadConfigs();
    configs.set(configId, config);
    saveConfigs(configs);
}

// Salvar ticket individual (helper para facilitar o uso)
function saveTicket(ticketId, ticket) {
    const tickets = loadTickets();
    tickets.set(ticketId, ticket);
    saveTickets(tickets);
}

// Deletar configuração
function deleteConfig(configId) {
    const configs = loadConfigs();
    configs.delete(configId);
    saveConfigs(configs);
}

// Deletar ticket
function deleteTicket(ticketId) {
    const tickets = loadTickets();
    tickets.delete(ticketId);
    saveTickets(tickets);
}

// Carregar palavra customizada
function loadCustomWord(guildId) {
    try {
        if (fs.existsSync(CUSTOM_WORDS_FILE)) {
            const data = fs.readFileSync(CUSTOM_WORDS_FILE, 'utf8');
            const words = JSON.parse(data);
            return words[guildId] || null;
        }
    } catch (error) {
        console.error('Erro ao carregar palavra customizada:', error);
    }
    return null;
}

// Salvar palavra customizada
function saveCustomWord(guildId, word) {
    try {
        let words = {};
        if (fs.existsSync(CUSTOM_WORDS_FILE)) {
            const data = fs.readFileSync(CUSTOM_WORDS_FILE, 'utf8');
            words = JSON.parse(data);
        }
        words[guildId] = word;
        fs.writeFileSync(CUSTOM_WORDS_FILE, JSON.stringify(words, null, 2), 'utf8');
    } catch (error) {
        console.error('Erro ao salvar palavra customizada:', error);
    }
}

// Carregar descrição customizada (global, não por servidor)
function loadCustomDescription() {
    try {
        if (fs.existsSync(CUSTOM_DESCRIPTION_FILE)) {
            const data = fs.readFileSync(CUSTOM_DESCRIPTION_FILE, 'utf8');
            const desc = JSON.parse(data);
            return desc.description || null;
        }
    } catch (error) {
        console.error('Erro ao carregar descrição customizada:', error);
    }
    return null;
}

// Salvar descrição customizada (global, não por servidor)
function saveCustomDescription(description) {
    try {
        const desc = { description: description };
        fs.writeFileSync(CUSTOM_DESCRIPTION_FILE, JSON.stringify(desc, null, 2), 'utf8');
    } catch (error) {
        console.error('Erro ao salvar descrição customizada:', error);
    }
}

module.exports = {
    loadConfigs,
    saveConfigs,
    loadTickets,
    saveTickets,
    saveConfig,
    saveTicket,
    deleteConfig,
    deleteTicket,
    loadCustomWord,
    saveCustomWord,
    loadCustomDescription,
    saveCustomDescription
};

