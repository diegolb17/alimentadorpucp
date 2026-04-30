import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useFeedingContext } from "@/context/FeedingContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { RotateCcw, Bell, Moon, Cat, User, LogOut, Plus, Trash2, Image as ImageIcon, Upload } from "lucide-react";
import type { CatProfile } from "@/context/FeedingContext";
import { fileToDataURL, resizeImage } from "@/utils/imageUtils";

const SettingsPage = () => {
  const {
    setMeals, selectedCat, setSelectedCatId, currentUser, logout,
    customCats, addCustomCat, deleteCustomCat, allCats,
    hiddenCatIds, hideCat, unhideCat,
  } = useFeedingContext();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Custom cat form
  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState("");
  const [catBreed, setCatBreed] = useState("");
  const [catCharacteristics, setCatCharacteristics] = useState("");
  const [catPhotoPreview, setCatPhotoPreview] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [catError, setCatError] = useState("");

  const resetSchedule = () => {
    setMeals([
      { id: "1", time: "07:00", served: false, humidify: false, portions: 24 },
      { id: "2", time: "12:00", served: false, humidify: false, portions: 24 },
      { id: "3", time: "18:00", served: false, humidify: false, portions: 24 },
      { id: "4", time: "22:00", served: false, humidify: false, portions: 24 },
    ]);
  };

  const handleSwitchUser = () => {
    logout();
    navigate("/", { replace: true });
  };

  const toggleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  };

  // --- Drag & drop handlers ---
  const handleFileSelect = useCallback(async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setCatError("Solo se permiten imágenes");
      return;
    }
    setCatError("");
    try {
      const dataUrl = await fileToDataURL(file);
      const resized = await resizeImage(dataUrl, 800);
      setCatPhotoPreview(resized);
    } catch {
      setCatError("Error al procesar la imagen");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    handleFileSelect(file);
  }, [handleFileSelect]);

  // --- Add cat ---
  const handleAddCat = () => {
    setCatError("");
    if (!catName.trim()) { setCatError("Ingresa el nombre del gato"); return; }
    if (!catBreed.trim()) { setCatError("Ingresa la raza del gato"); return; }
    if (!catPhotoPreview) { setCatError("Selecciona una foto del gato"); return; }

    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newCat: CatProfile = {
      id,
      name: catName.trim(),
      breed: catBreed.trim(),
      image: catPhotoPreview,
      characteristics: catCharacteristics.trim() || undefined,
    };

    addCustomCat(newCat);
    setCatName("");
    setCatBreed("");
    setCatCharacteristics("");
    setCatPhotoPreview("");
    setShowCatForm(false);
  };

  // --- Delete / Hide cat ---
  const handleDeleteCat = (cat: CatProfile) => {
    const isCustom = cat.id.startsWith("custom_");
    const message = isCustom
      ? `¿Eliminar a "${cat.name}" de la lista?`
      : `¿Ocultar a "${cat.name}" de la lista? (puedes restaurarlo después)`;

    if (window.confirm(message)) {
      if (isCustom) {
        deleteCustomCat(cat.id);
      } else {
        hideCat(cat.id);
      }
    }
  };

  const handleRestoreAll = () => {
    if (window.confirm("¿Restaurar todos los gatos ocultos?")) {
      hiddenCatIds.forEach(id => unhideCat(id));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-heading font-bold">Ajustes</h2>
        <p className="text-muted-foreground">Administra las preferencias del alimentador</p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Usuario actual</p>
              <p className="text-sm text-muted-foreground">{currentUser}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSwitchUser} className="gap-2">
              <LogOut className="h-4 w-4" /> Cambiar usuario
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cat Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Cat className="h-5 w-5 text-primary" /> Seleccionar gato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Elige el gato que será alimentado por el sistema</p>
          <div className="grid grid-cols-3 gap-3">
            {allCats.map(cat => {
              const isCustom = cat.id.startsWith("custom_");
              return (
                <div key={cat.id} className="relative">
                  <button
                    onClick={() => setSelectedCatId(cat.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 w-full ${
                      selectedCat.id === cat.id
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/400?text=Gato"; }}
                      />
                    </div>
                    <span className="text-sm font-heading font-semibold">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">{cat.breed}</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCat(cat); }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/80 transition-colors"
                    title={isCustom ? "Eliminar gato" : "Ocultar gato"}
                  >
                    {isCustom ? <Trash2 className="h-3 w-3" /> : <Trash2 className="h-3 w-3" />}
                  </button>
                </div>
              );
            })}
          </div>
          {hiddenCatIds.length > 0 && (
            <div className="mt-3 text-center">
              <button
                onClick={handleRestoreAll}
                className="text-xs text-muted-foreground hover:text-primary underline"
              >
                Restaurar gatos ocultos ({hiddenCatIds.length})
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Register new cat */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" /> Registrar nuevo gato
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showCatForm ? (
            <Button variant="outline" onClick={() => setShowCatForm(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Agregar gato
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Nombre del gato</Label>
                <Input
                  id="cat-name"
                  placeholder="Ej: Misi"
                  value={catName}
                  onChange={(e) => { setCatName(e.target.value); setCatError(""); }}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-breed">Raza</Label>
                <Input
                  id="cat-breed"
                  placeholder="Ej: Persa"
                  value={catBreed}
                  onChange={(e) => { setCatBreed(e.target.value); setCatError(""); }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-characteristics">Características</Label>
                <Textarea
                  id="cat-characteristics"
                  placeholder="Ej: Es juguetón, le gusta dormir al sol, come solo croquetas secas..."
                  value={catCharacteristics}
                  onChange={(e) => { setCatCharacteristics(e.target.value); setCatError(""); }}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Foto del gato</Label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => document.getElementById("cat-photo-input")?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    isDragOver ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                    catPhotoPreview ? "p-3" : "p-6"
                  )}
                >
                  <input
                    id="cat-photo-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  {catPhotoPreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={catPhotoPreview}
                        alt="Vista previa"
                        className="w-24 h-24 rounded-full object-cover border-2 border-border"
                      />
                      <span className="text-xs text-muted-foreground">Haz clic o arrastra para cambiar</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Arrastra una foto aquí o haz clic para seleccionar
                      </p>
                      <p className="text-xs text-muted-foreground">Solo imágenes (JPG, PNG)</p>
                    </div>
                  )}
                </div>
              </div>
              {catError && <p className="text-sm text-destructive">{catError}</p>}
              <div className="flex gap-2">
                <Button onClick={handleAddCat} className="gap-2">
                  <Plus className="h-4 w-4" /> Registrar
                </Button>
                <Button variant="ghost" onClick={() => { setShowCatForm(false); setCatError(""); setCatPhotoPreview(""); }}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">Preferencias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <Label htmlFor="notifications" className="cursor-pointer">
                <p className="font-medium">Notificaciones</p>
                <p className="text-sm text-muted-foreground">Recibir alertas antes de las comidas</p>
              </Label>
            </div>
            <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5 text-primary" />
              <Label htmlFor="darkmode" className="cursor-pointer">
                <p className="font-medium">Modo oscuro</p>
                <p className="text-sm text-muted-foreground">Cambiar al tema oscuro</p>
              </Label>
            </div>
            <Switch id="darkmode" checked={darkMode} onCheckedChange={toggleDarkMode} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">Zona de peligro</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={resetSchedule} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Restablecer horario
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Esto restaurará el horario predeterminado de 4 comidas
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
