import { useFeedingContext } from "@/context/FeedingContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Utensils, Camera, Download, ScrollText } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Tab = "feeding" | "camera";

const HistoryPage = () => {
  const { feedingHistory, analysisHistory, exportHistoryAsText, currentUser } = useFeedingContext();
  const [tab, setTab] = useState<Tab>("feeding");

  // --- Feeding tab ---
  const feedingGrouped = feedingHistory.reduce<Record<string, typeof feedingHistory>>((acc, record) => {
    const date = record.timestamp.slice(0, 10);
    if (!acc[date]) acc[date] = [];
    acc[date].push(record);
    return acc;
  }, {});

  const feedingDates = Object.keys(feedingGrouped).sort((a, b) => b.localeCompare(a));

  // --- Camera tab ---
  const analysisGrouped = analysisHistory.reduce<Record<string, typeof analysisHistory>>((acc, record) => {
    const date = record.timestamp.slice(0, 10);
    if (!acc[date]) acc[date] = [];
    acc[date].push(record);
    return acc;
  }, {});

  const analysisDates = Object.keys(analysisGrouped).sort((a, b) => b.localeCompare(a));

  const handleExportTxt = () => {
    const text = exportHistoryAsText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historial_${currentUser || "usuario"}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold">Historial</h2>
          <p className="text-muted-foreground">Registro de alimentaciones y análisis</p>
        </div>
        {feedingHistory.length > 0 && (
          <Button onClick={handleExportTxt} variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Exportar TXT
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <button
          onClick={() => setTab("feeding")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors",
            tab === "feeding"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Utensils className="h-4 w-4" />
          Comidas
          {feedingHistory.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">{feedingHistory.length}</Badge>
          )}
        </button>
        <button
          onClick={() => setTab("camera")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors",
            tab === "camera"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Camera className="h-4 w-4" />
          Cámara
          {analysisHistory.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">{analysisHistory.length}</Badge>
          )}
        </button>
      </div>

      {/* Tab content */}
      {tab === "feeding" ? (
        <>
          {feedingHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[30vh] text-center space-y-4">
              <Utensils className="h-16 w-16 text-muted-foreground/50" />
              <h3 className="text-xl font-heading font-semibold">Sin historial</h3>
              <p className="text-muted-foreground">Aún no hay registros de alimentación</p>
            </div>
          ) : (
            <ScrollArea className="h-[55vh] pr-4">
              {feedingDates.map(date => (
                <div key={date} className="mb-6">
                  <h3 className="text-sm font-heading font-semibold text-muted-foreground mb-3 sticky top-0 bg-background py-1">
                    {date}
                  </h3>
                  <div className="space-y-1">
                    {feedingGrouped[date]
                      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
                      .map(record => (
                        <div
                          key={record.id}
                          className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-card border text-sm"
                        >
                          <span className="font-mono text-muted-foreground w-14">
                            {new Date(record.timestamp).toLocaleTimeString("es-PE", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}
                          </span>
                          <span className="font-semibold w-14">{record.grams}g</span>
                          <span className={cn(record.humidify ? "text-blue-500" : "text-muted-foreground", "w-24")}>
                            {record.humidify ? "Humedecido" : "Normal"}
                          </span>
                          <Badge variant={record.source === "manual" ? "default" : "secondary"}>
                            {record.source === "manual" ? "Manual" : "Programado"}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </ScrollArea>
          )}
        </>
      ) : (
        <>
          {analysisHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[30vh] text-center space-y-4">
              <Camera className="h-16 w-16 text-muted-foreground/50" />
              <h3 className="text-xl font-heading font-semibold">Sin análisis</h3>
              <p className="text-muted-foreground">Aún no hay análisis de cámara guardados</p>
            </div>
          ) : (
            <ScrollArea className="h-[55vh] pr-4">
              {analysisDates.map(date => (
                <div key={date} className="mb-6">
                  <h3 className="text-sm font-heading font-semibold text-muted-foreground mb-3 sticky top-0 bg-background py-1">
                    {date}
                  </h3>
                  <div className="space-y-3">
                    {analysisGrouped[date]
                      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
                      .map(record => (
                        <div key={record.id} className="flex gap-4 p-3 rounded-lg bg-card border">
                          {/* Thumbnail */}
                          <div className="shrink-0 w-24 h-24 rounded-md overflow-hidden bg-muted">
                            <img
                              src={`data:image/jpeg;base64,${record.imageBase64}`}
                              alt="Screenshot"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {/* Analysis text */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-1">
                              {new Date(record.timestamp).toLocaleTimeString("es-PE", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })}
                            </p>
                            {record.analysisError ? (
                              <p className="text-sm text-destructive">{record.analysisError}</p>
                            ) : (
                              <p className="text-sm text-foreground line-clamp-4">{record.analysisText}</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </ScrollArea>
          )}
        </>
      )}

      {/* ScrollText icon as decoration */}
      {feedingHistory.length === 0 && analysisHistory.length === 0 && (
        <div className="flex justify-center">
          <ScrollText className="h-8 w-8 text-muted-foreground/30" />
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
