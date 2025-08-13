// HLS Multi-Viewer Application
class HLSMultiViewer {
    constructor() {
        this.streams = new Map();
        this.currentLayout = 4; // Default 2x2 layout
        this.hlsInstances = new Map();
        this.notificationEnabled = true; // Enable/disable notifications
        this.retryAttempts = new Map(); // Track retry attempts per stream
        this.maxRetries = 3; // Maximum retry attempts
        this.retryDelay = 5000; // 5 seconds delay between retries
        this.errorNotificationCooldown = new Map(); // Track notification cooldowns to prevent spam
        this.notificationDebounce = null; // Global notification debounce timer
        this.init();
    }



    init() {
        this.setupEventListeners();
        this.loadStreamsFromStorage();
        this.updateLayout();
        this.updateStreamList();
        this.createVideoPlayers();
    }

    setupEventListeners() {
        // Add keyboard shortcuts
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
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        if (!this.isValidHLSURL(url)) {
            this.showNotification('Please enter a valid HLS URL (.m3u8)', 'error');
            return;
        }

        const streamId = this.generateStreamId();
        const stream = {
            id: streamId,
            name: name,
            url: url,
            position: position,
            active: true,
            createdAt: new Date().toISOString()
        };

        this.streams.set(streamId, stream);
        this.saveStreamsToStorage();
        this.updateStreamList();
        this.createVideoPlayer(stream);
        this.hideAddStreamModal();
        this.showNotification(`Stream "${name}" added successfully`, 'success');
    }

    removeStream(streamId) {
        const stream = this.streams.get(streamId);
        if (stream) {
            this.stopStream(streamId);
            this.streams.delete(streamId);
            this.saveStreamsToStorage();
            this.updateStreamList();
            this.removeVideoPlayer(streamId);
            this.showNotification(`Stream "${stream.name}" removed`, 'info');
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

        // Stop existing HLS instance if any
        this.stopStream(stream.id);

        if (Hls.isSupported()) {
            const hls = new Hls({
                debug: false,
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90
            });

            hls.loadSource(stream.url);
            hls.attachMedia(videoElement);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoElement.play().catch(e => {
                    console.log('Auto-play prevented:', e);
                });
                this.updateVideoOverlay(stream.id, 'playing');
                this.resetWatchdog(stream.id);

                // Clear any existing error notification cooldown for this stream
                if (this.errorNotificationCooldown.has(stream.id)) {
                    clearTimeout(this.errorNotificationCooldown.get(stream.id));
                    this.errorNotificationCooldown.delete(stream.id);
                }

                this.sendTelegramNotification(
                    `Stream started successfully`,
                    stream.name,
                    'Stream Started'
                );
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS Error:', data);

                if (data.fatal) {
                    switch (data.details) {
                        case Hls.ErrorDetails.BUFFER_STALLED_ERROR:
                        case Hls.ErrorDetails.MEDIA_MSE_ERROR:
                            console.warn(`Recoverable HLS media error: ${data.details}. Attempting to recover...`);
                            this.updateVideoOverlay(stream.id, 'reconnecting');
                            hls.recoverMediaError();
                            break;
                        default:
                            // For other fatal errors, show error and use the watchdog to restart
                            this.updateVideoOverlay(stream.id, 'error', 'Stream failed. Retrying...');
                            this.startWatchdog(stream); // Watchdog will handle the notification
                            break;
                    }
                }
            });




            this.hlsInstances.set(stream.id, hls);
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            videoElement.src = stream.url;
            videoElement.addEventListener('loadedmetadata', () => {
                videoElement.play().catch(e => {
                    console.log('Auto-play prevented:', e);
                });
                this.updateVideoOverlay(stream.id, 'playing');
                this.resetWatchdog(stream.id);
                
                // Clear any existing error notification cooldown
                if (this.errorNotificationCooldown.has(stream.id)) {
                    clearTimeout(this.errorNotificationCooldown.get(stream.id));
                    this.errorNotificationCooldown.delete(stream.id);
                }

                this.sendTelegramNotification(
                    `Stream started successfully (native HLS)`,
                    stream.name,
                    'Stream Started'
                );
            });
            
            videoElement.addEventListener('error', (e) => {
                console.error('Video Error:', e);
                
                // Check cooldown to prevent spam
                if (!this.errorNotificationCooldown.has(stream.id)) {
                    this.sendTelegramNotification(
                        `Native HLS Error: ${e.message || 'Unknown error'}`,
                        stream.name,
                        'Native HLS Error'
                    );

                    // Set a 60-second cooldown to prevent spam
                    this.errorNotificationCooldown.set(stream.id, setTimeout(() => {
                        this.errorNotificationCooldown.delete(stream.id);
                    }, 60000));

                    this.startWatchdog(stream);
                }
            });

        } else {
            this.updateVideoOverlay(stream.id, 'error', 'HLS not supported');
            this.sendTelegramNotification(
                'HLS is not supported in this browser',
                stream.name,
                'Browser Compatibility Error'
            );
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
        // Store current playing streams and their video elements
        const currentVideos = {};
        this.streams.forEach(stream => {
            const videoEl = document.getElementById(`video-${stream.id}`);
            if (videoEl) {
                currentVideos[stream.id] = videoEl;
            }
        });
        videoGrid.innerHTML = '';
        const streamsToStart = []; // Collect streams to start

        // Determine slot count for current layout
        const slotCount = this.currentLayout === 24 ? 24 : (this.currentLayout === 6 ? 6 : (this.currentLayout === 4 ? 4 : (this.currentLayout === 2 ? 2 : 1)));
        for (let i = 1; i <= slotCount; i++) {
            const videoPlayer = document.createElement('div');
            videoPlayer.className = 'video-player';
            videoPlayer.id = `player-slot-${i}`;

            // Find stream assigned to this position
            let streamForSlot = null;
            this.streams.forEach(stream => {
                if (stream.position === i) streamForSlot = stream;
            });

            if (streamForSlot) {
                let video = currentVideos[streamForSlot.id];
                let overlay = document.createElement('div');
                overlay.className = 'video-overlay';
                overlay.id = `overlay-${streamForSlot.id}`;

                if (video) {
                    // Reuse existing video element
                    video.controls = true;
                    video.muted = true;
                    video.playsInline = true;
                    overlay.style.display = 'none';
                } else {
                    // Create new video element and show loading overlay
                    video = document.createElement('video');
                    video.id = `video-${streamForSlot.id}`;
                    video.muted = true;
                    video.controls = true;
                    video.playsInline = true;
                    overlay.innerHTML = `
                        <i class="fas fa-spinner fa-spin"></i>
                        <h3>${streamForSlot.name}</h3>
                        <p>Loading stream...</p>
                    `;
                }

                videoPlayer.appendChild(video);
                videoPlayer.appendChild(overlay);

                if (!currentVideos[streamForSlot.id] && streamForSlot.active) {
                    streamsToStart.push(streamForSlot);
                }
            } else {
                // Empty slot
                const video = document.createElement('video');
                video.id = `video-slot-${i}`;
                video.muted = true;
                video.controls = true;
                video.playsInline = true;

                const overlay = document.createElement('div');
                overlay.className = 'video-overlay';
                overlay.id = `overlay-slot-${i}`;
                overlay.innerHTML = `
                    <i class="fas fa-play-circle"></i>
                    <h3>Empty Slot ${i}</h3>
                    <p>Add a stream to this position</p>
                `;

                videoPlayer.appendChild(video);
                videoPlayer.appendChild(overlay);
            }
            videoGrid.appendChild(videoPlayer);
        }
        
        // Stagger the start of each stream to prevent overwhelming the browser
        streamsToStart.forEach((stream, index) => {
            setTimeout(() => {
                this.startStream(stream);
            }, index * 200); // 200ms delay between each stream start
        });
    }


    createVideoPlayer(stream) {
        const videoGrid = document.getElementById('videoGrid');
        const existingPlayer = document.getElementById(`player-slot-${stream.position}`);
        
        if (existingPlayer) {
            const video = document.createElement('video');
            video.id = `video-${stream.id}`;
            video.muted = true;
            video.controls = true;
            video.playsInline = true;
            
            const overlay = document.createElement('div');
            overlay.className = 'video-overlay';
            overlay.id = `overlay-${stream.id}`;
            overlay.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                <h3>${stream.name}</h3>
                <p>Loading stream...</p>
            `;
            
            existingPlayer.innerHTML = '';
            existingPlayer.appendChild(video);
            existingPlayer.appendChild(overlay);
            
            if (stream.active) {
                this.startStream(stream);
            }
        }
    }

    removeVideoPlayer(streamId) {
        const stream = this.streams.get(streamId);
        if (stream) {
            const playerSlot = document.getElementById(`player-slot-${stream.position}`);
            if (playerSlot) {
                playerSlot.innerHTML = `
                    <div class="video-overlay">
                        <i class="fas fa-play-circle"></i>
                        <h3>Empty Slot ${stream.position}</h3>
                        <p>Add a stream to this position</p>
                    </div>
                `;
            }
        }
    }

    updateVideoOverlay(streamId, status, message = '') {
        const overlay = document.getElementById(`overlay-${streamId}`);
        if (!overlay) return;

        switch (status) {
            case 'playing':
                overlay.style.display = 'none';
                break;
            case 'reconnecting':
                overlay.innerHTML = `
                    <i class="fas fa-spinner fa-spin"></i>
                    <h3>Reconnecting...</h3>
                    <p>Attempting to recover stream</p>
                `;
                overlay.style.display = 'flex';
                break;
            case 'error':
                overlay.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Stream Error</h3>
                    <p>${message || 'Failed to load stream'}</p>
                `;
                overlay.style.display = 'flex';
                break;
            case 'stopped':
                overlay.innerHTML = `
                    <i class="fas fa-pause-circle"></i>
                    <h3>Stream Stopped</h3>
                    <p>Click play to resume</p>
                `;
                overlay.style.display = 'flex';
                break;
        }
    }


    // Layout Management
    setGridLayout(layout) {
        this.currentLayout = layout;
        const videoGrid = document.getElementById('videoGrid');
        
        // Remove all grid classes
        videoGrid.className = 'video-grid';
        
        // Add new grid class
        videoGrid.classList.add(`grid-${layout}`);
        
        // Update layout buttons
        document.querySelectorAll('.layout-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        this.createVideoPlayers();
        this.showNotification(`Layout changed to ${this.getLayoutName(layout)}`, 'info');
    }

    updateLayout() {
        const videoGrid = document.getElementById('videoGrid');
        videoGrid.className = `video-grid grid-${this.currentLayout}`;
    }

    getLayoutName(layout) {
        const layouts = {
            1: '1x1',
            2: '2x1',
            4: '2x2',
            6: '3x2',
            24: '4x6'
        };
        return layouts[layout] || 'Custom';
    }

    // Stream List Management
    updateStreamList() {
        const streamList = document.getElementById('streamList');
        streamList.innerHTML = '';

        if (this.streams.size === 0) {
            streamList.innerHTML = `
                <div class="stream-item">
                    <div class="stream-info">
                        <div class="stream-name">No streams added</div>
                        <div class="stream-url">Click "Add Stream" to get started</div>
                    </div>
                </div>
            `;
            return;
        }

        this.streams.forEach((stream, streamId) => {
            const streamItem = document.createElement('div');
            streamItem.className = 'stream-item';
            streamItem.innerHTML = `
                <div class="stream-info">
                    <div class="stream-name">${stream.name}</div>
                    <div class="stream-url">${stream.url}</div>
                </div>
                <div class="stream-controls">
                    <button class="control-btn ${stream.active ? 'active' : ''}" 
                            onclick="multiViewer.toggleStream('${streamId}')" 
                            title="${stream.active ? 'Stop Stream' : 'Start Stream'}">
                        <i class="fas fa-${stream.active ? 'pause' : 'play'}"></i>
                    </button>
                    <button class="control-btn remove" 
                            onclick="multiViewer.removeStream('${streamId}')" 
                            title="Remove Stream">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            streamList.appendChild(streamItem);
        });
    }

    // Utility Functions
    generateStreamId() {
        return 'stream_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    isValidHLSURL(url) {
        return url.includes('.m3u8') || url.includes('application/x-mpegURL');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getNotificationColor(type) {
        const colors = {
            success: 'linear-gradient(45deg, #00b894, #00cec9)',
            error: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
            warning: 'linear-gradient(45deg, #fdcb6e, #e17055)',
            info: 'linear-gradient(45deg, #74b9ff, #0984e3)'
        };
        return colors[type] || colors.info;
    }

    // Storage Management
    saveStreamsToStorage() {
        const streamsArray = Array.from(this.streams.values());
        localStorage.setItem('hlsMultiViewerStreams', JSON.stringify(streamsArray));
    }

    loadStreamsFromStorage() {
        const stored = localStorage.getItem('hlsMultiViewerStreams');
        if (stored) {
            try {
                const streamsArray = JSON.parse(stored);
                if (Array.isArray(streamsArray)) {
                    // Re-create the map from the stored array of stream objects
                    this.streams = new Map(streamsArray.map(stream => [stream.id, stream]));
                }
            } catch (e) {
                console.error('Failed to load streams from storage:', e);
                // If parsing fails, clear the corrupted data to prevent future errors
                localStorage.removeItem('hlsMultiViewerStreams');
            }
        }
    }


    // Export/Import Functions
    exportStreams() {
        const streamsArray = Array.from(this.streams.values());
        const dataStr = JSON.stringify(streamsArray, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'hls-streams.json';
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Streams exported successfully', 'success');
    }

    importStreams(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const streamsArray = JSON.parse(e.target.result);
                streamsArray.forEach(stream => {
                    stream.id = this.generateStreamId(); // Generate new IDs
                    this.streams.set(stream.id, stream);
                });
                this.saveStreamsToStorage();
                this.updateStreamList();
                this.createVideoPlayers();
                this.showNotification(`${streamsArray.length} streams imported successfully`, 'success');
            } catch (e) {
                this.showNotification('Failed to import streams: Invalid file format', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Telegram Notification System
    async sendTelegramNotification(message, streamName = 'Unknown', errorType = 'Error') {
        if (!this.notificationEnabled) return;

        // Check for an active debounce timer to prevent notification storms
        if (this.notificationDebounce) {
            return; // Exit if we are in a cooldown period
        }
        
        const apiBase = '/api/telegram-notify';
        
        // Set a 5-second global debounce to prevent future calls
        this.notificationDebounce = setTimeout(() => {
            this.notificationDebounce = null;
        }, 15000);

        try {
            const response = await fetch(`${apiBase}/notify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    stream_name: streamName,
                    error_type: errorType
                })
            });
            
            const result = await response.json();
            if (result.success) {
                console.log('Telegram notification sent successfully');
            } else {
                console.error('Failed to send Telegram notification:', result.message);
            }
        } catch (error) {
            console.error('Error sending Telegram notification:', error);
        }
    }


    // Watchdog System
    startWatchdog(stream) {
        const streamId = stream.id;
        let retryCount = this.retryAttempts.get(streamId) || 0;

        if (retryCount >= this.maxRetries) {
            // No more retries, so we don't send another notification here. The first one was enough.
            console.error(`Stream ${stream.name} failed max retries.`);
            return;
        }

        // Only send notification on the FIRST failure detection
        if (retryCount === 0) {
            this.sendTelegramNotification(
                `Stream dropped. Attempting to reconnect...`,
                stream.name,
                'Stream Dropped'
            );
        }
        
        retryCount++;
        this.retryAttempts.set(streamId, retryCount);
        
        setTimeout(() => {
            console.log(`Retrying stream ${stream.name}, attempt ${retryCount}`);
            this.startStream(stream);
        }, this.retryDelay);
    }


    resetWatchdog(streamId) {
        this.retryAttempts.delete(streamId);
    }

    // Notification Control Functions
    toggleNotifications() {
        this.notificationEnabled = !this.notificationEnabled;
        this.showNotification(
            `Telegram notifications ${this.notificationEnabled ? 'enabled' : 'disabled'}`,
            this.notificationEnabled ? 'success' : 'info'
        );
    }

    async testTelegramNotification() {
        const apiBase = '/api/telegram-notify';
        
        try {
            const response = await fetch(`${apiBase}/test`);
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Test notification sent to Telegram!', 'success');
            } else {
                this.showNotification('Failed to send test notification', 'error');
            }
        } catch (error) {
            this.showNotification('Telegram notification service not available', 'error');
        }
    }

    // Telegram Configuration Functions
    async loadTelegramConfig() {
        const apiBase = '/api/telegram-notify';
        
        try {
            const response = await fetch(`${apiBase}/config`);
            const config = await response.json();
            
            document.getElementById('botToken').textContent = config.bot_token;
            document.getElementById('configStatus').textContent = config.configured ? 'Configured' : 'Not Configured';
            document.getElementById('configStatus').style.color = config.configured ? '#00b894' : '#e17055';
            
            if (config.chat_id) {
                document.getElementById('chatIdInput').value = config.chat_id;
            }
        } catch (error) {
            document.getElementById('botToken').textContent = 'Error loading';
            document.getElementById('configStatus').textContent = 'Service unavailable';
            document.getElementById('configStatus').style.color = '#e17055';
        }
    }

    async testChatId() {
        const chatId = document.getElementById('chatIdInput').value.trim();
        if (!chatId) {
            this.showNotification('Please enter a Chat ID', 'error');
            return;
        }

        const apiBase = '/api/telegram-notify';

        try {
            const response = await fetch(`${apiBase}/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ chat_id: chatId })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Chat ID configured successfully! Test message sent.', 'success');
                this.loadTelegramConfig(); // Refresh the config display
            } else {
                this.showNotification(`Configuration failed: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showNotification('Failed to test Chat ID. Check if relay server is running.', 'error');
        }
    }

    async saveChatId() {
        const chatId = document.getElementById('chatIdInput').value.trim();
        if (!chatId) {
            this.showNotification('Please enter a Chat ID', 'error');
            return;
        }

        const apiBase = '/api/telegram-notify';

        try {
            const response = await fetch(`${apiBase}/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ chat_id: chatId })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Configuration saved successfully!', 'success');
                this.loadTelegramConfig();
            } else {
                this.showNotification(`Save failed: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showNotification('Failed to save configuration', 'error');
        }
    }

    async resetConfig() {
        if (!confirm('Are you sure you want to reset the Telegram configuration?')) {
            return;
        }

        const apiBase = '/api/telegram-notify';

        try {
            const response = await fetch(`${apiBase}/reset`, {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Configuration reset successfully', 'success');
                document.getElementById('chatIdInput').value = '';
                this.loadTelegramConfig();
            } else {
                this.showNotification(`Reset failed: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showNotification('Failed to reset configuration', 'error');
        }
    }

    async autoDetectChatId() {
        const apiBase = '/api/telegram-notify';
        
        try {
            const response = await fetch(`${apiBase}/test`);
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Auto-detection successful! Check Telegram for test message.', 'success');
                this.loadTelegramConfig();
            } else {
                this.showNotification('Auto-detection failed. Please send a message to your bot first.', 'error');
            }
        } catch (error) {
            this.showNotification('Auto-detection failed. Check if relay server is running.', 'error');
        }
    }
}

// Global functions for HTML onclick handlers
let multiViewer;

function showAddStreamModal() {
    multiViewer.showAddStreamModal();
}

function hideAddStreamModal() {
    multiViewer.hideAddStreamModal();
}

function addStream() {
    multiViewer.addStream();
}

function setGridLayout(layout) {
    multiViewer.setGridLayout(layout);
}

// Global functions for modals
function showAddStreamModal() {
    document.getElementById('addStreamModal').style.display = 'block';
}

function closeAddStreamModal() {
    document.getElementById('addStreamModal').style.display = 'none';
    // Reset form
    document.getElementById('streamName').value = '';
    document.getElementById('streamUrl').value = '';
    document.getElementById('streamLayout').value = '1';
}

function showTelegramConfigModal() {
    document.getElementById('telegramConfigModal').style.display = 'block';
    // Load current configuration
    multiViewer.loadTelegramConfig();
}

function closeTelegramConfigModal() {
    document.getElementById('telegramConfigModal').style.display = 'none';
}

// Global functions for Telegram configuration
function testChatId() {
    multiViewer.testChatId();
}

function saveChatId() {
    multiViewer.saveChatId();
}

function resetConfig() {
    multiViewer.resetConfig();
}

function autoDetectChatId() {
    multiViewer.autoDetectChatId();
}

// Close modals when clicking outside
window.onclick = function(event) {
    const addStreamModal = document.getElementById('addStreamModal');
    const telegramConfigModal = document.getElementById('telegramConfigModal');
    
    if (event.target === addStreamModal) {
        closeAddStreamModal();
    }
    if (event.target === telegramConfigModal) {
        closeTelegramConfigModal();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    multiViewer = new HLSMultiViewer();
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
});

// Handle file import
function handleFileImport(event) {
    const file = event.target.files[0];
    if (file) {
        multiViewer.importStreams(file);
    }
    event.target.value = ''; // Reset input
}
