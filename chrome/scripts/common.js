export const setExtensionIcon = () => {
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
export const generateColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

export const DIRECT_CONN = {
    id: 'direct_connection',
    color: '#7a7c7d',
    name: 'Direct',
}