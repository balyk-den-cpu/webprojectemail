(function () {
  const qs = (s, r = document) => r.querySelector(s)
  const el = (t, c, p) => { const e = document.createElement(t); if (c) e.className = c; if (p) Object.assign(e, p); return e }

  const state = {
    defaults: { style: 'Дружелюбный', lang: 'ru' },
    refs: {},
  }

  function findComposeBody() {
    const gmail = qs("div[aria-label='Message Body'], div.editable")
    if (gmail && !gmail.closest('[name=\"subjectbox\"]')) return gmail
    const outlook = qs("div[role='textbox'][contenteditable='true']")
    if (outlook) return outlook
    const yandex = qs("[contenteditable='true'][role='textbox']")
    if (yandex) return yandex
    const mailru = qs("div.compose__editor div[contenteditable='true']")
    if (mailru) return mailru
    const active = document.activeElement
    if (active && (active.isContentEditable || active.tagName === 'TEXTAREA')) return active
    return null
  }

  function buildBar() {
    const bar = el('div');
    bar.id = 'b44-inlinebar'

    const micBtn = el('button', 'icon', { title: 'Голосовой ввод (запросит доступ к микрофону)' })
    micBtn.innerText = '🎙'
    micBtn.dataset.action = 'voice'

    const selStyle = el('select', null, { title: 'Стиль письма', id: 'b44-style' })
    ;['Дружелюбный','Официальный','Кратко','Убеждающий','Технический'].forEach((s)=>{
      const o = el('option', null, { innerText: s, value: s }); selStyle.append(o)
    })

    const selLang = el('select', null, { title: 'Язык перевода', id: 'b44-lang' })
    ;[{code:'ru',label:'Русский'},{code:'en',label:'English'},{code:'sr-Latn',label:'Srpski'}]
      .forEach((l)=>{ const o = el('option', null, { innerText: l.label, value: l.code}); selLang.append(o) })

    const rewriteBtn = el('button', 'primary', { innerText: 'Исправить' })
    rewriteBtn.dataset.action = 'rewrite'

    const translateBtn = el('button', null, { innerText: 'Перевести' })
    translateBtn.dataset.action = 'translate'

    const quickBtn = el('button', 'ghost', { innerText: 'Быстрый ответ' })
    quickBtn.dataset.action = 'quick-reply'

    const info = el('div', 'mini', { innerText: 'Base44' })

    bar.append(micBtn, selStyle, selLang, rewriteBtn, translateBtn, el('div','sep'), quickBtn, info)

    state.refs = { bar, micBtn, selStyle, selLang, rewriteBtn, translateBtn, quickBtn }
    applyDefaults()

    micBtn.addEventListener('click', startVoiceInput)
    rewriteBtn.addEventListener('click', () => runRewrite())
    translateBtn.addEventListener('click', () => runTranslate())
    quickBtn.addEventListener('click', () => insertText('Спасибо! Получил(а) ваше письмо. Вернусь с ответом в течение дня.'))

    return bar
  }

  function applyDefaults() {
    const { selStyle, selLang } = state.refs
    if (selStyle) selStyle.value = state.defaults.style
    if (selLang) selLang.value = state.defaults.lang
  }

  function findFloatingContainer(body) {
    if (!body) return null
    let candidate = body.parentElement
    while (candidate && candidate !== document.body) {
      const rect = candidate.getBoundingClientRect?.()
      if (rect && rect.width > 200 && rect.height > 120) {
        return candidate
      }
      candidate = candidate.parentElement
    }
    return body.parentElement || body
  }

  function placeBar() {
    const body = findComposeBody()
    if (!body) return false
    const bar = qs('#b44-inlinebar') || buildBar()

    const container = findFloatingContainer(body)
    if (container) {
      if (bar.parentElement !== container) {
        container.appendChild(bar)
      }
      const style = window.getComputedStyle(container)
      if (style.position === 'static') {
        container.classList.add('b44-inline-holder')
      }
      bar.dataset.mode = 'floating'
      return true
    }
    return false
  }

  function ensureWithFallback() {
    if (placeBar()) return
    setTimeout(() => {
      if (placeBar()) return
      const bar = qs('#b44-inlinebar') || buildBar()
      let holder = document.getElementById('b44-fallback')
      if (!holder) {
        holder = el('div', null, { id: 'b44-fallback' })
        document.documentElement.appendChild(holder)
      }
      holder.innerHTML = ''
      holder.appendChild(bar)
      bar.dataset.mode = 'fallback'
    }, 1200)
  }

  function getCurrentText() {
    const target = findComposeBody()
    if (!target) return ''
    if (target.tagName === 'TEXTAREA') return target.value
    return target.innerText || ''
  }

  function captureSelectionState(target) {
    if (!target) return null
    if (target.tagName === 'TEXTAREA') {
      const start = target.selectionStart ?? target.value.length
      const end = target.selectionEnd ?? target.value.length
      return { type: 'textarea', element: target, start, end }
    }
    if (target.isContentEditable) {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) return null
      return { type: 'contenteditable', element: target, range: sel.getRangeAt(0).cloneRange() }
    }
    return null
  }

  function restoreSelection(state) {
    if (!state) return false
    if (state.type === 'textarea') {
      state.element.focus()
      state.element.setSelectionRange(state.start, state.end)
      return true
    }
    if (state.type === 'contenteditable') {
      state.element.focus()
      const sel = window.getSelection()
      if (!sel) return false
      sel.removeAllRanges()
      sel.addRange(state.range)
      return true
    }
    return false
  }

  function insertText(text) {
    const target = findComposeBody()
    if (!target || !text) return
    if (target.tagName === 'TEXTAREA') {
      const ta = target
      const start = ta.selectionStart ?? ta.value.length
      const end = ta.selectionEnd ?? ta.value.length
      ta.value = ta.value.slice(0, start) + text + ta.value.slice(end)
      ta.setSelectionRange(start + text.length, start + text.length)
      ta.dispatchEvent(new Event('input', { bubbles: true }))
      return
    }
    if (target.isContentEditable) {
      target.focus()
      document.execCommand('insertText', false, text)
    }
  }

  function replaceText(text) {
    const target = findComposeBody()
    if (!target || !text) return
    if (target.tagName === 'TEXTAREA') {
      target.value = text
      target.dispatchEvent(new Event('input', { bubbles: true }))
      return
    }
    if (target.isContentEditable) {
      target.innerHTML = ''
      insertText(text)
    }
  }

  function applyReplacement(stateSnapshot, text) {
    const target = stateSnapshot?.element || findComposeBody()
    if (!target) return
    if (stateSnapshot && restoreSelection(stateSnapshot)) {
      if (stateSnapshot.type === 'textarea') {
        stateSnapshot.element.setRangeText(text, stateSnapshot.start, stateSnapshot.end, 'end')
        stateSnapshot.element.dispatchEvent(new Event('input', { bubbles: true }))
        return
      }
      if (stateSnapshot.type === 'contenteditable') {
        document.execCommand('insertText', false, text)
        return
      }
    }
    replaceText(text)
  }

  function setBusy(which, busy) {
    const { rewriteBtn, translateBtn, micBtn } = state.refs
    if (which === 'rewrite' && rewriteBtn) {
      rewriteBtn.disabled = busy
      rewriteBtn.dataset.loading = busy ? '1' : ''
    }
    if (which === 'translate' && translateBtn) {
      translateBtn.disabled = busy
      translateBtn.dataset.loading = busy ? '1' : ''
    }
    if (which === 'voice' && micBtn) {
      micBtn.disabled = busy
      micBtn.dataset.loading = busy ? '1' : ''
    }
  }

  function showToast(message) {
    if (!message) return
    let toast = document.getElementById('b44-toast')
    if (!toast) {
      toast = el('div', null, { id: 'b44-toast' })
      document.documentElement.appendChild(toast)
    }
    toast.textContent = message
    toast.classList.add('show')
    setTimeout(() => toast.classList.remove('show'), 2000)
  }

  async function startVoiceInput() {
    if (!navigator.mediaDevices?.getUserMedia) {
      showToast('Голосовой ввод не поддерживается в этом браузере')
      return
    }
    setBusy('voice', true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      insertText('🎙 [Голос: будет транскрибирован на сервере Base44] ')
      showToast('Микрофон включён — текст появится после обработки на сервере Base44')
    } catch (e) {
      showToast('Нет доступа к микрофону. Разрешите микрофон для сайта.')
    } finally {
      setBusy('voice', false)
    }
  }

  function runRewrite() {
    const { selStyle } = state.refs
    const style = selStyle?.value || state.defaults.style
    const target = findComposeBody()
    const selectionText = window.getSelection()?.toString()?.trim()
    const text = selectionText || getCurrentText()
    if (!text) {
      showToast('Нет текста для переписывания')
      return
    }
    const snapshot = selectionText ? captureSelectionState(target) : null
    setBusy('rewrite', true)
    chrome.runtime.sendMessage({ type: 'API_REWRITE', payload: { text, style } }, (res) => {
      setBusy('rewrite', false)
      if (res?.ok) {
        applyReplacement(snapshot, res.data)
        showToast('Текст переписан')
      }
    })
  }

  function runTranslate() {
    const { selLang } = state.refs
    const lang = selLang?.value || state.defaults.lang
    const target = findComposeBody()
    const selectionText = window.getSelection()?.toString()?.trim()
    const text = selectionText || getCurrentText()
    if (!text) {
      showToast('Нет текста для перевода')
      return
    }
    const snapshot = selectionText ? captureSelectionState(target) : null
    setBusy('translate', true)
    chrome.runtime.sendMessage({ type: 'API_TRANSLATE', payload: { text, target: lang } }, (res) => {
      setBusy('translate', false)
      if (res?.ok) {
        applyReplacement(snapshot, res.data)
        showToast('Текст переведён')
      }
    })
  }

  function boot() {
    ensureWithFallback()
    const obs = new MutationObserver(() => ensureWithFallback())
    obs.observe(document.documentElement, { childList: true, subtree: true })
  }

  chrome.storage.sync.get(['style', 'lang'], (cfg) => {
    if (cfg.style) state.defaults.style = cfg.style
    if (cfg.lang) state.defaults.lang = cfg.lang
    applyDefaults()
  })

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return
    if (changes.style) {
      state.defaults.style = changes.style.newValue || state.defaults.style
      applyDefaults()
    }
    if (changes.lang) {
      state.defaults.lang = changes.lang.newValue || state.defaults.lang
      applyDefaults()
    }
  })

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot()

  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg?.type) return
    if (msg.type === 'CMD_TRIGGER_REWRITE') {
      runRewrite()
    }
    if (msg.type === 'CMD_TRIGGER_TRANSLATE') {
      runTranslate()
    }
    if (msg.type === 'CMD_TOGGLE_VOICE') {
      startVoiceInput()
    }
  })
})()
