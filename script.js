// ⚠️ IMPORTANT: Replace this URL with your actual API Gateway endpoint
const API_URL = 'https://3haka9uhp9.execute-api.us-east-1.amazonaws.com/prod/status';
// Auto-refresh interval (30 seconds)
const REFRESH_INTERVAL = 30000;

// Fetch tank data from AWS API Gateway
async function fetchTankData() {
    const refreshBtn = document.getElementById('refreshBtn');
    const connectionDot = document.getElementById('connectionDot');
    const connectionStatus = document.getElementById('connectionStatus');
    
    // 🔍 DEBUG: Log the URL being called
    console.log('=== FETCH STARTED ===');
    console.log('API URL:', API_URL);
    console.log('Time:', new Date().toLocaleTimeString());
    
    try {
        // Show loading state
        refreshBtn.disabled = true;
        connectionStatus.textContent = 'Fetching...';
        connectionDot.className = 'dot';
        
        // 🔍 DEBUG: Log before fetch
        console.log('Making fetch request...');
        
        // Fetch data from API
        const response = await fetch(API_URL);
        
        // 🔍 DEBUG: Log response details
        console.log('Response received!');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Headers:', response.headers);
        console.log('OK?', response.ok);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 🔍 DEBUG: Log the data received
        console.log('Data received:', data);
        console.log('=== FETCH SUCCESS ===\n');
        
        // Update UI with fetched data
        updateDashboard(data);
        
        // Update connection status
        connectionDot.className = 'dot online';
        connectionStatus.textContent = 'Connected';
        
    } catch (error) {
        // 🔍 DEBUG: Log detailed error information
        console.error('=== FETCH FAILED ===');
        console.error('Error Type:', error.name);
        console.error('Error Message:', error.message);
        console.error('Full Error:', error);
        console.error('Stack:', error.stack);
        console.error('===================\n');
        
        // Show error state
        connectionDot.className = 'dot offline';
        connectionStatus.textContent = 'Offline';
        
        // Display error message
        document.getElementById('statusText').textContent = 'Error';
        document.getElementById('statusIcon').textContent = '❌';
        
        // Show detailed error in alert
        let errorDetails = `Error: ${error.message}\n\n`;
        errorDetails += `API URL: ${API_URL}\n\n`;
        errorDetails += `Check Console (F12) for more details.\n\n`;
        errorDetails += `Common issues:\n`;
        errorDetails += `1. Wrong API URL in script.js\n`;
        errorDetails += `2. CORS not enabled in API Gateway\n`;
        errorDetails += `3. API not deployed\n`;
        errorDetails += `4. No data in DynamoDB`;
        
        alert(errorDetails);
    } finally {
        refreshBtn.disabled = false;
    }
}

// Update dashboard with new data
function updateDashboard(data) {
    console.log('Updating dashboard with data:', data);
    
    // Extract values
    const level = data.level || 0;
    const status = data.status || 'Unknown';
    const distance = data.distance || 0;
    const device = data.device || 'ESP32_Tank';
    const timestamp = data.timestamp || Date.now();
    
    console.log('Parsed values:', { level, status, distance, device, timestamp });
    
    // Update water level visual
    const waterLevel = document.getElementById('waterLevel');
    waterLevel.style.height = level + '%';
    
    // Update percentage display
    document.getElementById('percentage').textContent = level + '%';
    
    // Update status with icon and color
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');
    
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
    
    console.log('Dashboard updated successfully!');
}

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║  Water Tank Dashboard Initialized     ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('API URL:', API_URL);
    console.log('Refresh interval:', REFRESH_INTERVAL/1000, 'seconds\n');
    
    // Fetch data immediately
    fetchTankData();
    
    // Set up auto-refresh
    setInterval(fetchTankData, REFRESH_INTERVAL);
});
