const DIRECT_CONN = {
  id: 'direct_connection',
  color: '#7a7c7d',
  name: 'Direct',
}

function setExtensionIcon() {
  chrome.storage.local.get(['proxies', 'activeProxyId'], (result) => {
    const proxies = result.proxies || [];
    const activeProxy = proxies.find(p => p.id === result.activeProxyId);
    const activeProxyColor = activeProxy ? activeProxy.color : DIRECT_CONN.color;
    const canvas = new OffscreenCanvas(16, 16);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = activeProxyColor;
    ctx.beginPath();
    ctx.arc(8, 8, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'italic bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('P', 8, 9);
    const imageData = ctx.getImageData(0, 0, 16, 16);
    chrome.action.setIcon({ imageData: imageData });
  });
}

function backwardCompatibility() {
  chrome.storage.local.get(['proxies'], (result) => {
    let proxies = result.proxies || [];

    // convert rgb format to hex format
    proxies.forEach(proxy => {
      if (proxy.color && proxy.color.startsWith('rgb')) {
        const rgb = proxy.color.match(/\d+/g);
        proxy.color = `#${rgb.map(x => ('0' + parseInt(x).toString(16)).slice(-2)).join('')}`;
      }
    });
    console.log(proxies);
    chrome.storage.local.set({ proxies: proxies });
  });
}

chrome.runtime.onInstalled.addListener(() =>{
  chrome.storage.local.get(['proxies', 'activeProxyId'], (result) => {
    if (!result.proxies) {
      chrome.storage.local.set({ proxies: [] });
    }
    if (!result.activeProxyId) {
      chrome.storage.local.set({ activeProxyId: DIRECT_CONN.id });
    }
    setExtensionIcon();
  });
});

chrome.runtime.onStartup.addListener(() => {
  backwardCompatibility();
  setExtensionIcon();
})
  