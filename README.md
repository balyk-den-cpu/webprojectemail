# Base44 Mail Assistant (Mock UI)

This repository contains a self-contained Chrome extension mockup for the Base44 Mail Assistant.
It provides the user interface for popup, options, and inline compose toolbar, while the background
service worker returns mocked responses for rewrite, translation, and voice-input triggers.

## Structure

- `manifest.json` – Extension manifest (MV3).
- `background.js` – Service worker with mocked context menu and API handlers.
- `icons/` – Extension icons (16/48/128 px).
- `content/` – Toolbar injection script and styles for supported webmail clients (voice input, quick reply, style + language pickers).
- `popup/` – Browser action popup UI.
- `options/` – Options page UI.
- `scripts/package.sh` – Утилита для упаковки расширения в ZIP-архив.

## Development

The source files can be edited directly in their respective folders. When вы готовы отправить
макет на тестирование или загрузку в Chrome Web Store, соберите свежий архив командой:

```bash
./scripts/package.sh
```

Скрипт пересоберёт `dist/Base44-Mail-Assistant.zip`, игнорируя старые артефакты. Сам ZIP не
хранится в репозитории — его нужно генерировать перед публикацией.

## Loading into Chrome

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select the repository root (or unzip the archive from `dist/`).
4. The extension icon and popup should now be available in the toolbar.

The mock background replies with placeholder strings – no external API is required.
