const $ = (s) => document.querySelector(s)
const $$ = (s) => Array.from(document.querySelectorAll(s))

chrome.storage.sync.get(["style","lang","hosts","mode"], (r)=>{
  if (r.style) $("#style").value = r.style
  if (r.lang) $("#lang").value = r.lang
  if (r.mode) $$("input[name='mode']").forEach(i=> i.checked = (i.value===r.mode))
  if (r.hosts) {
    $$(".sites input[type='checkbox']").forEach(cb=> cb.checked = !!r.hosts[cb.dataset.host])
  }
})

$("#save").onclick = ()=>{
  const style = $("#style").value
  const lang = $("#lang").value
  const mode = $$("input[name='mode']").find(i=>i.checked)?.value || "mock"
  const hosts = {}
  $$(".sites input[type='checkbox']").forEach(cb=> hosts[cb.dataset.host] = cb.checked)
  chrome.storage.sync.set({ style, lang, hosts, mode }, ()=>{
    $("#status").innerText = "Сохранено"
    setTimeout(()=> $("#status").innerText = "", 1200)
  })
}
