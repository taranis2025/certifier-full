// static/script.js
document.addEventListener('DOMContentLoaded', () => {
    const archivoInput = document.getElementById('archivo');
    const propietarioInput = document.getElementById('propietario');
    const btnCertificar = document.getElementById('btn-certificar');
    const btnVerificar = document.getElementById('btn-verificar');
    const resultadosDiv = document.getElementById('resultados');

    // ✅ URL CORREGIDA: sin espacios al final
    const BACKEND_URL = 'https://certifier-backend.onrender.com';

    // Modal de verificación
    const modal = document.getElementById('modal-verificar');
    const span = document.getElementsByClassName('close')[0];
    const btnVerificarSubmit = document.getElementById('btn-verificar-submit');

    btnCertificar.addEventListener('click', certificar);
    btnVerificar.addEventListener('click', () => modal.style.display = 'block');
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
        .then(res => {
            if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
            return res.json();
        })
        .then(data => {
            if (data.success) {
                const c = data.certificacion;
                const reporte = `
╔═══════════════════════════════════════╗
║        CERTIFICACIÓN DE ARCHIVO       ║
╚═══════════════════════════════════════╝

📄 ARCHIVO: ${c.nombre_archivo}
👤 PROPIETARIO: ${c.propietario}
📅 FECHA: ${c.fecha_certificacion.split('T')[0]}
💾 TAMAÑO: ${c.tamanio_bytes} bytes

🔐 HASHES:
   • SHA-256: ${c.hashes.sha256}
   • SHA-1:   ${c.hashes.sha1}
   • MD5:     ${c.hashes.md5}

✅ ESTADO: ${c.estado}
                `.trim();
                mostrarResultado(reporte);
            } else {
                mostrarResultado(`❌ ERROR: ${data.error}`, true);
            }
        })
        .catch(err => {
            console.error('Error:', err);
            mostrarResultado(`❌ Error: ${err.message}`, true);
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
        .then(res => {
            if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
            return res.json();
        })
        .then(data => {
            if (data.success) {
                const estado = data.integro ? '✅ INTEGRIDAD VERIFICADA' : '❌ INTEGRIDAD COMPROMETIDA';
                const resultado = `
=== RESULTADO DE VERIFICACIÓN ===
Estado: ${estado}
Hash original: ${data.hash_original}
Hash actual:   ${data.hash_actual}
                `.trim();
                mostrarResultado(resultado, !data.integro);
            } else {
                mostrarResultado(`❌ ERROR: ${data.error}`, true);
            }
        })
        .catch(err => {
            console.error('Error:', err);
            mostrarResultado(`❌ Error: ${err.message}`, true);
        });
    }
});
