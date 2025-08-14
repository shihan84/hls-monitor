// HLS Multi-Viewer Application - Broadcast Edition
class HLSMultiViewer {
    constructor() {
        this.streams = new Map();
        this.currentLayout = 4; // Default 2x2 layout
        this.hlsInstances = new Map();
        this.notificationEnabled = true;
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        this.retryDelay = 5000;
        this.errorNotificationCooldown = new Map();
        this.notificationDebounce = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadStreamsFromStorage();
        this.updateLayout();
        this.updateStreamList();
        this.createVideoPlayers();
        this.populateLayoutOptions();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.showAddStreamModal();
            }
        });
    }

    // Modal Functions
    showAddStreamModal() {
        document.getElementById('addStreamModal').style.display = 'flex';
        document.getElementById('streamName').focus();
    }

    hideAddStreamModal() {
        document.getElementById('addStreamModal').style.display = 'none';
        this.clearModalForm();
    }

    clearModalForm() {
        document.getElementById('streamName').value = '';
        document.getElementById('streamUrl').value = '';
        document.getElementById('streamLayout').value = '1';
    }

    // Stream Management
    addStream() {
        const name = document.getElementById('streamName').value.trim();
        const url = document.getElementById('streamUrl').value.trim();
        const position = parseInt(document.getElementById('streamLayout').value);

        if (!name || !url) {
            this.showNotification('Please provide both a name and a URL.', 'error');
            return;
        }

        if (!this.isValidHLSURL(url)) {
            this.showNotification('Invalid HLS URL. It must end with .m3u8.', 'error');
            return;
        }

        const streamId = 'stream_' + Date.now();
        const stream = { id: streamId, name, url, position, active: true };

        this.streams.set(streamId, stream);
        this.saveStreamsToStorage();
        this.updateStreamList();
        this.createVideoPlayer(stream);
        this.hideAddStreamModal();
        this.showNotification(`Stream "${name}" added.`, 'success');
    }

    removeStream(streamId) {
        const stream = this.streams.get(streamId);
        if (stream) {
            this.stopStream(streamId);
            this.streams.delete(streamId);
            this.saveStreamsToStorage();
            this.updateStreamList();
            this.removeVideoPlayer(streamId);
            this.showNotification(`Stream "${stream.name}" removed.`, 'info');
        }
    }

    toggleStream(streamId) {
        const stream = this.streams.get(streamId);
        if (stream) {
            stream.active = !stream.active;
            this.saveStreamsToStorage();
            this.updateStreamList();
            
            if (stream.active) {
                this.startStream(stream);
            } else {
                this.stopStream(streamId);
            }
        }
    }

    // HLS Stream Management
    startStream(stream) {
        const videoElement = document.getElementById(`video-${stream.id}`);
        if (!videoElement) return;

        this.stopStream(stream.id);

        if (Hls.isSupported()) {
            const hls = new Hls({
                lowLatencyMode: true,
                backBufferLength: 90
            });

            hls.loadSource(stream.url);
            hls.attachMedia(videoElement);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoElement.play().catch(e => console.log('Autoplay was prevented:', e));
                this.updateVideoOverlay(stream.id, 'playing');
                this.resetWatchdog(stream.id);
                this.sendTelegramNotification(`Stream "${stream.name}" has started successfully.`, stream.name, 'Stream Started');
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS Error:', data);
                if (data.fatal) {
                    this.updateVideoOverlay(stream.id, 'error', 'Stream failed. Retrying...');
                    this.startWatchdog(stream);
                }
            });

            this.hlsInstances.set(stream.id, hls);
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            videoElement.src = stream.url;
            videoElement.addEventListener('loadedmetadata', () => {
                videoElement.play().catch(e => console.log('Autoplay was prevented:', e));
                this.updateVideoOverlay(stream.id, 'playing');
                this.resetWatchdog(stream.id);
                this.sendTelegramNotification(`Stream "${stream.name}" started successfully (native HLS).`, stream.name, 'Stream Started');
            });
            videoElement.addEventListener('error', (e) => {
                console.error('Video Error:', e);
                this.startWatchdog(stream);
            });
        } else {
            this.updateVideoOverlay(stream.id, 'error', 'HLS not supported');
            this.sendTelegramNotification('HLS is not supported on this browser.', stream.name, 'Browser Error');
        }
    }

    stopStream(streamId) {
        const hls = this.hlsInstances.get(streamId);
        if (hls) {
            hls.destroy();
            this.hlsInstances.delete(streamId);
        }

        const videoElement = document.getElementById(`video-${streamId}`);
        if (videoElement) {
            videoElement.src = '';
            this.updateVideoOverlay(streamId, 'stopped');
        }
    }

    // Video Player Management
    createVideoPlayers() {
        const videoGrid = document.getElementById('videoGrid');
        videoGrid.innerHTML = '';
        const streamsToStart = [];
        const slotCount = this.currentLayout;

        for (let i = 1; i <= slotCount; i++) {
            const videoPlayer = document.createElement('div');
            videoPlayer.className = 'video-player';
            videoPlayer.id = `player-slot-${i}`;

            const streamForSlot = Array.from(this.streams.values()).find(s => s.position === i);

            if (streamForSlot) {
                videoPlayer.innerHTML = `
                    <video id="video-${streamForSlot.id}" muted controls playsinline></video>
                    <div class="video-overlay" id="overlay-${streamForSlot.id}">
                        <i class="fas fa-spinner fa-spin"></i>
                        <h3>${streamForSlot.name}</h3>
                        <p>Loading...</p>
                    </div>
                `;
                if (streamForSlot.active) {
                    streamsToStart.push(streamForSlot);
                }
            } else {
                videoPlayer.innerHTML = `
                    <div class="video-overlay">
                        <i class="fas fa-plus-circle"></i>
                        <h3>Empty Slot ${i}</h3>
                        <p>Add a stream</p>
                    </div>
                `;
            }
            videoGrid.appendChild(videoPlayer);
        }
        
        streamsToStart.forEach((stream, index) => {
            setTimeout(() => this.startStream(stream), index * 200);
        });
    }

    createVideoPlayer(stream) {
        this.createVideoPlayers(); // Just recreate the grid
    }

    removeVideoPlayer(streamId) {
        this.createVideoPlayers(); // Just recreate the grid
    }

    updateVideoOverlay(streamId, status, message = '') {
        const overlay = document.getElementById(`overlay-${streamId}`);
        if (!overlay) return;

        const stream = this.streams.get(streamId);
        const streamName = stream ? stream.name : 'Stream';

        switch (status) {
            case 'playing':
                overlay.style.display = 'none';
                break;
            case 'reconnecting':
                overlay.innerHTML = `<i class="fas fa-sync-alt fa-spin"></i><h3>Reconnecting</h3><p>${streamName}</p>`;
                overlay.style.display = 'flex';
                break;
            case 'error':
                overlay.innerHTML = `<i class="fas fa-exclamation-triangle"></i><h3>Error</h3><p>${message}</p>`;
                overlay.style.display = 'flex';
                break;
            case 'stopped':
                overlay.innerHTML = `<i class="fas fa-play-circle"></i><h3>Stopped</h3><p>${streamName}</p>`;
                overlay.style.display = 'flex';
                break;
        }
    }

    // Layout Management
    setGridLayout(layout) {
        this.currentLayout = layout;
        document.getElementById('videoGrid').className = `video-grid grid-${layout}`;
        document.querySelectorAll('.layout-btn').forEach(btn => btn.classList.remove('active'));
        event.target.closest('.layout-btn').classList.add('active');
        this.createVideoPlayers();
        this.populateLayoutOptions();
        this.showNotification(`Layout set to ${this.getLayoutName(layout)}.`, 'info');
    }

    updateLayout() {
        document.getElementById('videoGrid').className = `video-grid grid-${this.currentLayout}`;
    }

    getLayoutName(layout) {
        const layouts = { 1: '1x1', 2: '2x1', 4: '2x2', 6: '3x2', 24: '4x6' };
        return layouts[layout] || 'Custom';
    }

    populateLayoutOptions() {
        const select = document.getElementById('streamLayout');
        select.innerHTML = '';
        for (let i = 1; i <= this.currentLayout; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Position ${i}`;
            select.appendChild(option);
        }
    }

    // Stream List Management
    updateStreamList() {
        const streamList = document.getElementById('streamList');
        streamList.innerHTML = '';

        if (this.streams.size === 0) {
            streamList.innerHTML = `<div class="stream-item"><div class="stream-info"><div class="stream-name">No streams</div><div class="stream-url">Click "Add Stream" to begin.</div></div></div>`;
            return;
        }

        this.streams.forEach((stream, streamId) => {
            const item = document.createElement('div');
            item.className = 'stream-item';
            item.innerHTML = `
                <div class="stream-info">
                    <div class="stream-name">${stream.name}</div>
                    <div class="stream-url">${stream.url}</div>
                </div>
                <div class="stream-controls">
                    <button class="control-btn" onclick="multiViewer.toggleStream('${streamId}')" title="${stream.active ? 'Stop' : 'Start'}"><i class="fas fa-${stream.active ? 'pause' : 'play'}"></i></button>
                    <button class="control-btn remove" onclick="multiViewer.removeStream('${streamId}')" title="Remove"><i class="fas fa-trash"></i></button>
                </div>
            `;
            streamList.appendChild(item);
        });
    }

    // Utility Functions
    isValidHLSURL(url) {
        return url.endsWith('.m3u8');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `<i class="fas fa-${this.getNotificationIcon(type)}"></i><span>${message}</span>`;
        
        Object.assign(notification.style, {
            position: 'fixed', top: '20px', right: '20px',
            background: this.getNotificationColor(type),
            color: 'white', padding: '1rem 1.5rem', borderRadius: '10px',
            boxShadow: '0 5px 25px rgba(0,0,0,0.4)', zIndex: '10001',
            display: 'flex', alignItems: 'center', gap: '1rem',
            animation: 'slideIn 0.5s ease-out'
        });
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.5s ease-in';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    getNotificationIcon(type) {
        return { success: 'check-circle', error: 'times-circle', warning: 'exclamation-triangle', info: 'info-circle' }[type] || 'info-circle';
    }

    getNotificationColor(type) {
        return {
            success: 'linear-gradient(45deg, #2ecc71, #27ae60)',
            error: 'linear-gradient(45deg, #e74c3c, #c0392b)',
            warning: 'linear-gradient(45deg, #f39c12, #e67e22)',
            info: 'linear-gradient(45deg, #3498db, #2980b9)'
        }[type];
    }

    // Storage Management
    saveStreamsToStorage() {
        localStorage.setItem('hlsMultiViewerStreams', JSON.stringify(Array.from(this.streams.values())));
    }

    loadStreamsFromStorage() {
        const stored = localStorage.getItem('hlsMultiViewerStreams');
        if (stored) {
            try {
                this.streams = new Map(JSON.parse(stored).map(s => [s.id, s]));
            } catch (e) {
                console.error('Failed to load streams:', e);
                localStorage.removeItem('hlsMultiViewerStreams');
            }
        }
    }

    // Telegram Notification System
    async sendTelegramNotification(message, streamName = 'System', errorType = 'Info') {
        if (!this.notificationEnabled || this.notificationDebounce) return;

        this.notificationDebounce = setTimeout(() => { this.notificationDebounce = null; }, 15000);

        try {
            const response = await fetch('/api/telegram-notify/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, stream_name: streamName, error_type: errorType })
            });
            if (!response.ok) throw new Error('Failed to send notification');
        } catch (error) {
            console.error('Telegram notification error:', error);
        }
    }

    // Watchdog System
    startWatchdog(stream) {
        let retryCount = this.retryAttempts.get(stream.id) || 0;
        if (retryCount >= this.maxRetries) {
            console.error(`Max retries reached for ${stream.name}.`);
            return;
        }

        if (retryCount === 0) {
            this.sendTelegramNotification(`Stream "${stream.name}" dropped. Attempting to reconnect...`, stream.name, 'Stream Dropped');
        }
        
        this.retryAttempts.set(stream.id, ++retryCount);
        
        setTimeout(() => {
            console.log(`Retrying ${stream.name}, attempt ${retryCount}`);
            this.startStream(stream);
        }, this.retryDelay);
    }

    resetWatchdog(streamId) {
        this.retryAttempts.delete(streamId);
    }

    // Notification Control Functions
    toggleNotifications() {
        this.notificationEnabled = !this.notificationEnabled;
        this.showNotification(`Telegram notifications ${this.notificationEnabled ? 'enabled' : 'disabled'}.`, this.notificationEnabled ? 'success' : 'info');
    }

    async testTelegramNotification() {
        try {
            const response = await fetch('/api/telegram-notify/test');
            if (!response.ok) throw new Error('Test failed');
            this.showNotification('Test notification sent!', 'success');
        } catch (error) {
            this.showNotification('Failed to send test notification.', 'error');
        }
    }

    // Telegram Configuration Functions
    async loadTelegramConfig() {
        try {
            const response = await fetch('/api/telegram-notify/config');
            const config = await response.json();
            document.getElementById('botToken').textContent = config.bot_token;
            document.getElementById('configStatus').textContent = config.configured ? 'Configured' : 'Not Set';
            document.getElementById('chatIdInput').value = config.chat_id || '';
        } catch (error) {
            document.getElementById('botToken').textContent = 'Error';
            document.getElementById('configStatus').textContent = 'Unavailable';
        }
    }

    async saveChatId() {
        const chatId = document.getElementById('chatIdInput').value.trim();
        if (!chatId) {
            this.showNotification('Please enter a Chat ID.', 'error');
            return;
        }

        try {
            const response = await fetch('/api/telegram-notify/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId })
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error);
            this.showNotification('Configuration saved!', 'success');
        } catch (error) {
            this.showNotification(`Save failed: ${error.message}`, 'error');
        }
    }

    async resetConfig() {
        if (!confirm('Reset Telegram configuration?')) return;

        try {
            const response = await fetch('/api/telegram-notify/reset', { method: 'POST' });
            if (!response.ok) throw new Error('Reset failed');
            this.showNotification('Configuration reset.', 'success');
            this.loadTelegramConfig();
        } catch (error) {
            this.showNotification('Failed to reset configuration.', 'error');
        }
    }
}

// Global functions for HTML onclick handlers
let multiViewer;

function showAddStreamModal() { multiViewer.showAddStreamModal(); }
function hideAddStreamModal() { multiViewer.hideAddStreamModal(); }
function addStream() { multiViewer.addStream(); }
function setGridLayout(layout) { multiViewer.setGridLayout(layout); }
function showTelegramConfigModal() { document.getElementById('telegramConfigModal').style.display = 'flex'; multiViewer.loadTelegramConfig(); }
function closeTelegramConfigModal() { document.getElementById('telegramConfigModal').style.display = 'none'; }
function testChatId() { multiViewer.testChatId(); }
function saveChatId() { multiViewer.saveChatId(); }
function resetConfig() { multiViewer.resetConfig(); }
function autoDetectChatId() { multiViewer.testTelegramNotification(); }

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    multiViewer = new HLSMultiViewer();
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn { from { transform: translateX(120%); } to { transform: translateX(0); } }
        @keyframes slideOut { from { transform: translateX(0); } to { transform: translateX(120%); } }
    `;
    document.head.appendChild(style);
});
