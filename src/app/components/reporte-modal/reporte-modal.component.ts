import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation, Position, WatchPositionCallback } from '@capacitor/geolocation';

import { ReporteService } from '../../services/reporte.service';
import { addIcons } from 'ionicons';
import {
  cameraOutline, closeOutline, sendOutline, trashOutline,
  alertCircleOutline, checkmarkCircleOutline,
  informationCircleOutline, imageOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-reporte-modal',
  templateUrl: './reporte-modal.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ReporteModalComponent implements OnInit, OnDestroy {
  @Input() idAsignacion?: number | string;
  @Output() cerrar = new EventEmitter<void>();
  @Output() enviado = new EventEmitter<void>();

  asunto = '';
  descripcion = '';
  prioridad: 'baja' | 'media' | 'alta' = 'baja';
  fotos: { nombre: string; data: string; preview: string }[] = [];
  loading = false;
  latitud: number | null = null;
  longitud: number | null = null;
  private watchId: string | null = null;
  private lastLatitud: number | null = null;
  private lastLongitud: number | null = null;
  private readonly DISTANCIA_MINIMA_METROS = 50;

  constructor(
    private reporteService: ReporteService,
    private toastController: ToastController
  ) {
    addIcons({ cameraOutline, closeOutline, sendOutline, trashOutline, alertCircleOutline, checkmarkCircleOutline, informationCircleOutline, imageOutline });
  }

  async ngOnInit() {
    await this.iniciarSeguimientoUbicacion();
  }

  ngOnDestroy() {
    this.detenerSeguimientoUbicacion();
  }

  getPrioridadColor(p: string): string {
    switch (p) {
      case 'alta':  return '#EF4444';
      case 'media': return '#F59E0B';
      case 'baja':  return '#10B981';
      default:      return '#10B981';
    }
  }

  async abrirCamara() {
    if (this.fotos.length >= 5) {
      this.presentToast('Máximo 5 fotos por reporte', 'warning');
      return;
    }
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });

      if (image.base64String) {
        const base64 = `data:image/jpeg;base64,${image.base64String}`;
        const nombre = `foto_${Date.now()}.jpg`;
        this.fotos.push({ nombre, data: base64, preview: base64 });
      }
    } catch (e) {
      console.log('Error al capturar foto', e);
    }
  }

  async abrirSelector() {
    if (this.fotos.length >= 5) {
      this.presentToast('Máximo 5 fotos por reporte', 'warning');
      return;
    }
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos
      });

      if (image.base64String) {
        const base64 = `data:image/jpeg;base64,${image.base64String}`;
        const nombre = `foto_${Date.now()}.jpg`;
        this.fotos.push({ nombre, data: base64, preview: base64 });
      }
    } catch (e) {
      console.log('Error al seleccionar foto', e);
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  quitarFoto(index: number) {
    this.fotos.splice(index, 1);
  }

  private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
  }

  async iniciarSeguimientoUbicacion(): Promise<void> {
    try {
      this.watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        },
        (position, err) => {
          if (err) {
            console.error('Error en seguimiento de ubicación:', err);
            return;
          }
          if (position) {
            const newLat = position.coords.latitude;
            const newLon = position.coords.longitude;

            // Si es la primera posición, guardarla
            if (this.lastLatitud === null || this.lastLongitud === null) {
              this.lastLatitud = newLat;
              this.lastLongitud = newLon;
              this.latitud = newLat;
              this.longitud = newLon;
              return;
            }

            // Calcular distancia desde la última posición
            const distancia = this.calcularDistancia(
              this.lastLatitud,
              this.lastLongitud,
              newLat,
              newLon
            );

            // Solo actualizar si la distancia es >= 50 metros
            if (distancia >= this.DISTANCIA_MINIMA_METROS) {
              this.lastLatitud = newLat;
              this.lastLongitud = newLon;
              this.latitud = newLat;
              this.longitud = newLon;
              console.log(`Posición actualizada: ${distancia.toFixed(0)} metros desde la última posición`);
            }
          }
        }
      );
    } catch (error) {
      console.error('Error al iniciar seguimiento de ubicación:', error);
    }
  }

  detenerSeguimientoUbicacion(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }
  }

  async capturarUbicacion(): Promise<void> {
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
      this.latitud = coordinates.coords.latitude;
      this.longitud = coordinates.coords.longitude;
    } catch (error) {
      console.error('Error al obtener ubicación:', error);
      throw error;
    }
  }

  validar(): string | null {
    if (!this.asunto.trim() || this.asunto.length < 5)
      return 'El asunto debe tener mínimo 5 caracteres';
    if (this.asunto.length > 100)
      return 'El asunto no puede superar 100 caracteres';
    if (!this.descripcion.trim() || this.descripcion.length < 10)
      return 'La descripción debe tener mínimo 10 caracteres';
    if (this.descripcion.length > 1000)
      return 'La descripción no puede superar 1000 caracteres';
    return null;
  }

  async enviarReporte() {
    const error = this.validar();
    if (error) {
      this.presentToast(error, 'warning');
      return;
    }

    if (this.latitud === null || this.longitud === null) {
      this.presentToast('Obteniendo ubicación GPS...', 'warning');
      try {
        await this.capturarUbicacion();
      } catch (e) {
        this.presentToast('No se pudo obtener la ubicación GPS', 'danger');
        return;
      }
    }

    // Double check we have coordinates after capture
    if (this.latitud === null || this.longitud === null) {
      this.presentToast('No se pudo obtener la ubicación GPS', 'danger');
      return;
    }

    this.loading = true;
    try {
      const reporteData = {
        asunto: this.asunto,
        descripcion: this.descripcion,
        estado: this.prioridad,
        latitud: this.latitud,
        longitud: this.longitud,
        fotos: this.fotos.map(f => ({ imagen_base64: f.data })),
        id_asignacion: this.idAsignacion
      };
      console.log('Enviando reporte:', {
        id_asignacion: reporteData.id_asignacion,
        num_fotos: reporteData.fotos?.length,
        foto_size: reporteData.fotos?.[0]?.imagen_base64?.length
      });
      const response = await this.reporteService.enviarReporte(reporteData);
      console.log('Respuesta del servidor:', response);
      if (response?.offline) {
        this.presentToast('Sin conexión: reporte guardado. Se enviará automáticamente.', 'warning');
      } else {
        this.presentToast('Reporte enviado correctamente', 'success');
      }
      this.enviado.emit();
      this.cerrar.emit();
    } catch (err: any) {
      console.error('Error al enviar reporte:', err);
      this.presentToast(err.message || 'Error al enviar reporte', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message, duration: 3000, color, position: 'top'
    });
    toast.present();
  }
}