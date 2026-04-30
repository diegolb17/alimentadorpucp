/**
 * Utilidades para capturar frames del stream de video
 */

const FLASK_SERVER_URL = import.meta.env.VITE_FLASK_SERVER_URL || "http://diego.local:5000";

/**
 * Intenta capturar un frame del stream de video usando múltiples métodos
 * @returns Promise con imagen en base64
 */
export async function captureFrame(): Promise<string> {
  console.log('📸 Iniciando captura de frame...');

  // Método 1: Canvas desde elemento img (requiere CORS)
  try {
    console.log('🔄 Método 1: Canvas desde elemento img...');
    const frame = await captureFrameFromCanvas();
    console.log('✅ Método 1 exitoso');
    return frame;
  } catch (error) {
    console.warn('❌ Método 1 falló:', error);
  }

  // Método 2: Endpoint de captura estática
  try {
    console.log('🔄 Método 2: Endpoint /capture...');
    const frame = await captureFrameFromEndpoint('/capture');
    console.log('✅ Método 2 exitoso');
    return frame;
  } catch (error) {
    console.warn('❌ Método 2 falló:', error);
  }

  // Método 3: Endpoint /frame
  try {
    console.log('🔄 Método 3: Endpoint /frame...');
    const frame = await captureFrameFromEndpoint('/frame');
    console.log('✅ Método 3 exitoso');
    return frame;
  } catch (error) {
    console.warn('❌ Método 3 falló:', error);
  }

  // Método 4: Endpoint /snapshot
  try {
    console.log('🔄 Método 4: Endpoint /snapshot...');
    const frame = await captureFrameFromEndpoint('/snapshot');
    console.log('✅ Método 4 exitoso');
    return frame;
  } catch (error) {
    console.warn('❌ Método 4 falló:', error);
  }

  // Método 5: Fetch directo a /video_feed (puede devolver stream)
  try {
    console.log('🔄 Método 5: Fetch a /video_feed...');
    const frame = await captureFrameFromVideoFeed();
    console.log('✅ Método 5 exitoso');
    return frame;
  } catch (error) {
    console.warn('❌ Método 5 falló:', error);
  }

  throw new Error('Todos los métodos de captura fallaron. Verifica la conexión al servidor y configuración CORS.');
}

/**
 * Captura frame usando canvas desde el elemento img
 */
async function captureFrameFromCanvas(): Promise<string> {
  const imgElement = document.getElementById('camera-stream') as HTMLImageElement;

  if (!imgElement) {
    throw new Error('No se encontró el elemento de la cámara');
  }

  // Esperar a que la imagen esté cargada
  if (!imgElement.complete || imgElement.naturalWidth === 0) {
    await new Promise((resolve, reject) => {
      const onLoad = () => {
        imgElement.removeEventListener('load', onLoad);
        imgElement.removeEventListener('error', onError);
        resolve(true);
      };
      const onError = () => {
        imgElement.removeEventListener('load', onLoad);
        imgElement.removeEventListener('error', onError);
        reject(new Error('Error al cargar la imagen'));
      };
      imgElement.addEventListener('load', onLoad);
      imgElement.addEventListener('error', onError);

      setTimeout(() => {
        imgElement.removeEventListener('load', onLoad);
        imgElement.removeEventListener('error', onError);
        reject(new Error('Timeout al esperar carga de imagen'));
      }, 5000);
    });
  }

  // Crear canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No se pudo obtener contexto 2D');
  }

  canvas.width = imgElement.naturalWidth || imgElement.width || 640;
  canvas.height = imgElement.naturalHeight || imgElement.height || 480;

  try {
    ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
  } catch (drawError) {
    throw new Error(`Error CORS: No se puede acceder a la imagen. Asegúrate de que el servidor tenga CORS habilitado. Detalles: ${drawError}`);
  }

  // Convertir a base64
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Error al convertir canvas a blob'));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Error al leer blob'));
      reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.9);
  });
}

/**
 * Captura frame desde un endpoint específico
 */
async function captureFrameFromEndpoint(endpoint: string): Promise<string> {
  const response = await fetch(`${FLASK_SERVER_URL}${endpoint}`, {
    cache: 'no-store',
    headers: { 'Accept': 'image/jpeg' },
    mode: 'cors'
  });

  if (!response.ok) {
    throw new Error(`Endpoint ${endpoint} respondió con status ${response.status}`);
  }

  const blob = await response.blob();

  if (!blob.type.startsWith('image/')) {
    console.warn(`Endpoint ${endpoint} devolvió tipo no imagen: ${blob.type}`);
  }

  // Convertir a base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Error al convertir blob a base64'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Captura frame desde el stream /video_feed
 */
async function captureFrameFromVideoFeed(): Promise<string> {
  const response = await fetch(`${FLASK_SERVER_URL}/video_feed`, {
    cache: 'no-store',
    headers: { 'Accept': 'image/jpeg' },
    mode: 'cors'
  });

  if (!response.ok) {
    throw new Error(`/video_feed respondió con status ${response.status}`);
  }

  const blob = await response.blob();

  // El stream MJPEG puede devolver tipo multipart/x-mixed-replace
  // Intentar procesar como imagen de todos modos
  if (!blob.type.startsWith('image/')) {
    console.warn(`/video_feed devolvió tipo no imagen: ${blob.type}, intentando procesar...`);
  }

  // Convertir a base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Error al convertir blob a base64'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Verifica si el servidor tiene CORS habilitado
 */
export async function checkCORS(): Promise<boolean> {
  try {
    const response = await fetch(`${FLASK_SERVER_URL}/video_feed`, {
      method: 'HEAD',
      mode: 'cors'
    });

    // Si la solicitud HEAD pasa, CORS está habilitado
    console.log('✅ CORS parece habilitado (HEAD request exitosa)');
    return true;
  } catch (error) {
    console.warn('❌ CORS no habilitado o error de conexión:', error);
    return false;
  }
}