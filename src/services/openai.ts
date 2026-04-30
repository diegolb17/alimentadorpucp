import { toast } from "@/hooks/use-toast";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export interface OpenAIAnalysisResult {
  success: boolean;
  description?: string;
  error?: string;
}

/**
 * Analiza una imagen usando GPT-4o Vision
 * @param base64Image Imagen en base64 (sin prefijo data:image/jpeg;base64,)
 * @returns Objeto con resultado del análisis
 */
export async function analyzeImageWithGPT4(
  base64Image: string
): Promise<OpenAIAnalysisResult> {
  console.log('🔑 Verificando clave API de OpenAI...');
  console.log('🔑 Clave API presente:', !!OPENAI_API_KEY);
  console.log('🔑 Clave API valor (primeros 10 chars):', OPENAI_API_KEY ? `${OPENAI_API_KEY.substring(0, 10)}...` : 'No configurada');

  // Validar que la clave API esté configurada
  if (!OPENAI_API_KEY || OPENAI_API_KEY === "tu_clave_aqui") {
    console.error('❌ Clave API no configurada o es placeholder');
    return {
      success: false,
      error: "Clave API de OpenAI no configurada. Por favor, configura VITE_OPENAI_API_KEY en el archivo .env",
    };
  }

  try {
    console.log('📤 Preparando solicitud a OpenAI...');
    console.log('📤 URL:', OPENAI_API_URL);
    console.log('📤 Tamaño de imagen base64:', base64Image.length);

    const requestBody = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente experto en analizar cámaras de mascotas. Describe brevemente qué ves en esta imagen. Responde en español.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "¿Qué ves en esta imagen de la cámara del alimentador de mascotas?",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    };

    console.log('📤 Request body tamaño:', JSON.stringify(requestBody).length);
    console.log('📤 Imagen URL (primeros 100 chars):', `data:image/jpeg;base64,${base64Image.substring(0, 100)}...`);

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 Respuesta de OpenAI recibida');
    console.log('📥 Status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('❌ Error en respuesta de OpenAI:', response.status);
      const errorText = await response.text();
      console.error('❌ Error body:', errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }

      let errorMessage = `Error de API: ${response.status}`;

      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      } else if (response.status === 401) {
        errorMessage = "Clave API inválida o expirada";
      } else if (response.status === 429) {
        errorMessage = "Límite de cuota superado. Intenta más tarde";
      } else if (response.status === 403) {
        errorMessage = "Acceso denegado. Verifica permisos de la API";
      }

      console.error('❌ Error detallado:', errorMessage);

      // Mostrar toast de error
      toast({
        title: "Error de OpenAI",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();
    console.log('✅ Respuesta JSON recibida de OpenAI');
    console.log('✅ Choices:', data.choices?.length);

    const description = data.choices?.[0]?.message?.content;
    console.log('✅ Descripción recibida:', description?.substring(0, 100) + '...');

    if (!description) {
      console.error('❌ No se recibió descripción de la API');
      throw new Error("No se recibió descripción de la API");
    }

    console.log('✅ Análisis completado exitosamente');
    return {
      success: true,
      description,
    };
  } catch (error) {
    console.error("💥 Error analizando imagen con GPT-4:", error);

    const errorMessage = error instanceof Error
      ? error.message
      : "Error desconocido al conectar con OpenAI";

    toast({
      title: "Error de conexión",
      description: errorMessage,
      variant: "destructive",
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Convierte un Blob a base64
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Remover el prefijo "data:image/jpeg;base64,"
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}