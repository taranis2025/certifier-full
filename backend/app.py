# app.py
from flask import Flask, request, jsonify
import hashlib
import os
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)

# ✅ Configuración de CORS para permitir solicitudes desde tu dominio
CORS(app, origins=["https://testrobert.work.gd"])

@app.route('/')
def home():
    return jsonify({
        "mensaje": "Certificador de Archivos - Backend Activo",
        "status": "ok"
    })

@app.route('/api/certificar', methods=['POST'])
def certificar():
    if 'archivo' not in request.files:
        return jsonify({'error': 'No se envió ningún archivo'}), 400
    
    archivo = request.files['archivo']
    propietario = request.form.get('propietario', 'Usuario').strip() or 'Usuario'
    
    if archivo.filename == '':
        return jsonify({'error': 'Archivo sin nombre'}), 400

    try:
        # Leer tamaño del archivo
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

        certificacion = {
            "nombre_archivo": archivo.filename,
            "propietario": propietario,
            "fecha_certificacion": datetime.utcnow().isoformat() + "Z",
            "tamanio_bytes": tamanio,
            "hashes": hashes,
            "estado": "CERTIFICADO"
        }

        return jsonify({
            "success": True,
            "certificacion": certificacion
        })

    except Exception as e:
        return jsonify({'error': f'Error al procesar: {str(e)}'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
