import { setExtensionIcon } from './common.js';
import { DIRECT_CONN } from './common.js';

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
  