import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';
import { AsignacionesService, Asignacion } from '../../services/asignaciones.service';
import { AuthService } from '../../services/auth.service';
import { AsignacionCardComponent } from '../../components/asignacion-card/asignacion-card.component';
import { environment } from '../../../environments/environment';
import { WebSocketService, WebSocketConnection } from '../../services/websocket.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule, AsignacionCardComponent]
})
export class HomePage implements OnInit, OnDestroy {
  asignaciones: Asignacion[] = [];
  loading = false;
  token = '';

  constructor(
    private asignacionesService: AsignacionesService,
    private authService: AuthService,
    private toastController: ToastController,
    private webSocketService: WebSocketService
  ) {
    addIcons({ logOutOutline });
  }

  async ngOnInit() {
    this.token = localStorage.getItem('access_token') || '';

    if (!this.token) {
      return;
    }

    await this.cargarAsignaciones();
  }

  ngOnDestroy(): void {
    // Best effort cleanup - don't wait to avoid blocking component destruction
    this.webSocketService.disconnectAll().catch(error => {
      console.warn('Error en ngOnDestroy al desconectar WebSockets:', error);
    });
  }

  private async setupWebSockets(asignaciones: Asignacion[]): Promise<void> {
    // Disconnect any existing connections for assignments that no longer exist
    const currentConnections = this.webSocketService.getActiveConnections();
    const newAssignmentIds = asignaciones.map(a => typeof a.id === 'string' ? parseInt(a.id) : a.id);

    // Disconnect connections for assignments that are no longer in the list
    for (const connectionId of currentConnections) {
      if (!newAssignmentIds.includes(connectionId)) {
        this.webSocketService.disconnect(connectionId);
      }
    }

    // Setup connections for current assignments
    const maxConcurrentConnections = 5;
    const connectionDelay = 1000; // 1 second delay between connections

    // Connect to first batch
    const firstBatch = asignaciones.slice(0, maxConcurrentConnections);
    const connectionPromises: Promise<WebSocketConnection>[] = [];

    for (let i = 0; i < firstBatch.length; i++) {
      const asignacion = firstBatch[i];
      const asignacionId = typeof asignacion.id === 'string' ? parseInt(asignacion.id) : asignacion.id;

      const promise = this.webSocketService.connect(asignacionId, this.token)
        .then(connection => {
          this.setupMessageHandlers(connection);
          return connection;
        })
        .catch(error => {
          throw error;
        });

      connectionPromises.push(promise);

      // Add delay between connections
      if (i < firstBatch.length - 1) {
        await this.delay(connectionDelay);
      }
    }

    // Wait for first batch to complete
    try {
      // Use Promise.allSettled polyfill for compatibility
      const results = await Promise.all(connectionPromises.map(promise =>
        promise.then(value => ({ status: 'fulfilled', value }))
          .catch(reason => ({ status: 'rejected', reason }))
      ));
    } catch (error) {
    }

    // Queue remaining connections
    if (asignaciones.length > maxConcurrentConnections) {
      const remaining = asignaciones.slice(maxConcurrentConnections);

      for (let i = 0; i < remaining.length; i++) {
        const asignacion = remaining[i];
        const asignacionId = typeof asignacion.id === 'string' ? parseInt(asignacion.id) : asignacion.id;

        setTimeout(async () => {
          try {
            const connection = await this.webSocketService.connect(asignacionId, this.token);
            this.setupMessageHandlers(connection);
          } catch (error) {
          }
        }, (maxConcurrentConnections + i) * connectionDelay);
      }
    }
  }

  private setupMessageHandlers(connection: WebSocketConnection): void {
    connection.messageHandler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        // Handle different message types
        if (data.type === 'pong') {
          // Heartbeat response
          return;
        }

        // Handle assignment events
        if (data.evento === 'recorrido_iniciado' ||
          data.evento === 'recorrido_finalizado' ||
          data.evento === 'asignacion_cancelada') {
          this.cargarAsignaciones();
        }
      } catch (err) {
        // Error parsing message
      }
    };

    connection.errorHandler = (event: Event) => {
      this.presentToast(`Error de conexión para asignación ${connection.asignacionId}`, 'warning');
    };

    connection.closeHandler = (event: CloseEvent) => {
      if (event.code !== 1000) {
        // Abnormal closure
        this.presentToast(`Conexión perdida para asignación ${connection.asignacionId}`, 'warning');
      }
    };
  }

  /**
   * Helper method to create delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cargarAsignaciones() {
    this.loading = true;
    try {
      this.asignaciones = await this.asignacionesService.getAsignaciones();
      await this.setupWebSockets(this.asignaciones);
    } catch (err: any) {
      this.presentToast(err.message, 'danger');
    } finally {
      this.loading = false;
    }
  }

  async handleIniciar(id: string | number) {
    this.loading = true;
    try {
      await this.asignacionesService.iniciarRecorrido(id);
      this.presentToast('Recorrido iniciado', 'success');
      // Reload assignments to get updated status
      await this.cargarAsignaciones();
    } catch (e: any) {
      this.presentToast(e.message, 'danger');
      this.loading = false;
    }
  }

  async handleFinalizar(id: string | number) {
    this.loading = true;
    try {
      await this.asignacionesService.finalizarRecorrido(id);
      this.presentToast('Recorrido finalizado', 'success');
      // Reload assignments to get updated status
      await this.cargarAsignaciones();
    } catch (e: any) {
      this.presentToast(e.message, 'danger');
      this.loading = false;
    }
  }

  logout() {
    console.log('Iniciando logout...');

    // Disconnect WebSockets first (async but don't wait to block)
    this.webSocketService.disconnectAll()
      .then(() => {
        console.log('Logout: WebSockets desconectados exitosamente');
      })
      .catch((error) => {
        console.error('Logout: Error desconectando WebSockets:', error);
      })
      .finally(() => {
        // Always navigate to login, regardless of disconnection outcome
        this.authService.logout();
        console.log('Logout completado - navegando a login');
      });
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color
    });
    toast.present();
  }
}
