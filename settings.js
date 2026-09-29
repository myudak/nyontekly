const opacity = document.getElementById('opacity')
const opacityValue = document.getElementById('opacityValue')
const alwaysOnTop = document.getElementById('alwaysOnTop')
const toolUrl = document.getElementById('toolUrl')
const status = document.getElementById('status')

window.webToolSettings.get().then(settings => {
  opacity.value = Math.round(settings.opacity * 100)
  opacityValue.textContent = `${opacity.value}%`
  alwaysOnTop.checked = settings.alwaysOnTop
  toolUrl.value = settings.toolUrl
})

opacity.addEventListener('input', () => {
  opacityValue.textContent = `${opacity.value}%`
  window.webToolSettings.update({ opacity: Number(opacity.value) / 100 })
})

alwaysOnTop.addEventListener('change', () => {
  window.webToolSettings.update({ alwaysOnTop: alwaysOnTop.checked })
})

function applyUrl() {
  status.textContent = ''
  window.webToolSettings.update({ toolUrl: toolUrl.value })
    .catch(error => { status.textContent = error.message })
}

document.getElementById('applyUrl').addEventListener('click', applyUrl)
toolUrl.addEventListener('keydown', event => {
  if (event.key === 'Enter') applyUrl()
})
