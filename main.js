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

        this.plugin.settings.aliases.forEach((entry, index) => {
            new Setting(containerEl)
                .setName(`Alias ${index + 1}`)
                .addSearch(search => search
                    .setPlaceholder("Select command")
                    .setValue(entry.commandId)
                    .onChange(value => {
                        this.plugin.settings.aliases[index].commandId = value;
                        this.plugin.saveSettings();
                    })
                )
                .addText(text => text
                    .setPlaceholder("Enter alias")
                    .setValue(entry.alias)
                    .onChange(value => {
                        this.plugin.settings.aliases[index].alias = value;
                        this.plugin.saveSettings();
                    })
                )
                .addButton(button => button
                    .setButtonText("Delete")
                    .setWarning()
                    .onClick(() => {
                        this.plugin.settings.aliases.splice(index, 1);
                        this.plugin.saveSettings();
                        this.display();
                    })
                );
        });

        new Setting(containerEl)
            .addButton(button => button
                .setButtonText("Add Alias")
                .setCta()
                .onClick(() => {
                    this.plugin.settings.aliases.push({
                        commandId: "",
                        alias: ""
                    });
                    this.plugin.saveSettings();
                    this.display();
                })
            );
    }
}