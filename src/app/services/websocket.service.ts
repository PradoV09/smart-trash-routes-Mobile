import { Injectable, OnDestroy } from '@angular/core';
import { environment } from '../../environments/environment';

export enum WebSocketState {
  CONNECTING = 'CONNECTING',
  OPEN = 'OPEN',
  CLOSING = 'CLOSING',
  CLOSED = 'CLOSED',
  RECONNECTING = 'RECONNECTING'
}

export interface WebSocketConnection {
  socket: WebSocket;
  state: WebSocketState;
  asignacionId: number;
  reconnectAttempts: number;
  lastConnected: number;
  messageHandler?: (event: MessageEvent) => void;
  errorHandler?: (event: Event) => void;
  closeHandler?: (event: CloseEvent) => void;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private connections = new Map<number, WebSocketConnection>();
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 5000; // 5 seconds
  private maxReconnectDelay = 80000; // 80 seconds
  private connectionTimeout = 10000; // 10 seconds timeout
  private heartbeatInterval = 30000; // 30 seconds heartbeat
  private heartbeatTimers = new Map<number, any>();
  private closingTimeout = 5000; // 5 seconds maximum for disconnection

  constructor() {
    // Service initialized
  }

  /**
   * Connect to WebSocket for a specific assignment
   * Only creates new connection if one doesn't exist or is closed
   */
  connect(asignacionId: number, token: string): Promise<WebSocketConnection> {
    return new Promise((resolve, reject) => {
      // Check if connection already exists and is in a valid state
      const existingConnection = this.connections.get(asignacionId);
      if (existingConnection) {
        switch (existingConnection.state) {
          case WebSocketState.CONNECTING:
          case WebSocketState.OPEN:
          case WebSocketState.RECONNECTING:
            resolve(existingConnection);
            return;
        }

        // Close existing connection if it's in a terminal state
        if (existingConnection.socket) {
          this.forceCloseConnection(existingConnection, 'Replacing with new connection');
        }
      }

      // Create new connection
      const connection = this.createConnection(asignacionId, token);
      this.connections.set(asignacionId, connection);

      // Set up connection timeout
      const timeout = setTimeout(() => {
        if (connection.state === WebSocketState.CONNECTING) {
          this.forceCloseConnection(connection, 'Connection timeout');
          reject(new Error(`Connection timeout for assignment ${asignacionId}`));
        }
      }, this.connectionTimeout);

      connection.socket.onopen = () => {
        clearTimeout(timeout);
        connection.state = WebSocketState.OPEN;
        connection.lastConnected = Date.now();
        connection.reconnectAttempts = 0;
        this.startHeartbeat(asignacionId);
        resolve(connection);
      };

      connection.socket.onerror = (error) => {
        clearTimeout(timeout);
        connection.state = WebSocketState.CLOSED;
        if (connection.errorHandler) {
          connection.errorHandler(error);
        }
        reject(error);
      };

      connection.socket.onclose = (event) => {
        clearTimeout(timeout);
        this.stopHeartbeat(asignacionId);

        connection.state = WebSocketState.CLOSED;

        if (connection.closeHandler) {
          connection.closeHandler(event);
        }

        // Attempt reconnection for abnormal closures
        if (this.shouldReconnect(event.code) && connection.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect(connection, token);
        }
      };

      // Start connection
      connection.state = WebSocketState.CONNECTING;
      connection.socket = new WebSocket(connection.socket.url);
    });
  }

  /**
   * Disconnect a specific assignment
   */
  disconnect(asignacionId: number): void {
    const connection = this.connections.get(asignacionId);
    if (connection) {
      this.forceCloseConnection(connection, 'Manual disconnect');
      this.connections.delete(asignacionId);
    }
  }

  /**
   * Disconnect all connections
   */
  async disconnectAll(): Promise<void> {
    console.log('Iniciando desconexión de todas las conexiones WebSocket...');
    const closePromises: Promise<void>[] = [];

    // Create promises for each connection
    this.connections.forEach((connection, asignacionId) => {
      closePromises.push(this.forceCloseConnection(connection, 'Disconnecting all'));
    });

    // Wait for all connections to close with timeout
    try {
      await Promise.race([
        Promise.all(closePromises),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout desconectando')), this.closingTimeout)
        )
      ]);
      console.log('Todas las conexiones WebSocket fueron cerradas exitosamente');
    } catch (error) {
      console.warn('Timeout o error desconectando, forzando limpieza:', error);
      // Force cleanup anyway
      this.connections.forEach((connection, asignacionId) => {
        this.stopHeartbeat(asignacionId);
      });
      this.connections.clear();
    }
  }

  /**
   * Get connection state
   */
  getConnectionState(asignacionId: number): WebSocketState | null {
    const connection = this.connections.get(asignacionId);
    return connection ? connection.state : null;
  }

  /**
   * Get connection
   */
  getConnection(asignacionId: number): WebSocketConnection | null {
    return this.connections.get(asignacionId) || null;
  }

  /**
   * Check if connection is active
   */
  isConnected(asignacionId: number): boolean {
    const connection = this.connections.get(asignacionId);
    return connection ? connection.state === WebSocketState.OPEN : false;
  }

  /**
   * Set message handler for a connection
   */
  setMessageHandler(asignacionId: number, handler: (event: MessageEvent) => void): void {
    const connection = this.connections.get(asignacionId);
    if (connection) {
      connection.messageHandler = handler;
      if (connection.socket) {
        connection.socket.onmessage = handler;
      }
    }
  }

  /**
   * Get all active connections
   */
  getActiveConnections(): number[] {
    const activeConnections: number[] = [];
    this.connections.forEach((connection, asignacionId) => {
      if (connection.state === WebSocketState.OPEN) {
        activeConnections.push(asignacionId);
      }
    });
    return activeConnections;
  }

  /**
   * Create new WebSocket connection
   */
  private createConnection(asignacionId: number, token: string): WebSocketConnection {
    const wsUrl = `${environment.apiConfig.websockets.baseUrl}${environment.apiConfig.websockets.endpoints.asignacion(asignacionId.toString())}?token=${token}`;

    const connection: WebSocketConnection = {
      socket: new WebSocket(wsUrl),
      state: WebSocketState.CLOSED,
      asignacionId,
      reconnectAttempts: 0,
      lastConnected: 0,
      messageHandler: undefined,
      errorHandler: undefined,
      closeHandler: undefined
    };

    return connection;
  }

  /**
   * Force close a connection
   */
  private async forceCloseConnection(connection: WebSocketConnection, reason: string): Promise<void> {
    return new Promise((resolve) => {
      if (!connection.socket) {
        console.log(`WebSocket ${connection.asignacionId}: No hay socket para cerrar`);
        resolve();
        return;
      }

      const readyState = connection.socket.readyState;
      console.log(`WebSocket ${connection.asignacionId}: Estado actual = ${this.getReadyStateText(readyState)}`);

      try {
        // Check if we can close the connection
        if (readyState === WebSocket.OPEN || readyState === WebSocket.CONNECTING) {
          console.log(`WebSocket ${connection.asignacionId}: Cerrando conexión (razón: ${reason})`);

          // Remove all listeners to prevent memory leaks
          connection.socket.onopen = null;
          connection.socket.onmessage = null;
          connection.socket.onclose = null;
          connection.socket.onerror = null;

          // Update state before closing
          connection.state = WebSocketState.CLOSING;

          // Close with proper code and reason
          connection.socket.close(1000, reason);

          console.log(`WebSocket ${connection.asignacionId}: Comando close() enviado correctamente`);
        } else if (readyState === WebSocket.CLOSING) {
          console.log(`WebSocket ${connection.asignacionId}: Ya está cerrándose, esperando...`);
          // Wait a bit for the connection to finish closing
          setTimeout(() => {
            console.log(`WebSocket ${connection.asignacionId}: Espera de cierre completada`);
            resolve();
          }, 1000);
          return;
        } else {
          console.log(`WebSocket ${connection.asignacionId}: Ya está cerrado, ignorando`);
        }

        // Clean up heartbeat
        this.stopHeartbeat(connection.asignacionId);

        // Remove from connections map
        this.connections.delete(connection.asignacionId);

        console.log(`WebSocket ${connection.asignacionId}: Limpieza completada`);
        resolve();

      } catch (error) {
        console.error(`Error cerrando WebSocket ${connection.asignacionId}:`, error);
        // Clean up anyway
        this.stopHeartbeat(connection.asignacionId);
        this.connections.delete(connection.asignacionId);
        resolve(); // resolve without failing
      }
    });
  }

  /**
   * Check if should reconnect based on close code
   */
  private shouldReconnect(code: number): boolean {
    // Reconnect on abnormal closures (1005, 1006) and server errors (4000-4999)
    return code === 1005 || code === 1006 || (code >= 4000 && code < 5000);
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(connection: WebSocketConnection, token: string): void {
    connection.reconnectAttempts++;
    connection.state = WebSocketState.RECONNECTING;

    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, connection.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    setTimeout(() => {
      // Check if assignment still exists before reconnecting
      if (this.connections.has(connection.asignacionId)) {
        this.connect(connection.asignacionId, token).catch(error => {
          // Reconnection failed
        });
      }
    }, delay);
  }

  /**
   * Start heartbeat for connection
   */
  private startHeartbeat(asignacionId: number): void {
    this.stopHeartbeat(asignacionId); // Clear existing heartbeat

    const connection = this.connections.get(asignacionId);
    if (!connection || !connection.socket) return;

    const heartbeatTimer = setInterval(() => {
      if (connection.socket && connection.socket.readyState === WebSocket.OPEN) {
        try {
          connection.socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        } catch (error) {
          this.stopHeartbeat(asignacionId);
        }
      } else {
        this.stopHeartbeat(asignacionId);
      }
    }, this.heartbeatInterval);

    this.heartbeatTimers.set(asignacionId, heartbeatTimer);
  }

  /**
   * Stop heartbeat for connection
   */
  private stopHeartbeat(asignacionId: number): void {
    const timer = this.heartbeatTimers.get(asignacionId);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(asignacionId);
    }
  }

  /**
   * Get human-readable ready state text
   */
  private getReadyStateText(readyState: number): string {
    switch (readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING (0)';
      case WebSocket.OPEN: return 'OPEN (1)';
      case WebSocket.CLOSING: return 'CLOSING (2)';
      case WebSocket.CLOSED: return 'CLOSED (3)';
      default: return `UNKNOWN (${readyState})`;
    }
  }

  /**
   * Cleanup on service destruction
   */
  ngOnDestroy(): void {
    // Best effort cleanup - don't wait to avoid blocking service destruction
    this.disconnectAll().catch(error => {
      console.warn('Error en ngOnDestroy al desconectar WebSockets:', error);
    }).finally(() => {
      // Clear all heartbeat timers regardless of disconnection outcome
      this.heartbeatTimers.forEach(timer => clearInterval(timer));
      this.heartbeatTimers.clear();
    });
  }
}
