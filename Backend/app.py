from flask import Flask, jsonify
from flask_cors import CORS
import psutil

app = Flask(__name__)
CORS(app)


@app.route('/metrics', methods=['GET'])
def get_metrics():
    """Return system-level metrics like CPU, memory, disk, and network usage."""
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        net_io = psutil.net_io_counters()

        metrics = {
            "cpu": cpu_percent,
            "memory": {
                "total": memory.total,
                "used": memory.used,
                "free": memory.free,
                "percent": memory.percent
            },
            "disk": {
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": disk.percent
            },
            "network": {
                "bytes_sent": net_io.bytes_sent,
                "bytes_recv": net_io.bytes_recv
            }
        }
        return jsonify({"status": "ok", "metrics": metrics})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


@app.route('/processes', methods=['GET'])
def get_processes():
    """Return list of running processes with PID, name, CPU, and memory usage."""
    processes = []
    try:
        for proc in psutil.process_iter(attrs=['pid', 'name', 'cpu_percent', 'memory_percent']):
            try:
                processes.append({
                    "pid": proc.info['pid'],
                    "name": proc.info['name'],
                    "cpu_percent": proc.info['cpu_percent'],
                    "memory_percent": proc.info['memory_percent']
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        processes = sorted(processes, key=lambda x: x['cpu_percent'], reverse=True)
        return jsonify({"status": "ok", "processes": processes})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


@app.route('/top', methods=['GET'])
def get_top():
    """Return top 5 CPU-intensive processes."""
    try:
        processes = []
        for proc in psutil.process_iter(attrs=['pid', 'name', 'cpu_percent']):
            processes.append({
                "pid": proc.info['pid'],
                "name": proc.info['name'],
                "cpu_percent": proc.info['cpu_percent']
            })
        top5 = sorted(processes, key=lambda x: x['cpu_percent'], reverse=True)[:5]
        return jsonify({"status": "ok", "top": top5})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


if __name__ == '__main__':
    app.run(debug=True)
