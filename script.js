// ⚠️ IMPORTANT: Replace this URL with your actual API Gateway endpoint
const API_URL = 'https://3haka9uhp9.execute-api.us-east-1.amazonaws.com/prod/status';

// Auto-refresh interval (30 seconds)
const REFRESH_INTERVAL = 30000;

// Fetch tank data from AWS API Gateway
async function fetchTankData() {
    const refreshBtn = document.getElementById('refreshBtn');
    const connectionDot = document.getElementById('connectionDot');
    const connectionStatus = document.getElementById('connectionStatus');
    
    try {
        // Show loading state
        refreshBtn.disabled = true;
        connectionStatus.textContent = 'Fetching...';
        connectionDot.className = 'dot';
        
        // Fetch data from API
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update UI with fetched data
        updateDashboard(data);
        
        // Update connection status
        connectionDot.className = 'dot online';
        connectionStatus.textContent = 'Connected';
        
    } catch (error) {
        console.error('Error fetching tank data:', error);
        
        // Show error state
        connectionDot.className = 'dot offline';
        connectionStatus.textContent = 'Offline';
        
        // Display error message
        document.getElementById('statusText').textContent = 'Error';
        document.getElementById('statusIcon').textContent = '❌';
        
        alert('Failed to fetch data from AWS IoT. Please check:\n' +
              '1. Your API Gateway URL is correct\n' +
              '2. CORS is enabled on API Gateway\n' +
              '3. ESP32 is sending data\n\n' +
              'Error: ' + error.message);
    } finally {
        refreshBtn.disabled = false;
    }
}

// Update dashboard with new data
function updateDashboard(data) {
    // Extract values
    const level = data.level || 0;
    const status = data.status || 'Unknown';
    const distance = data.distance || 0;
    const device = data.device || 'ESP32_Tank';
    const timestamp = data.timestamp || Date.now();
    
    // Update water level visual
    const waterLevel = document.getElementById('waterLevel');
    waterLevel.style.height = level + '%';
    
    // Update percentage display
    document.getElementById('percentage').textContent = level + '%';
    
    // Update status with icon and color
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');
    
    // Remove previous status classes
    statusText.className = 'status-text';
    
    // Set status icon and color
    switch(status.toLowerCase()) {
        case 'full':
            statusIcon.textContent = '💧';
            statusText.textContent = 'Full';
            statusText.classList.add('status-full');
            break;
        case 'medium':
            statusIcon.textContent = '💦';
            statusText.textContent = 'Medium';
            statusText.classList.add('status-medium');
            break;
        case 'low':
            statusIcon.textContent = '⚠️';
            statusText.textContent = 'Low';
            statusText.classList.add('status-low');
            break;
        case 'empty':
            statusIcon.textContent = '🚨';
            statusText.textContent = 'Empty';
            statusText.classList.add('status-empty');
            break;
        default:
            statusIcon.textContent = '❓';
            statusText.textContent = status;
    }
    
    // Update sensor data
    document.getElementById('distance').textContent = distance + ' cm';
    document.getElementById('device').textContent = device;
    
    // Format timestamp
    const date = new Date(timestamp);
    const timeString = date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    document.getElementById('timestamp').textContent = timeString;
}

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Water Tank Dashboard Initialized');
    
    // Fetch data immediately
    fetchTankData();
    
    // Set up auto-refresh
    setInterval(fetchTankData, REFRESH_INTERVAL);
    
    console.log(`Auto-refresh enabled: every ${REFRESH_INTERVAL/1000} seconds`);
});
