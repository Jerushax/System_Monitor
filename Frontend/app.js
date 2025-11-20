// 🌙 Theme toggle
document.getElementById('theme-toggle').onclick = () => {
    document.body.classList.toggle('dark');
};

// API endpoints (Flask backend)
const API = {
    metrics: 'http://127.0.0.1:5000/metrics',
    processes: 'http://127.0.0.1:5000/processes',
    top: 'http://127.0.0.1:5000/top',
};

// DOM elements
const cpuCard = document.getElementById("cpu-card");
const memCard = document.getElementById("mem-card");
const diskCard = document.getElementById("disk-card");
const netCard = document.getElementById("net-card");
const processTableBody = document.querySelector("#process-table tbody");

// --- Chart.js Setup ---
let timeLabels = [];
let cpuData = [];
let memData = [];

const cpuCtx = document.getElementById("cpuChart").getContext("2d");
const memCtx = document.getElementById("memChart").getContext("2d");

const cpuChart = new Chart(cpuCtx, {
    type: "line",
    data: {
        labels: timeLabels,
        datasets: [{
            label: "CPU Usage (%)",
            borderColor: "rgb(255, 99, 132)",
            data: cpuData,
            fill: false
        }]
    },
    options: { scales: { y: { beginAtZero: true, max: 100 } } }
});

const memChart = new Chart(memCtx, {
    type: "line",
    data: {
        labels: timeLabels,
        datasets: [{
            label: "Memory Usage (%)",
            borderColor: "rgb(54, 162, 235)",
            data: memData,
            fill: false
        }]
    },
    options: { scales: { y: { beginAtZero: true, max: 100 } } }
});

// --- Fetch metrics from backend ---
async function updateMetrics() {
    try {
        const res = await fetch(API.metrics);
        const data = await res.json();

        if (data.status === "ok") {
            const m = data.metrics;
            const now = new Date().toLocaleTimeString();

            // Update cards
            cpuCard.innerHTML = `CPU: ${m.cpu.toFixed(1)}%`;
            memCard.innerHTML = `Memory: ${m.memory.percent.toFixed(1)}%`;
            diskCard.innerHTML = `Disk: ${m.disk.percent.toFixed(1)}%`;
            netCard.innerHTML = `Network: ↑ ${(m.network.bytes_sent / 1e6).toFixed(2)} MB  ↓ ${(m.network.bytes_recv / 1e6).toFixed(2)} MB`;

            // Update charts (limit to last 20 points)
            if (timeLabels.length > 20) {
                timeLabels.shift();
                cpuData.shift();
                memData.shift();
            }

            timeLabels.push(now);
            cpuData.push(m.cpu);
            memData.push(m.memory.percent);

            cpuChart.update();
            memChart.update();
        }
    } catch (err) {
        console.error("Error fetching metrics:", err);
    }
}

// --- Fetch process list ---
async function updateProcesses() {
    try {
        const res = await fetch(API.processes);
        const data = await res.json();

        if (data.status === "ok") {
            processTableBody.innerHTML = "";
            data.processes.slice(0, 10).forEach(p => {
                const row = `
                    <tr>
                        <td>${p.name}</td>
                        <td>${p.pid}</td>
                        <td>${p.cpu_percent.toFixed(1)}</td>
                        <td>${p.memory_percent.toFixed(1)}</td>
                    </tr>
                `;
                processTableBody.innerHTML += row;
            });
        }
    } catch (err) {
        console.error("Error fetching processes:", err);
    }
}

// --- Main update loop ---
function updateAll() {
    updateMetrics();
    updateProcesses();
}

// Run updates every 2 seconds
document.addEventListener("DOMContentLoaded", () => {
    updateAll();
    setInterval(updateAll, 2000);
});
