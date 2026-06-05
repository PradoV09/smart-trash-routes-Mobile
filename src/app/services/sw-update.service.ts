import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { ToastController } from '@ionic/angular';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SwUpdateService {
  constructor(
    private swUpdate: SwUpdate,
    private toastController: ToastController
  ) {}

  init() {
    if (!this.swUpdate.isEnabled) {
      console.log('[SW] Service Worker no habilitado en este entorno.');
      return;
    }

    // Escuchar cuando hay una nueva versión lista
    this.swUpdate.versionUpdates.pipe(
      filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
    ).subscribe(async () => {
      await this.mostrarToastActualizacion();
    });

    // Verificar actualizaciones cada 6 horas
    setInterval(() => {
      this.swUpdate.checkForUpdate().catch(err =>
        console.warn('[SW] Error al verificar actualización:', err)
      );
    }, 6 * 60 * 60 * 1000);

    console.log('[SW] Gestión de actualizaciones activa.');
  }

  private async mostrarToastActualizacion() {
    const toast = await this.toastController.create({
      message: '🆕 Nueva versión disponible',
      duration: 0, // no se cierra solo
      position: 'bottom',
      color: 'primary',
      buttons: [
        {
          text: 'Actualizar',
          handler: () => {
            window.location.reload();
          }
        },
        {
          text: 'Ahora no',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }
}
