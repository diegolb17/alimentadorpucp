import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, VideoOff } from "lucide-react";
import camaraImg from "@/assets/camara.jpeg";

const Camera = () => {
  const [cameraOn, setCameraOn] = useState(false);

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
            <div className="relative rounded-lg overflow-hidden bg-muted">
              <img
                src={camaraImg}
                alt="Vista de la cámara en tiempo real"
                className="w-full h-auto rounded-lg"
              />
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-xs font-medium">EN VIVO</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
              <VideoOff className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">La cámara está apagada</p>
              <p className="text-sm text-muted-foreground">Haz clic en el botón para activar</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        variant={cameraOn ? "destructive" : "default"}
        size="lg"
        className="w-full gap-2"
        onClick={() => setCameraOn(!cameraOn)}
      >
        {cameraOn ? <><VideoOff className="h-4 w-4" /> Apagar cámara</> : <><Video className="h-4 w-4" /> Encender cámara</>}
      </Button>
    </div>
  );
};

export default Camera;
