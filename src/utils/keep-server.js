// ping server every 14 minutes
function keepServerAlive(url, intervalMinutes) {
  console.log(`[Keep-Alive] Monitoring started for: ${url}`);
  setInterval(async () => {
    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            console.log(`[Keep-Alive] Ping successful at ${data.timestamp || new Date().toISOString()}`);
        }
    }
    catch (error) {
        console.error('[Keep-Alive] Ping failed:', error.message);
    }
  }, intervalMinutes * 60 * 1000);
};

module.exports = { keepServerAlive };