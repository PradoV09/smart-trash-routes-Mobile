import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

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
export class ReporteModalComponent {
  @Input() idAsignacion?: number | string;
  @Output() cerrar = new EventEmitter<void>();
  @Output() enviado = new EventEmitter<void>();

  asunto = '';
  descripcion = '';
  prioridad: 'baja' | 'media' | 'alta' = 'baja';
  fotos: { nombre: string; data: string; preview: string }[] = [];
  loading = false;

  constructor(
    private reporteService: ReporteService,
    private toastController: ToastController
  ) {
    addIcons({ cameraOutline, closeOutline, sendOutline, trashOutline, alertCircleOutline, checkmarkCircleOutline, informationCircleOutline, imageOutline });
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

    this.loading = true;
    try {
      await this.reporteService.enviarReporte({
        asunto: this.asunto,
        descripcion: this.descripcion,
        estado: this.prioridad,
        fotos: this.fotos.map(f => ({ nombre: f.nombre, base64: f.data })),
        id_asignacion: this.idAsignacion
      });
      this.presentToast('Reporte enviado correctamente', 'success');
      this.enviado.emit();
      this.cerrar.emit();
    } catch (err: any) {
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