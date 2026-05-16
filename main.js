const {
    Plugin,
    PluginSettingTab,
    Setting,
    Notice
} = require("obsidian");

const DEFAULT_SETTINGS = {
    aliases: []
};

function normalizeCommandName(name) {
    return name.trim().toLowerCase().replace(/\s+/g, "-");
}

module.exports = class CommandAliasesPlugin extends Plugin {
    async onload() {
        this.registeredCommands = [];

        await this.loadSettings();

        this.addSettingTab(new CommandAliasesSettingTab(this.app, this));

        this.registerAliasCommands();        

        console.log("[command-aliases] loaded");
    }

    onunload() {
        this.unregisterAliasCommands();

        console.log("[command-aliases] unloaded");
    }

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        );
    }

    async saveSettings() {
        await this.saveData(this.settings);

        this.unregisterAliasCommands();
        this.registerAliasCommands();
    }

    registerAlias(entry) {
        const commandManager = this.app.commands;

        const originalCommand = commandManager.commands[entry.commandId];

        if (!originalCommand) {
            console.warn(`[command-aliases] missing command: ${entry.commandId}`);
            return;
        }

        const trimmed = entry.alias.trim();

        if (!trimmed) {
            return;
        }

        const aliasId = `command-alias:${normalizeCommandName(trimmed)}`;

        this.addCommand({
            id: aliasId,
            name: trimmed,
            callback: () => this.app.commands.executeCommandById(entry.commandId),
        });

        this.registeredCommands.push(aliasId);
    }

    registerAliasCommands() {
        this.settings.aliases.forEach(entry => {
            this.registerAlias(entry);
        });
    }
    
    unregisterAliasCommands() {
        this.registeredCommands.forEach(aliasId => {
            this.app.commands.removeCommand(aliasId);
        });
        this.registeredCommands = [];
    }
};

class CommandAliasesSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);

        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl("h2", {
            text: "Command Aliases"
        });

        new Setting(containerEl)
            .setName("Add new alias")
            .setDesc("Create an alias for any command")
            .addButton(button => {
                button.setButtonText("Add").onClick(() => {
                    this.plugin.settings.aliases.push({
                        commandId: "",
                        alias: ""
                    });
                    this.plugin.saveSettings();
                    this.display();
                });
            });

        this.plugin.settings.aliases.forEach((entry, index) => {
            new Setting(containerEl)
                .addSearch(search => {
                    const commandManager = this.app.commands;
                    const commands = Object.values(commandManager.commands);
                    
                    search.setPlaceholder("Search commands...")
                        .setValue(entry.commandId)
                        .onChange(value => {
                            entry.commandId = value;
                            this.plugin.saveSettings();
                        });
                    
                    search.containerEl.classList.add("command-search");
                    const resultsEl = containerEl.createDiv("command-search-results");
                    
                    search.inputEl.addEventListener("input", (e) => {
                        const query = e.target.value.toLowerCase();
                        resultsEl.empty();
                        
                        if (!query) return;
                        
                        commands
                            .filter(cmd => cmd.name.toLowerCase().includes(query))
                            .slice(0, 10)
                            .forEach(cmd => {
                                const div = resultsEl.createDiv("command-result");
                                div.setText(cmd.name);
                                div.addEventListener("click", () => {
                                    entry.commandId = cmd.id;
                                    search.setValue(cmd.id);
                                    resultsEl.empty();
                                    this.plugin.saveSettings();
                                });
                            });
                    });
                })
                .addText(text => {
                    text.setPlaceholder("Alias name")
                        .setValue(entry.alias)
                        .onChange(value => {
                            entry.alias = value;
                            this.plugin.saveSettings();
                        });
                })
                .addButton(button => {
                    button.setButtonText("Remove").onClick(() => {
                        this.plugin.settings.aliases.splice(index, 1);
                        this.plugin.saveSettings();
                        this.display();
                    });
                });
        });
    }
}