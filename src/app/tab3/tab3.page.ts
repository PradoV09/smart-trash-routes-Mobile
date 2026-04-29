import { Component } from '@angular/core';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonProgressBar, IonGrid, IonRow, IonCol, 
  IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle,
  IonButton, IonLabel, AlertController
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonProgressBar, IonGrid, IonRow, IonCol,
    IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle,
    IonButton, IonLabel
  ],
})
export class Tab3Page {
  constructor(private alertCtrl: AlertController) {}

  async finalizarTurno() {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar',
      message: '¿Estás seguro de que deseas finalizar tu turno?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Finalizar',
          handler: () => {
            console.log('Turno finalizado');
          }
        }
      ]
    });
    await alert.present();
  }
}
