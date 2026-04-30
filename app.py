from flask import Flask, jsonify, Response, request
from flask_cors import CORS
from gpiozero import Servo
import cv2
import json
import os
import time
import uuid
import threading
from datetime import datetime

app = Flask(__name__)
CORS(app)

# --- CONFIGURACIÓN DE HARDWARE ---
# Microservo SG90 rotación continua (360°)
# Alimentación: 5V del driver L298N | Señal: GPIO 18
servo = Servo(18, min_pulse_width=0.5/1000, max_pulse_width=2.4/1000)
# LED azul de humidificación: GPIO 22
from gpiozero import OutputDevice
humidifier_led = OutputDevice(22)

# --- CONFIGURACIÓN DE CÁMARA ---
camera = cv2.VideoCapture(0, cv2.CAP_V4L2)
camera.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'MJPG'))
camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

SCHEDULES_FILE = 'schedules.json'

# --- FUNCIONES DEL SERVO ---

def get_duration(portions):
    """Calcula segundos de giro según gramos de comida.
    12g -> 0.083s, 24g -> 0.166s, 36g -> 0.249s, 48g -> 0.332s, 60g -> 0.415s"""
    return round(portions * 0.083 / 12, 3)

def run_servo(portions, with_humidify=False):
    """Gira el servo a máxima velocidad el tiempo calculado según gramos.
    12g -> 0.083s, 24g -> 0.166s, ..., 60g -> 0.415s."""
    duration = round(portions * 0.083 / 12, 3)
    print(f"Servo ON durante {duration}s (portions={portions}g, humidify={with_humidify})...")
    if with_humidify:
        humidifier_led.on()
    servo.value = 1.0
    time.sleep(duration)
    servo.value = 0
    servo.detach()
    humidifier_led.off()
    print("Servo OFF.")

def feed_action(portions=24, humidify=False):
    """Ejecuta la alimentación: servo según porción + LED si humidify."""
    print(f"Alimentación ({portions}g, humidify={humidify})...")
    run_servo(portions, with_humidify=humidify)
    print("Alimentación terminada.")

# --- PERSISTENCIA DE HORARIOS ---

def save_schedules(schedules):
    with open(SCHEDULES_FILE, 'w') as f:
        json.dump(schedules, f)

def load_schedules():
    if os.path.exists(SCHEDULES_FILE):
        with open(SCHEDULES_FILE, 'r') as f:
            return json.load(f)
    return []

# --- HILO VERIFICADOR DE HORARIOS ---

_ultimos_disparados = {}  # guarda "HH:MM" -> True para no repetir

def verificar_horarios():
    """Hilo que cada 30s revisa si hay un horario que deba ejecutarse."""
    global _ultimos_disparados
    while True:
        try:
            ahora = datetime.now()
            min_actual = ahora.hour * 60 + ahora.minute
            schedules = load_schedules()

            for s in schedules:
                h = int(s['hour'])
                m = int(s['minute'])
                min_schedule = h * 60 + m
                key = f"{h:02d}:{m:02d}"

                # Si la hora del schedule es <= hora actual y no se ha disparado
                if min_schedule <= min_actual and not _ultimos_disparados.get(key):
                    portions = s.get('portions', 24)
                    humidify = s.get('humidify', False)
                    print(f"¡Horario {key} ejecutándose! ({portions}g, humidify={humidify})")
                    feed_action(portions=portions, humidify=humidify)
                    _ultimos_disparados[key] = True

                # Resetear los que ya pasaron (para el siguiente día)
                if min_schedule > min_actual:
                    _ultimos_disparados[key] = False
        except Exception as e:
            print(f"Error en verificar_horarios: {e}")

        time.sleep(30)

# Iniciar hilo verificador
threading.Thread(target=verificar_horarios, daemon=True).start()

# --- RUTAS DE VIDEO ---

def generate_frames():
    while True:
        success, frame = camera.read()
        if not success: break
        ret, buffer = cv2.imencode('.jpg', frame)
        yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

# --- CONTROL DEL SERVO (ALIMENTACIÓN) ---

@app.route('/feed', methods=['POST'])
def feed_endpoint():
    """Gira el servo según la porción indicada.
    Si humidify=True, enciende el LED azul junto al servo."""
    data = request.json or {}
    portions = data.get('portions', 24)
    humidify = data.get('humidify', False)
    duration = round(portions * 0.083 / 12, 3)
    print(f"Alimentación manual ({portions}g = {duration}s, humidify={humidify})...")
    run_servo(portions, with_humidify=humidify)
    print("Alimentación manual completada.")
    return jsonify({"status": "ok", "portions": portions, "duration": duration, "humidify": humidify})

@app.route('/led/on')
def led_on():
    """Enciende el servo (legacy)."""
    servo.value = 1.0
    return jsonify({"status": "ok"})

@app.route('/led/off')
def led_off():
    """Apaga el servo (legacy)."""
    servo.value = 0
    servo.detach()
    return jsonify({"status": "ok"})

# --- RUTAS DE PROGRAMACIÓN (SCHEDULES) ---

@app.route('/schedules', methods=['GET'])
def get_schedules():
    return jsonify(load_schedules())

@app.route('/schedules', methods=['POST'])
def add_schedule():
    data = request.json
    time_str = data.get('time')  # Formato "HH:MM"
    portions = data.get('portions', 24)
    humidify = data.get('humidify', False)
    h, m = time_str.split(':')

    job_id = str(uuid.uuid4())[:8]
    new_schedule = {"id": job_id, "time": time_str, "hour": h, "minute": m, "portions": portions, "humidify": humidify}

    # Guardar en JSON
    current_schedules = load_schedules()
    current_schedules.append(new_schedule)
    save_schedules(current_schedules)

    return jsonify(new_schedule)

@app.route('/schedules/<id>', methods=['DELETE'])
def delete_schedule(id):
    current_schedules = load_schedules()
    updated_schedules = [s for s in current_schedules if s['id'] != id]
    save_schedules(updated_schedules)
    return jsonify({"status": "deleted"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)
