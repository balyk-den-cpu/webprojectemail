// background.js — Service Worker (mock only)
const MOCK_LATENCY_MS = 400

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "rewrite", title: "Base44: Исправить/переписать", contexts: ["selection"] })
  chrome.contextMenus.create({ id: "translate", title: "Base44: Перевести", contexts: ["selection"] })
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return
  if (info.menuItemId === "rewrite") {
    chrome.tabs.sendMessage(tab.id, { type: "CMD_TRIGGER_REWRITE" })
  }
  if (info.menuItemId === "translate") {
    chrome.tabs.sendMessage(tab.id, { type: "CMD_TRIGGER_TRANSLATE" })
  }
})

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const done = (data) => {
    setTimeout(() => sendResponse({ ok: true, data }), MOCK_LATENCY_MS)
    return true
  }
  if (msg.type === "API_REWRITE") {
    const { text, style } = msg.payload
    return done(`[${style}] ${text}`)
  }
  if (msg.type === "API_TRANSLATE") {
    const { text, target } = msg.payload
    return done(`${text} → (${target})`)
  }
  if (msg.type === "SET_BADGE") {
    const { text, color } = msg.payload
    chrome.action.setBadgeText({ text })
    if (color) chrome.action.setBadgeBackgroundColor({ color })
    return sendResponse({ ok: true })
  }
  if (msg.type === "OPEN_TAB") {
    chrome.tabs.create({ url: msg.url })
    return sendResponse({ ok: true })
  }
  return false
})

chrome.commands.onCommand.addListener(async (command) => {
  if (!command) return
  const actionable = ["rewrite", "translate", "toggle-voice"]
  if (!actionable.includes(command)) return
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) return
  const map = {
    "rewrite": { type: "CMD_TRIGGER_REWRITE" },
    "translate": { type: "CMD_TRIGGER_TRANSLATE" },
    "toggle-voice": { type: "CMD_TOGGLE_VOICE" }
  }
  chrome.tabs.sendMessage(tab.id, map[command])
})
