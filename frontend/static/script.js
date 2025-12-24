// static/script.js
document.addEventListener('DOMContentLoaded', () => {
    const archivoInput = document.getElementById('archivo');
    const propietarioInput = document.getElementById('propietario');
    const btnCertificar = document.getElementById('btn-certificar');
    const btnVerificar = document.getElementById('btn-verificar');
    const btnGuardar = document.getElementById('btn-guardar');
    const resultadosDiv = document.getElementById('resultados');
    
    let ultimaCertificacion = null;

    // ✅ URL de tu backend en Railway (¡sin espacios!)
    const BACKEND_URL = 'https://certifier-backend.up.railway.app';

    // Modal de verificación
    const modal = document.getElementById('modal-verificar');
    const span = document.getElementsByClassName('close')[0];
    const btnVerificarSubmit = document.getElementById('btn-verificar-submit');

    btnCertificar.addEventListener('click', certificar);
    btnVerificar.addEventListener('click', () => modal.style.display = 'block');
    btnGuardar.addEventListener('click', guardarCertificado);
    span.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

    btnVerificarSubmit.addEventListener('click', () => {
        const hashOriginal = document.getElementById('hash-original').value.trim();
        if (!hashOriginal) {
            alert('Por favor ingresa un hash SHA-256');
            return;
        }
        modal.style.display = 'none';
        verificar(hashOriginal);
    });

    function mostrarResultado(texto, esError = false) {
        resultadosDiv.textContent = texto;
        resultadosDiv.className = `results ${esError ? 'error' : 'success'}`;
    }

    function certificar() {
        const archivo = archivoInput.files[0];
        const propietario = propietarioInput.value || 'Usuario';

        if (!archivo) {
            alert('Selecciona un archivo primero');
            return;
        }

        const formData = new FormData();
        formData.append('archivo', archivo);
        formData.append('propietario', propietario);

        fetch(`${BACKEND_URL}/api/certificar`, {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                ultimaCertificacion = data.certificacion;
                const reporte = `
╔═══════════════════════════════════════╗
║        CERTIFICACIÓN DE ARCHIVO       ║
╚═══════════════════════════════════════╝

📄 ARCHIVO: ${data.certificacion.nombre_archivo}
👤 PROPIETARIO: ${data.certificacion.propietario}
📅 FECHA CERTIFICACIÓN: ${data.certificacion.fecha_certificacion.split('T')[0]}
💾 TAMAÑO: ${data.certificacion.tamanio_bytes} bytes

🔐 HASHES DE SEGURIDAD:
   • SHA-256: ${data.certificacion.hashes.sha256}
   • SHA-1:   ${data.certificacion.hashes.sha1}
   • MD5:     ${data.certificacion.hashes.md5}

✅ ESTADO: ${data.certificacion.estado}
                `;
                mostrarResultado(reporte);
            } else {
                mostrarResultado(`❌ ERROR: ${data.error}`, true);
            }
        })
        .catch(err => {
            console.error('Error de red:', err);
            mostrarResultado(`❌ Error de red: ${err.message}\n\nAbre la consola (F12) para más detalles.`, true);
        });
    }

    function verificar(hashOriginal) {
        const archivo = archivoInput.files[0];
        if (!archivo) {
            alert('Selecciona un archivo primero');
            return;
        }

        const formData = new FormData();
        formData.append('archivo', archivo);
        formData.append('hash_original', hashOriginal);

        fetch(`${BACKEND_URL}/api/verificar`, {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const estado = data.integro ? '✅ INTEGRIDAD VERIFICADA' : '❌ INTEGRIDAD COMPROMETIDA';
                const resultado = `
=== RESULTADO DE VERIFICACIÓN ===
Estado: ${estado}
Fecha verificación: ${data.verificacion_fecha}

Hash original: ${data.hash_original}
Hash actual:    ${data.hash_actual}
                `;
                mostrarResultado(resultado, !data.integro);
            } else {
                mostrarResultado(`❌ ERROR: ${data.error}`, true);
            }
        })
        .catch(err => {
            console.error('Error de red:', err);
            mostrarResultado(`❌ Error de red: ${err.message}`, true);
        });
    }

    function guardarCertificado() {
        if (!ultimaCertificacion) {
            alert('Primero certifica un archivo');
            return;
        }

        fetch(`${BACKEND_URL}/api/guardar-certificado`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ certificacion: ultimaCertificacion })
        })
        .then(response => {
            if (response.ok) {
                return response.blob();
            }
            throw new Error('Error al guardar el certificado');
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'certificado.json';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        })
        .catch(err => {
            console.error('Error al guardar:', err);
            alert('Error al descargar: ' + err.message);
        });
    }
});
