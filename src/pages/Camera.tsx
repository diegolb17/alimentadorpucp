import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Brain, Loader2 } from "lucide-react";
import { analyzeImageWithGPT4, blobToBase64 } from "@/services/openai";
import { useFeedingContext } from "@/context/FeedingContext";
import type { AnalysisRecord } from "@/types/feeding";
import { toast } from "@/hooks/use-toast";

const FLASK_SERVER_URL = import.meta.env.VITE_FLASK_SERVER_URL || "http://diego.local:5000";

function createThumbnail(canvas: HTMLCanvasElement, maxSize = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const { width, height } = canvas;
    let thumbW: number, thumbH: number;
    if (width > height) {
      thumbW = maxSize;
      thumbH = Math.round((height / width) * maxSize);
    } else {
      thumbH = maxSize;
      thumbW = Math.round((width / height) * maxSize);
    }
    const thumbCanvas = document.createElement("canvas");
    thumbCanvas.width = thumbW;
    thumbCanvas.height = thumbH;
    const ctx = thumbCanvas.getContext("2d");
    if (!ctx) {
      reject(new Error("No se pudo obtener contexto 2D"));
      return;
    }
    ctx.drawImage(canvas, 0, 0, thumbW, thumbH);
    thumbCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Error al crear blob de miniatura"));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]); // strip data:image/...;base64,
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }, "image/jpeg", 0.6);
  });
}

function downloadScreenshot(canvas: HTMLCanvasElement) {
  const now = new Date();
  const filename = `screenshot_${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}_${String(now.getHours()).padStart(2,"0")}-${String(now.getMinutes()).padStart(2,"0")}.jpg`;
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, "image/jpeg", 0.95);
}

const Camera = () => {
  const { addAnalysisRecord } = useFeedingContext();
  const [cameraOn, setCameraOn] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleAnalyzeImage = async () => {
    if (!cameraOn || isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisError(null);

    try {
      console.log('🔍 Iniciando análisis de imagen...');
      console.log('📡 URL del servidor:', FLASK_SERVER_URL);

      // Método 1: Intentar capturar frame del elemento <img> usando canvas
      console.log('🎯 Intentando capturar frame del elemento img...');
      const imgElement = document.getElementById('camera-stream') as HTMLImageElement;

      if (!imgElement) {
        throw new Error('No se encontró el elemento de la cámara');
      }

      console.log('🖼️  Elemento img encontrado:', imgElement.src);
      console.log('🖼️  Imagen completa:', imgElement.complete);
      console.log('🖼️  Imagen natural dimensions:', imgElement.naturalWidth, 'x', imgElement.naturalHeight);

      // Esperar a que la imagen esté cargada
      if (!imgElement.complete || imgElement.naturalWidth === 0) {
        console.log('⏳ Esperando a que la imagen se cargue...');
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

          // Timeout después de 5 segundos
          setTimeout(() => {
            imgElement.removeEventListener('load', onLoad);
            imgElement.removeEventListener('error', onError);
            reject(new Error('Timeout al esperar carga de imagen'));
          }, 5000);
        });
      }

      console.log('✅ Imagen cargada, creando canvas...');

      // Crear canvas temporal
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No se pudo obtener contexto 2D del canvas');
      }

      // Establecer dimensiones del canvas igual a la imagen
      canvas.width = imgElement.naturalWidth || imgElement.width;
      canvas.height = imgElement.naturalHeight || imgElement.height;

      console.log('📐 Canvas dimensions:', canvas.width, 'x', canvas.height);

      // Intentar dibujar la imagen en el canvas
      try {
        ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
        console.log('✅ Imagen dibujada en canvas');
      } catch (drawError) {
        console.error('❌ Error al dibujar imagen en canvas:', drawError);
        // Podría ser error CORS - intentar método alternativo con fetch
        console.log('🔄 Intentando método alternativo con fetch...');
        throw new Error('Error CORS al acceder a la imagen. El servidor necesita configurar CORS.');
      }

      // Convertir canvas a blob y luego a base64
      console.log('🔧 Convirtiendo canvas a base64...');
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Error al convertir canvas a blob'));
          }
        }, 'image/jpeg', 0.95);
      });

      console.log('📸 Blob creado:', blob.size, 'bytes, tipo:', blob.type);
      const base64Image = await blobToBase64(blob);
      console.log('✅ Base64 convertido, longitud:', base64Image.length);

      // Llamar a OpenAI para analizar la imagen
      console.log('🤖 Enviando a OpenAI GPT-4o...');
      const result = await analyzeImageWithGPT4(base64Image);
      console.log('📝 Resultado de OpenAI:', result);

      // Guardar screenshot y análisis en historial
      const recordId = `analysis_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      let thumbnailBase64 = "";

      try {
        thumbnailBase64 = await createThumbnail(canvas);
        // Descargar screenshot en resolución completa
        downloadScreenshot(canvas);
      } catch (thumbError) {
        console.error("Error al crear miniatura:", thumbError);
      }

      if (result.success && result.description) {
        setAnalysisResult(result.description);
        console.log('✅ Análisis completado exitosamente');

        // Guardar registro exitoso
        if (thumbnailBase64) {
          const record: AnalysisRecord = {
            id: recordId,
            timestamp: new Date().toISOString(),
            imageBase64: thumbnailBase64,
            analysisText: result.description,
          };
          addAnalysisRecord(record);
          toast({
            title: "Captura guardada",
            description: "El análisis y screenshot se guardaron en el historial.",
          });
        }
      } else {
        const errorMsg = result.error || 'Error desconocido al analizar la imagen';
        setAnalysisError(errorMsg);
        console.error('❌ Error en análisis:', errorMsg);

        // Guardar registro con error
        if (thumbnailBase64) {
          const record: AnalysisRecord = {
            id: recordId,
            timestamp: new Date().toISOString(),
            imageBase64: thumbnailBase64,
            analysisError: errorMsg,
          };
          addAnalysisRecord(record);
        }
      }
    } catch (error) {
      console.error('💥 Error en análisis de imagen:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Error desconocido al capturar la imagen');
    } finally {
      console.log('🏁 Finalizando análisis (isAnalyzing: false)');
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-heading font-bold">Cámara en vivo</h2>
        <p className="text-muted-foreground">Observa a tu gato en tiempo real</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-body text-muted-foreground flex items-center gap-2">
            {cameraOn ? <Video className="h-4 w-4 text-success" /> : <VideoOff className="h-4 w-4 text-muted-foreground" />}
            {cameraOn ? "Transmisión en vivo" : "Cámara apagada"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cameraOn ? (
            <div className="relative rounded-xl overflow-hidden bg-muted">
              <img
                src={`${FLASK_SERVER_URL}/video_feed`}
                alt="Vista de la cámara en tiempo real"
                className="w-full aspect-video object-cover rounded-xl"
                crossOrigin="anonymous"
                id="camera-stream"
              />
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-xs font-medium">EN VIVO</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center aspect-video bg-muted rounded-xl">
              <VideoOff className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">La cámara está apagada</p>
              <p className="text-sm text-muted-foreground">Haz clic en el botón para activar</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant={cameraOn ? "destructive" : "default"}
          size="lg"
          className="flex-1 gap-2"
          onClick={() => setCameraOn(!cameraOn)}
        >
          {cameraOn ? <><VideoOff className="h-4 w-4" /> Apagar cámara</> : <><Video className="h-4 w-4" /> Encender cámara</>}
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="flex-1 gap-2"
          onClick={handleAnalyzeImage}
          disabled={!cameraOn || isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analizando con IA...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4" />
              🤖 Reconocer imagen
            </>
          )}
        </Button>
      </div>

      {/* Resultado del análisis de IA */}
      {(analysisResult || analysisError) && (
        <div className={`rounded-lg p-4 ${analysisError ? 'bg-destructive/10 border border-destructive' : 'bg-slate-800 border border-slate-700'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Brain className={`h-4 w-4 ${analysisError ? 'text-destructive' : 'text-primary'}`} />
            <h3 className="font-heading font-semibold text-sm">
              {analysisError ? '❌ Error en el análisis' : '🤖 Análisis de IA'}
            </h3>
          </div>
          {analysisError ? (
            <p className="text-sm text-destructive">{analysisError}</p>
          ) : (
            <p className="text-sm text-slate-200">{analysisResult}</p>
          )}
          <div className="mt-3 text-xs text-slate-400">
            {analysisError ? 'Intenta nuevamente o verifica tu clave API.' : 'Descripción generada por GPT-4o Vision.'}
          </div>
        </div>
      )}
    </div>
  );
};

export default Camera;
