import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Asignacion } from '../../services/asignaciones.service';

@Component({
  selector: 'app-asignacion-card',
  templateUrl: './asignacion-card.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class AsignacionCardComponent {
  @Input() asignacion!: Asignacion;
  @Output() iniciar = new EventEmitter<string | number>();
  @Output() finalizar = new EventEmitter<string | number>();

  getBadgeClass(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'badge-warning';
      case 'en_curso': return 'badge-info';
      case 'completada': return 'badge-success';
      case 'cancelada': return 'badge-error';
      default: return 'badge-info';
    }
  }

  formatEstado(estado: string): string {
    return estado.replace('_', ' ').toUpperCase();
  }

  onIniciar() {
    this.iniciar.emit(this.asignacion.id);
  }

  onFinalizar() {
    this.finalizar.emit(this.asignacion.id);
  }
}
