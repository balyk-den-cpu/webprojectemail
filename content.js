(function () {
  const qs = (s, r = document) => r.querySelector(s)
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s))
  const el = (t, c, p) => { const e = document.createElement(t); if (c) e.className = c; if (p) Object.assign(e, p); return e }

  function findComposeBody() {
    const gmail = qs("div[aria-label='Message Body'], div.editable")
    if (gmail && !gmail.closest('[name=\"subjectbox\"]')) return gmail
    const outlook = qs(\"div[role='textbox'][contenteditable='true']\")
    if (outlook) return outlook
    const yandex = qs(\"[contenteditable='true'][role='textbox']\")
    if (yandex) return yandex
    const mailru = qs(\"div.compose__editor div[contenteditable='true']\")
    if (mailru) return mailru
    const active = document.activeElement
    if (active && (active.isContentEditable || active.tagName === 'TEXTAREA')) return active
    return null
  }

  function findActionRow() {
    const sendBtn = qs(\"[aria-label*='Send'], [data-tooltip*='Send'], [aria-label*='Отправ'], [data-tooltip*='Отправ']\")
    if (sendBtn) return sendBtn.closest('tr, div, footer, .btC, .compose-actions') || sendBtn.parentElement
    const outlookSend = qs(\"button[data-automationid='sendButton']\")
    if (outlookSend) return outlookSend.parentElement
    const yandexSend = qsa(\"button\").find(b => /Отправ/i.test(b.textContent||\"\")) || qs(\"button[data-click-action*='send']\")
    if (yandexSend) return yandexSend.parentElement
    const mailruSend = qsa(\"button\").find(b => /Отправ/i.test(b.textContent||\"\")) || qs(\"button[data-test-id='send']\")
    if (mailruSend) return mailruSend.parentElement
    return null
  }

  function buildBar() {
    const bar = el('div'); bar.id = 'b44-inlinebar'
    const micBtn = el('button', 'icon', { title: 'Голосовой ввод (запросит доступ к микрофону)' }); micBtn.innerText = '🎙'
    const selStyle = el('select', null, { title: 'Стиль' })
    ;['Дружелюбный','Официальный','Кратко','Убеждающий','Технический'].forEach((s)=>{
      const o = el('option', null, { innerText: s, value: s }); selStyle.append(o)
    })
    const selLang = el('select', null, { title: 'Язык' })
    ;[{code:'ru',label:'Русский'},{code:'en',label:'English'},{code:'sr-Latn',label:'Srpski'}]
      .forEach((l)=>{ const o = el('option', null, { innerText: l.label, value: l.code}); selLang.append(o) })
    const rewriteBtn = el('button', null, { innerText: 'Исправить' })
    const translateBtn = el('button', null, { innerText: 'Перевести' })
    const quickBtn = el('button', null, { innerText: 'Быстрый ответ' })
    const info = el('div', 'mini', { innerText: 'Base44' })
    bar.append(micBtn, selStyle, selLang, rewriteBtn, translateBtn, el('div','sep'), quickBtn, info)

    micBtn.onclick = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(t=>t.stop())
        insertText('🎙 [Голос: будет транскрибирован на сервере Base44] ')
      } catch (e) {
        alert('Нет доступа к микрофону. Разрешите микрофон для этого сайта в настройках браузера.')
      }
    }
    rewriteBtn.onclick = () => {
      const current = getCurrentText()
      chrome.runtime.sendMessage({ type: 'API_REWRITE', payload: { text: current, style: selStyle.value } }, (res) => {
        if (res?.ok) replaceText(res.data)
      })
    }
    translateBtn.onclick = () => {
      const current = getCurrentText()
      chrome.runtime.sendMessage({ type: 'API_TRANSLATE', payload: { text: current, target: selLang.value } }, (res) => {
        if (res?.ok) replaceText(res.data)
      })
    }
    quickBtn.onclick = () => {
      const template = 'Спасибо! Получил(а) ваше письмо. Вернусь с ответом в течение дня.'
      insertText(template)
    }
    return bar
  }

  function placeBar() {
    const body = findComposeBody()
    if (!body) return false
    const actionRow = findActionRow()
    const bar = qs('#b44-inlinebar') || buildBar()

    if (actionRow) {
      bar.style.position = 'relative'
      bar.style.right = 'auto'
      bar.style.bottom = 'auto'
      if (bar.parentElement !== actionRow) {
        actionRow.appendChild(bar)
      }
      return true
    } else {
      // fallback above body
      if (body.previousElementSibling !== bar) {
        bar.style.position = 'relative'
        bar.style.right = 'auto'
        bar.style.bottom = 'auto'
        body.parentElement.insertBefore(bar, body)
      }
      return true
    }
  }

  // FINAL FALLBACK: fixed overlay if nothing found in 1.5s
  function ensureWithFallback() {
    if (placeBar()) return
    setTimeout(() => {
      if (placeBar()) return
      let bar = qs('#b44-inlinebar') || buildBar()
      bar.id = 'b44-inlinebar'
      let holder = document.getElementById('b44-fallback')
      if (!holder) { holder = el('div', null, { id: 'b44-fallback' }); document.documentElement.appendChild(holder) }
      holder.innerHTML = ''; holder.appendChild(bar)
      bar.style.position = 'static'
    }, 1500)
  }

  function getCurrentText() {
    const target = findComposeBody()
    if (!target) return ''
    if (target.tagName === 'TEXTAREA') return target.value
    return target.innerText || ''
  }
  function insertText(text) {
    const target = findComposeBody()
    if (!target) return
    if (target.tagName === 'TEXTAREA') {
      const ta = target
      const start = ta.selectionStart ?? ta.value.length
      const end = ta.selectionEnd ?? ta.value.length
      ta.value = ta.value.slice(0, start) + text + ta.value.slice(end)
      ta.dispatchEvent(new Event('input', { bubbles: true }))
      return
    }
    if (target.isContentEditable) {
      target.focus()
      document.execCommand('insertText', false, text)
      return
    }
  }
  function replaceText(text) {
    const target = findComposeBody()
    if (!target) return
    if (target.tagName === 'TEXTAREA') {
      target.value = text
      target.dispatchEvent(new Event('input', { bubbles: true }))
      return
    }
    if (target.isContentEditable) {
      target.innerHTML = ''; insertText(text); return
    }
  }

  function boot() {
    ensureWithFallback()
    const obs = new MutationObserver(()=> ensureWithFallback())
    obs.observe(document.documentElement, { childList: true, subtree: true })
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot()

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'CMD_REWRITE_SELECTION') {
      const selection = window.getSelection()?.toString() || ''
      replaceText(selection ? selection : getCurrentText())
    }
    if (msg.type === 'CMD_TRANSLATE_SELECTION') {
      const selection = window.getSelection()?.toString() || ''
      insertText(selection ? selection + ' → [перевод]' : '→ [перевод]')
    }
  })
})()
