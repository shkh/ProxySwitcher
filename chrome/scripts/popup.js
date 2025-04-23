document.addEventListener('DOMContentLoaded', function () {
  const proxyList = document.getElementById('proxyList');
  const addProxyBtn = document.getElementById('addProxyBtn');
  const formContainer = document.getElementById('formContainer');
  const proxyForm = document.getElementById('proxyForm');
  const formTitle = document.getElementById('formTitle');
  const cancelBtn = document.getElementById('cancelBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const proxyTitle = document.getElementById('proxyTitle');
  const proxyIdInput = document.getElementById('proxyId');
  const proxyNameInput = document.getElementById('proxyName');
  const proxyColorInput = document.getElementById('proxyColor');
  const proxyTypeInput = document.getElementById('proxyType');
  const proxyHostInput = document.getElementById('proxyHost');
  const proxyPortInput = document.getElementById('proxyPort');
  const bypassListInput = document.getElementById('bypassList');

  const DIRECT_CONN = {
    id: 'direct_connection',
    color: '#7a7c7d',
    name: 'Direct',
  }

  function generateColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  let draggedItem = null;

  function handleDragStart(e) {
    draggedItem = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
    this.classList.add('dragging');
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(e) {
    e.preventDefault();
    if (draggedItem !== this) {
      const draggedIndex = parseInt(draggedItem.dataset.index, 10);
      const targetIndex = parseInt(this.dataset.index, 10);

      chrome.storage.local.get('proxies', (result) => {
        const proxies = result.proxies || [];
        const [movedProxy] = proxies.splice(draggedIndex, 1);
        proxies.splice(targetIndex, 0, movedProxy);

        chrome.storage.local.set({ proxies: proxies }, function () {
          refreshProxyList();
        });
      });
    }
  }

  function refreshProxyList() {
    chrome.storage.local.get(['proxies', 'activeProxyId'], (result) => {
      const proxies = result.proxies || [];
      const activeProxyId = result.activeProxyId || DIRECT_CONN.id;
      proxies.push(DIRECT_CONN);

      proxyList.innerHTML = '';

      proxies.forEach((proxy, index) => {
        const proxyItem = document.createElement('div');
        proxyItem.className = 'proxy-item';
        proxyItem.dataset.id = proxy.id;
        proxyItem.dataset.index = index; 
        proxyItem.draggable = true;
        proxyItem.style.borderLeft = `4px solid ${proxy.color}`;

        const radioBtn = document.createElement('input');
        radioBtn.type = 'radio';
        radioBtn.name = 'proxySelection';
        radioBtn.className = 'proxy-radio';
        radioBtn.value = proxy.id;
        radioBtn.checked = (proxy.id === activeProxyId);

        proxyItem.innerHTML = `
          <div class="proxy-item-info">
            <div class="proxy-item-name">${proxy.name}</div>
          </div>
          `;
        if (proxy.id != DIRECT_CONN.id) {
          proxyItem.innerHTML += `
          <div class="proxy-item-actions">
            <button class="edit-btn" data-id="${proxy.id}">Edit</button>
          </div>
          `;
        }

        proxyItem.addEventListener('dragstart', handleDragStart);
        proxyItem.addEventListener('dragover', handleDragOver);
        proxyItem.addEventListener('drop', handleDrop);

        proxyItem.insertBefore(radioBtn, proxyItem.firstChild);
        proxyList.appendChild(proxyItem);

        if (proxy.id != DIRECT_CONN.id) {
          radioBtn.addEventListener('change', () => {
            if (this.checked) {
              applyProxy(proxy.id);
            }
          });
          proxyItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('edit-btn') && !e.target.classList.contains('proxy-radio')) {
              radioBtn.checked = true;
              applyProxy(proxy.id);
            }
          });
          proxyItem.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            editProxy(proxy.id);
          });
        } else {
          radioBtn.addEventListener('change', () => {
            if (this.checked) {
              disableProxy();
            }
          });
          proxyItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('proxy-radio')) {
              radioBtn.checked = true;
              disableProxy();
            }
          });
        }
      });

      setExtensionIcon();
    });
  }

  function applyProxy(proxyId) {
    chrome.storage.local.get('proxies', (result) => {
      const proxies = result.proxies || [];
      const proxy = proxies.find(p => p.id === proxyId);

      if (proxy) {
        const config = {
          mode: "fixed_servers",
          rules: {
            singleProxy: {
              scheme: proxy.type,
              host: proxy.host,
              port: parseInt(proxy.port)
            },
            bypassList: proxy.bypassList.split(',').map(item => item.trim()).filter(item => item)
          }
        };

        chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
          chrome.storage.local.set({ activeProxyId: proxyId }, () => {
            refreshProxyList();
          });
        });
      }
    });
  }

  function disableProxy() {
    const config = {
      mode: "direct"
    };

    chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
      chrome.storage.local.set({ activeProxyId: DIRECT_CONN.id }, () =>{
        refreshProxyList();
      });
    });
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

  function showAddProxyForm() {
    const color = generateColor();
    formTitle.textContent = 'Settings of';
    proxyIdInput.value = '';
    proxyForm.reset();
    proxyTitle.style.backgroundColor = color;
    proxyColorInput.value = color;
    proxyTitle.textContent = "New Proxy";
    deleteBtn.classList.add('hidden');
    formContainer.classList.remove('hidden');
    addProxyBtn.classList.add('hidden');
  }

  function editProxy(proxyId) {
    chrome.storage.local.get('proxies', (result) => {
      const proxies = result.proxies || [];
      const proxy = proxies.find(p => p.id === proxyId);

      if (proxy) {
        formTitle.textContent = 'Settings of';
        proxyTitle.textContent = proxy.name;
        proxyIdInput.value = proxy.id;
        proxyNameInput.value = proxy.name;
        proxyColorInput.value = proxy.color;
        proxyTypeInput.value = proxy.type;
        proxyHostInput.value = proxy.host;
        proxyPortInput.value = proxy.port;
        bypassListInput.value = proxy.bypassList;
        proxyTitle.style.backgroundColor = proxy.color;

        deleteBtn.classList.remove('hidden');
        formContainer.classList.remove('hidden');
        addProxyBtn.classList.add('hidden');
      }
    });
  }

  function saveProxy() {
    const proxyId = proxyIdInput.value || Date.now().toString();
    const proxyData = {
      id: proxyId,
      name: proxyNameInput.value,
      type: proxyTypeInput.value,
      host: proxyHostInput.value,
      port: proxyPortInput.value,
      bypassList: bypassListInput.value,
      color: proxyColorInput.value
    };

    chrome.storage.local.get(['proxies', 'activeProxyId'], (result) =>{
      let proxies = result.proxies || [];
      const activeProxyId = result.activeProxyId;
      const existingIndex = proxies.findIndex(p => p.id === proxyId);

      if (existingIndex !== -1) {
        proxies[existingIndex] = proxyData;
      } else {
        proxies.push(proxyData);
      }

      chrome.storage.local.set({ proxies: proxies }, () => {
        formContainer.classList.add('hidden');
        addProxyBtn.classList.remove('hidden');
        refreshProxyList();

        if (activeProxyId === proxyId) {
          applyProxy(proxyId);
        }
      });
    });
  }

  function deleteProxy() {
    const proxyId = proxyIdInput.value;
    if (!proxyId) return;

    chrome.storage.local.get(['proxies', 'activeProxyId'], (result) => {
      let proxies = result.proxies || [];
      const activeProxyId = result.activeProxyId;

      proxies = proxies.filter(p => p.id !== proxyId);

      const shouldDisable = activeProxyId === proxyId;

      chrome.storage.local.set({ proxies: proxies }, () => {
        if (shouldDisable) {
          disableProxy();
        } else {
          refreshProxyList();
        }
        formContainer.classList.add('hidden');
        addProxyBtn.classList.remove('hidden');
      });
    });
  }

  addProxyBtn.addEventListener('click', showAddProxyForm);
  cancelBtn.addEventListener('click', () => {
    formContainer.classList.add('hidden');
    addProxyBtn.classList.remove('hidden');
  });
  deleteBtn.addEventListener('click', deleteProxy);
  proxyForm.addEventListener('submit', function (e) {
    e.preventDefault();
    saveProxy();
  });

  refreshProxyList();
});