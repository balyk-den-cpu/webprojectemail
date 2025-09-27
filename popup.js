const $ = (s) => document.querySelector(s)

chrome.storage.sync.get(["uiLang","subscription"], (r)=>{
  $("#uiLang").value = r.uiLang || "ru"
  const sub = r.subscription || { plan:"Пробный", until:"—" }
  $("#subInfo").textContent = `Тариф: ${sub.plan} · до ${sub.until}`
})

$("#uiLang").onchange = (e)=> chrome.storage.sync.set({ uiLang: e.target.value })
$("#openOptions").onclick = ()=> chrome.runtime.openOptionsPage()
$("#openAccount").onclick = ()=> chrome.runtime.sendMessage({ type:"OPEN_TAB", url:"https://app.your-base44.app/account" })
