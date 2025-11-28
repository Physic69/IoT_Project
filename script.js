// ⚠️ IMPORTANT: Replace this URL with your actual API Gateway endpoint
const API_URL = 'https://3haka9uhp9.execute-api.us-east-1.amazonaws.com/prod/status';
let waterLevelChart = null;

// Fetch tank data from AWS API Gateway
async function fetchTankData() {
    const refreshBtn = document.getElementById('refreshBtn');
    const connectionDot = document.getElementById('connectionDot');
    const connectionStatus = document.getElementById('connectionStatus');
    
    try {
        // Show loading state
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<span class="refresh-icon">⏳</span> Loading...';
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
        updateChart(data.history || []);
        
        // Update connection status
        connectionDot.className = 'dot online';
        connectionStatus.textContent = 'Connected';
        
    } catch (error) {
        console.error('Error fetching tank data:', error);
        
        // Show error state
        connectionDot.className = 'dot offline';
        connectionStatus.textContent = 'Error';
        
        alert('Failed to fetch data from AWS IoT.\nError: ' + error.message);
    } finally {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '<span class="refresh-icon">🔄</span> Refresh Data';
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
    
    // Update status mini
    const statusTextMini = document.getElementById('statusTextMini');
    statusTextMini.textContent = status;
    statusTextMini.className = '';
    
    // Set status color
    switch(status.toLowerCase()) {
        case 'full':
            statusTextMini.classList.add('status-full');
            break;
        case 'medium':
            statusTextMini.classList.add('status-medium');
            break;
        case 'low':
            statusTextMini.classList.add('status-low');
            break;
        case 'empty':
            statusTextMini.classList.add('status-empty');
            break;
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

// Update or create chart with history data
function updateChart(history) {
    const ctx = document.getElementById('waterLevelChart').getContext('2d');
    
    // Reverse to show oldest to newest
    const sortedHistory = [...history].reverse();
    
    // Prepare data for chart
    const labels = sortedHistory.map(item => {
        const date = new Date(item.timestamp);
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: 'short'
        });
    });
    
    const levels = sortedHistory.map(item => item.level);
    
    // Destroy existing chart if any
    if (waterLevelChart) {
        waterLevelChart.destroy();
    }
    
    // Create new chart
    waterLevelChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Water Level (%)',
                data: levels,
                borderColor: '#0ea5e9',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#0ea5e9',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Water Level (%)'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Water Tank Dashboard Initialized');
    console.log('Manual refresh only - no auto-refresh');
    
    // Fetch data on page load
    fetchTankData();
});

