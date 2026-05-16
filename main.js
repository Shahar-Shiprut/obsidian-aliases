const {
    Plugin,
    PluginSettingTab,
    Setting,
    Notice
} = require("obsidian");

const DEFAULT_SETTINGS = {
    aliases: []
};

module.exports = class CommandAliasesPlugin extends Plugin {
    async onload() {
        this.registeredCommands = [];

        await this.loadSettings();

        this.addSettingTab(
            new CommandAliasesSettingTab(this.app, this)
        );

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

    unregisterAliasCommands() {
        const commands = this.app.commands.commands;

        for (const id of this.registeredCommands) {
            delete commands[id];
        }

        this.registeredCommands = [];
    }

    registerAliasCommands() {
        const commandManager = this.app.commands;

        for (const entry of this.settings.aliases) {
            const originalCommand =
                commandManager.commands[entry.commandId];

            if (!originalCommand) {
                console.warn(
                    `[command-aliases] missing command: ${entry.commandId}`
                );

                continue;
            }

            for (const alias of entry.aliases) {
                const trimmed = alias.trim();

                if (!trimmed) {
                    continue;
                }

                const aliasId =
                    `command-alias:${entry.commandId}:${trimmed}`;

                this.addCommand({
                    id: aliasId,
                    name: trimmed,

                    checkCallback: (checking) => {
                        const cmd =
                            commandManager.commands[entry.commandId];

                        if (!cmd) {
                            return false;
                        }

                        if (checking) {
                            return true;
                        }

                        /*
                         * Some commands use callback()
                         * Some use checkCallback()
                         */

                        if (cmd.callback) {
                            cmd.callback();
                            return true;
                        }

                        if (cmd.checkCallback) {
                            return cmd.checkCallback(false);
                        }

                        return false;
                    }
                });

                this.registeredCommands.push(aliasId);
            }
        }
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

        containerEl.createEl("p", {
            text:
                "Configure aliases as JSON."
        });

        const textarea = containerEl.createEl("textarea");

        textarea.style.width = "100%";
        textarea.style.minHeight = "400px";
        textarea.style.fontFamily = "monospace";

        textarea.value = JSON.stringify(
            this.plugin.settings.aliases,
            null,
            2
        );

        new Setting(containerEl)
            .setName("Save aliases")
            .setDesc("Reload command aliases")
            .addButton((button) => {
                button
                    .setButtonText("Save")
                    .setCta()
                    .onClick(async () => {
                        try {
                            const parsed =
                                JSON.parse(textarea.value);

                            if (!Array.isArray(parsed)) {
                                throw new Error(
                                    "Root must be an array"
                                );
                            }

                            for (const entry of parsed) {
                                if (
                                    typeof entry.commandId !==
                                    "string"
                                ) {
                                    throw new Error(
                                        "commandId must be a string"
                                    );
                                }

                                if (
                                    !Array.isArray(entry.aliases)
                                ) {
                                    throw new Error(
                                        `aliases for ${entry.commandId} must be an array`
                                    );
                                }
                            }

                            this.plugin.settings.aliases =
                                parsed;

                            await this.plugin.saveSettings();

                            new Notice(
                                "Command aliases saved"
                            );
                        } catch (e) {
                            console.error(e);

                            new Notice(
                                "Invalid JSON: " + e.message
                            );
                        }
                    });
            });
    }
}