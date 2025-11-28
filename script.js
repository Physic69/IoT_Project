const API_URL = 'https://3haka9uhp9.execute-api.us-east-1.amazonaws.com/prod/status';

// Simple front-end login (demo only, not secure for real apps)
const VALID_USERNAME = 'host';
const VALID_PASSWORD = 'login123';

function setupLogin() {
    const loginSection = document.getElementById('loginSection');
    const appSection = document.getElementById('appSection');
    const loginBtn = document.getElementById('loginBtn');
    const errorLabel = document.getElementById('loginError');
    const userInput = document.getElementById('username');
    const passInput = document.getElementById('password');

    // If you want to remember login in this browser, you can use localStorage
    const alreadyLoggedIn = sessionStorage.getItem('tankDashboardLoggedIn') === 'true';
    if (alreadyLoggedIn) {
        loginSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        fetchTankData();
        return;
    }

    loginBtn.addEventListener('click', () => {
        const u = userInput.value.trim();
        const p = passInput.value;

        if (u === VALID_USERNAME && p === VALID_PASSWORD) {
            // Hide login, show app
            loginSection.classList.add('hidden');
            appSection.classList.remove('hidden');
            errorLabel.textContent = '';
            sessionStorage.setItem('tankDashboardLoggedIn', 'true');
            fetchTankData();
        } else {
            errorLabel.textContent = 'Invalid username or password.';
        }
    });

    // Allow Enter key in password field
    passInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            loginBtn.click();
        }
    });
}

let waterLevelChart = null;

// Fetch tank data from AWS API Gateway
async function fetchTankData() {
    const refreshBtn = document.getElementById('refreshBtn');
    const connectionDot = document.getElementById('connectionDot');
    const connectionStatus = document.getElementById('connectionStatus');
    
    console.log('Starting fetch...');
    console.log('API_URL:', API_URL);
    
    // Check if API_URL is still placeholder
    if (API_URL.includes('YOUR') || API_URL.includes('PASTE')) {
        alert('ERROR: You need to update the API_URL in script.js!\n\nReplace line 2 with your actual API Gateway URL.');
        connectionStatus.textContent = 'Config Error';
        connectionDot.className = 'dot offline';
        return;
    }
    
    try {
        // Show loading state
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<span class="refresh-icon">⏳</span> Loading...';
        connectionStatus.textContent = 'Fetching...';
        connectionDot.className = 'dot';
        
        console.log('Making fetch request...');
        
        // Fetch data from API
        const response = await fetch(API_URL);
        
        console.log('Response:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Data received:', data);
        
        // Update UI with fetched data
        updateDashboard(data);
        
        // Update chart if history exists
        if (data.history && data.history.length > 0) {
            console.log('Updating chart with', data.history.length, 'entries');
            updateChart(data.history);
        } else {
            console.log('No history data available for chart');
        }
        
        // Update connection status
        connectionDot.className = 'dot online';
        connectionStatus.textContent = 'Connected';
        console.log('Update complete!');
        
    } catch (error) {
        console.error('Error details:', error);
        
        // Show error state
        connectionDot.className = 'dot offline';
        connectionStatus.textContent = 'Error';
        
        alert('Failed to fetch data.\n\nError: ' + error.message + '\n\nCheck:\n1. API_URL is correct in script.js\n2. CORS is enabled\n3. Lambda is deployed\n4. Check Console (F12) for details');
    } finally {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '<span class="refresh-icon">🔄</span> Refresh Data';
    }
}

// Update dashboard with new data
function updateDashboard(data) {
    console.log('Updating dashboard...');
    
    // Extract values
    const level = data.level || 0;
    const status = data.status || 'Unknown';
    const distance = data.distance || 0;
    const device = data.device || 'ESP32_Tank';
    const timestamp = data.timestamp || Date.now();
    
    console.log('Values:', { level, status, distance, device });
    
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
    
    console.log('Dashboard updated!');
}

// Update or create chart with history data
function updateChart(history) {
    console.log('Creating chart with', history.length, 'data points');
    
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
    
    console.log('Chart labels:', labels);
    console.log('Chart levels:', levels);
    
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
    
    console.log('Chart created successfully!');
}

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('═══════════════════════════════════════');
    console.log('Water Tank Dashboard Initialized');
    console.log('API_URL:', API_URL);
    console.log('═══════════════════════════════════════');
    
    // Fetch data on page load
    fetchTankData();
});
