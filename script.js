// HLS Multi-Viewer Application
class HLSMultiViewer {
    constructor() {
        this.streams = new Map();
        this.currentLayout = 4; // Default 2x2 layout
        this.hlsInstances = new Map();
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
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS Error:', data);
                this.updateVideoOverlay(stream.id, 'error', data.details);
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
            });
        } else {
            this.updateVideoOverlay(stream.id, 'error', 'HLS not supported');
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
                    this.startStream(streamForSlot);
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
                streamsArray.forEach(stream => {
                    this.streams.set(stream.id, stream);
                });
            } catch (e) {
                console.error('Failed to load streams from storage:', e);
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
