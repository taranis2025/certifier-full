# app.py
from flask import Flask, request, jsonify, send_file
import hashlib
import os
import json
import tempfile
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)

# ✅ CORS configurado EXACTAMENTE para tu dominio
CORS(app, origins=["https://testrobert.work.gd"])

@app.route('/')
def home():
    return jsonify({
        "status": "ok",
        "mensaje": "Certificador Backend Activo en Render"
    })

@app.route('/api/certificar', methods=['POST'])
def certificar():
    if 'archivo' not in request.files:
        return jsonify({"error": "No se envió ningún archivo"}), 400
    
    archivo = request.files['archivo']
    propietario = request.form.get('propietario', 'Usuario').strip() or 'Usuario'
    
    if archivo.filename == '':
        return jsonify({"error": "Archivo sin nombre"}), 400

    try:
        # Leer tamaño
        archivo.seek(0, os.SEEK_END)
        tamanio = archivo.tell()
        archivo.seek(0)

        # Generar hashes
        def generar_hash(f, algo='sha256'):
            h = hashlib.new(algo)
            f.seek(0)
            for bloque in iter(lambda: f.read(4096), b""):
                h.update(bloque)
            f.seek(0)
            return h.hexdigest()

        hashes = {
            'sha256': generar_hash(archivo, 'sha256'),
            'sha1': generar_hash(archivo, 'sha1'),
            'md5': generar_hash(archivo, 'md5')
        }

        resultado = {
            "nombre_archivo": archivo.filename,
            "propietario": propietario,
            "fecha_certificacion": datetime.utcnow().isoformat() + "Z",
            "tamanio_bytes": tamanio,
            "hashes": hashes,
            "estado": "CERTIFICADO"
        }

        return jsonify({
            "success": True,
            "certificacion": resultado
        })

    except Exception as e:
        return jsonify({"error": f"Error interno: {str(e)}"}), 500

@app.route('/api/verificar', methods=['POST'])
def verificar():
    if 'archivo' not in request.files:
        return jsonify({"error": "No se envió ningún archivo"}), 400
    
    archivo = request.files['archivo']
    hash_original = request.form.get('hash_original', '').strip()

    if not hash_original:
        return jsonify({"error": "Hash original no proporcionado"}), 400

    try:
        def generar_hash(f, algo='sha256'):
            h = hashlib.new(algo)
            f.seek(0)
            for bloque in iter(lambda: f.read(4096), b""):
                h.update(bloque)
            f.seek(0)
            return h.hexdigest()

        hash_actual = generar_hash(archivo, 'sha256')
        integro = hash_actual == hash_original

        return jsonify({
            "success": True,
            "integro": integro,
            "hash_original": hash_original,
            "hash_actual": hash_actual,
            "verificacion_fecha": datetime.utcnow().isoformat() + "Z"
        })

    except Exception as e:
        return jsonify({"error": f"Error en verificación: {str(e)}"}), 500

@app.route('/api/guardar-certificado', methods=['POST'])
def guardar_certificado():
    try:
        data = request.get_json()
        cert_data = data.get('certificacion')
        
        if not cert_
            return jsonify({"error": "Datos de certificación no válidos"}), 400

        # Crear JSON descargable
        json_bytes = json.dumps(cert_data, indent=2, ensure_ascii=False).encode('utf-8')
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.json') as tmp:
            tmp.write(json_bytes)
            tmp_path = tmp.name

        return send_file(tmp_path, as_attachment=True, download_name='certificado.json')

    except Exception as e:
        return jsonify({"error": f"Error al guardar: {str(e)}"}), 500

# ⚠️ ¡ES CLAVE PARA RENDER!
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
