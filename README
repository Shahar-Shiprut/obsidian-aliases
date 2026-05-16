
# Command Aliases

An Obsidian plugin that lets you create custom aliases for existing commands in the command palette.

## Features

- **Create command aliases** - Add multiple alternative names for any Obsidian command
- **Easy configuration** - Define aliases using JSON format
- **View all commands** - Browse available command IDs directly in settings
- **Instant reload** - Changes take effect immediately when saved

## Installation

1. Download or clone this repository into your Obsidian vault's `.obsidian/plugins/` directory
2. Reload Obsidian
3. Enable the plugin in Settings → Community plugins

## Usage

1. Open Settings and navigate to the "Command Aliases" tab
2. Enter your aliases configuration as JSON in the textarea:

```json
[
    {
        "commandId": "editor:toggle-fold",
        "aliases": ["fold", "toggle fold"]
    },
    {
        "commandId": "markdown:toggle-bold",
        "aliases": ["bold", "**"]
    }
]
```

3. Click **Save** to apply changes
4. Your aliases will appear in the command palette immediately

### Configuration Format

Each entry must have:
- `commandId` (string) - The ID of the command to alias
- `aliases` (array) - List of alternative names

## Finding Command IDs

The settings tab displays all available command IDs at the bottom. Search for your desired command and copy its ID.

## License

See repository for license details.
