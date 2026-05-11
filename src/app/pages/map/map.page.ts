import { Component, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { addIcons } from 'ionicons';
import { arrowBackOutline, locateOutline, moonOutline, sunnyOutline, searchOutline, closeOutline, gitBranchOutline, trashOutline, navigateOutline } from 'ionicons/icons';
import { AsignacionesService } from '../../services/asignaciones.service';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, NgIf, FormsModule]
})
export class MapPage implements OnDestroy {
  @ViewChild('mapElement', { static: false }) mapElement!: ElementRef;
  private map!: L.Map;
  private userMarker?: L.Marker;
  private darkLayer!: L.TileLayer;
  private lightLayer!: L.TileLayer;
  private routeLayer?: L.Polyline;
  private recorridoLayer?: L.Polyline;
  private routePoints: L.LatLng[] = [];
  private routeMarkers: L.Marker[] = [];
  private userMarkers: L.Marker[] = [];

  isDark = false;
  coordsInfo = '';
  mapLoading = true;
  searchQuery = '';
  searchVisible = false;
  routeMode = false;
  routeInfo = '';
  hasUserMarkers = false;

  private readonly CENTER: L.LatLngExpression = [3.8772, -77.0282];

  constructor(private asignacionesService: AsignacionesService) {
    addIcons({ arrowBackOutline, locateOutline, moonOutline, sunnyOutline, searchOutline, closeOutline, gitBranchOutline, trashOutline, navigateOutline });
    this.isDark = localStorage.getItem('theme') === 'dark';
  }

  ionViewWillEnter() {
    this.mapLoading = true;
  }

  ionViewDidEnter() {
    setTimeout(() => this.initMap(), 600);
  }

  ionViewWillLeave() {
    if (this.map) {
      this.map.remove();
      (this.map as any) = null;
    }
  }

  ngOnDestroy() {
    if (this.map) this.map.remove();
  }

  private async initMap() {
    if (!this.mapElement) {
      setTimeout(() => this.initMap(), 500);
      return;
    }

    if (this.map) {
      try { this.map.remove(); } catch (e) {}
    }

    try {
      this.map = L.map(this.mapElement.nativeElement, {
        center: this.CENTER,
        zoom: 13,
        zoomControl: false,
        attributionControl: true
      });
    } catch (err) {
      console.error('Error creating Leaflet instance:', err);
      return;
    }

    this.lightLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Leaflet | © OpenStreetMap',
      maxZoom: 19
    });

    this.darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: 'Leaflet | © OpenStreetMap © CARTO',
      maxZoom: 19
    });

    if (this.isDark) {
      this.darkLayer.addTo(this.map);
    } else {
      this.lightLayer.addTo(this.map);
    }

    this.map.whenReady(() => {
      setTimeout(() => {
        this.mapLoading = false;
        if (this.map) {
          this.map.invalidateSize();
          setTimeout(() => this.map.invalidateSize(), 400);
        }
      }, 300);
    });

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (this.routeMode) {
        this.addRoutePoint(e.latlng);
        return;
      }

      const marker = L.marker([lat, lng]).addTo(this.map);
      marker.bindPopup(
        `<div style="font-family: sans-serif; font-size: 13px;">
          <b>📍 Marcador</b><br>
          Lat: ${lat.toFixed(5)}<br>
          Lng: ${lng.toFixed(5)}
        </div>`
      ).openPopup();
      this.userMarkers.push(marker);
      this.hasUserMarkers = true;
      this.coordsInfo = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    });

    // Cargar ruta del recorrido activo
    await this.cargarRutaActiva();
  }

  // Carga la ruta del recorrido activo desde la API externa
  private async cargarRutaActiva() {
    try {
      const asignaciones = await this.asignacionesService.getAsignaciones();
      const enCurso = asignaciones.find(a => a.estado === 'en_curso' && a.id_recorrido);
      if (!enCurso || !enCurso.id_recorrido) return;

      const posiciones = await this.asignacionesService.getPosicionesRecorrido(enCurso.id_recorrido);
      if (!posiciones || posiciones.length < 2) return;

      const latlngs: L.LatLngExpression[] = posiciones.map(p => [p.lat, p.lon]);

      if (this.recorridoLayer) {
        this.map.removeLayer(this.recorridoLayer);
      }

      this.recorridoLayer = L.polyline(latlngs, {
        color: '#10B981',
        weight: 5,
        opacity: 0.9,
      }).addTo(this.map);

      // Marcador inicio
      const inicioIcon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;background:#10B981;border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
        iconSize: [14, 14], iconAnchor: [7, 7]
      });
      L.marker(latlngs[0] as L.LatLngExpression, { icon: inicioIcon })
        .addTo(this.map)
        .bindPopup('🟢 Inicio del recorrido');

      // Marcador último punto
      const ultimoIcon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;background:#0A4174;border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
        iconSize: [14, 14], iconAnchor: [7, 7]
      });
      L.marker(latlngs[latlngs.length - 1] as L.LatLngExpression, { icon: ultimoIcon })
        .addTo(this.map)
        .bindPopup('📍 Última posición');

      this.map.fitBounds(this.recorridoLayer.getBounds(), { padding: [40, 40] });
      this.routeInfo = `Recorrido activo: ${posiciones.length} puntos registrados`;

    } catch (err) {
      console.error('Error cargando ruta activa', err);
    }
  }

  limpiarMarcadores() {
    this.userMarkers.forEach(m => this.map.removeLayer(m));
    this.userMarkers = [];
    this.hasUserMarkers = false;
    this.coordsInfo = '';
  }

  goToMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const latlng: L.LatLngExpression = [latitude, longitude];

        if (this.userMarker) {
          this.userMarker.setLatLng(latlng);
        } else {
          const userIcon = L.divIcon({
            className: '',
            html: `<div style="width:20px;height:20px;background:#0A4174;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(10,65,116,0.3);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          this.userMarker = L.marker(latlng, { icon: userIcon }).addTo(this.map);
          this.userMarker.bindPopup('<b>📍 Tu ubicación</b>').openPopup();
        }

        this.map.flyTo(latlng, 15, { animate: true, duration: 1.2 });
        this.coordsInfo = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      },
      (err) => console.error('GPS error', err),
      { enableHighAccuracy: true }
    );
  }

  toggleMapTheme() {
    this.isDark = !this.isDark;
    document.body.classList.toggle('dark-theme', this.isDark);
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');

    if (this.map) {
      if (this.isDark) {
        this.map.removeLayer(this.lightLayer);
        this.darkLayer.addTo(this.map);
      } else {
        this.map.removeLayer(this.darkLayer);
        this.lightLayer.addTo(this.map);
      }
    }
  }

  toggleSearch() {
    this.searchVisible = !this.searchVisible;
    if (!this.searchVisible) this.searchQuery = '';
  }

  async searchPlace() {
    if (!this.searchQuery.trim()) return;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.searchQuery)}&limit=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
      const data = await res.json();

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latlng: L.LatLngExpression = [parseFloat(lat), parseFloat(lon)];

        const searchIcon = L.divIcon({
          className: '',
          html: `<div style="width:14px;height:14px;background:#4E8EA2;border:2px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
          iconSize: [14, 14], iconAnchor: [7, 7]
        });

        const marker = L.marker(latlng, { icon: searchIcon }).addTo(this.map);
        marker.bindPopup(`<div style="font-family:sans-serif;font-size:12px;"><b>🔍 ${display_name.split(',')[0]}</b></div>`).openPopup();
        this.map.flyTo(latlng, 15, { animate: true, duration: 1.2 });
        this.coordsInfo = `${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`;
        this.searchVisible = false;
        this.searchQuery = '';
      }
    } catch (err) {
      console.error('Search error', err);
    }
  }

  toggleRouteMode() {
    this.routeMode = !this.routeMode;
    if (!this.routeMode) {
      this.clearRoute();
    } else {
      this.routeInfo = 'Toca 2 puntos en el mapa para trazar la ruta';
    }
  }

  private addRoutePoint(latlng: L.LatLng) {
    if (this.routePoints.length >= 2) this.clearRoute();

    this.routePoints.push(latlng);

    const pointIcon = L.divIcon({
      className: '',
      html: `<div style="width:16px;height:16px;background:${this.routePoints.length === 1 ? '#10B981' : '#EF4444'};border:2px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [16, 16], iconAnchor: [8, 8]
    });

    const marker = L.marker(latlng, { icon: pointIcon }).addTo(this.map);
    marker.bindPopup(this.routePoints.length === 1 ? '🟢 Inicio' : '🔴 Destino').openPopup();
    this.routeMarkers.push(marker);

    if (this.routePoints.length === 2) {
      this.drawRoute();
    } else {
      this.routeInfo = 'Ahora toca el punto destino';
    }
  }

  private drawRoute() {
    if (this.routeLayer) this.map.removeLayer(this.routeLayer);

    this.routeLayer = L.polyline(this.routePoints, {
      color: '#0A4174', weight: 4, opacity: 0.8, dashArray: '10, 5'
    }).addTo(this.map);

    this.map.fitBounds(this.routeLayer.getBounds(), { padding: [40, 40] });
    const dist = this.routePoints[0].distanceTo(this.routePoints[1]);
    this.routeInfo = `Distancia aproximada: ${(dist / 1000).toFixed(2)} km`;
  }

  private clearRoute() {
    this.routePoints = [];
    this.routeMarkers.forEach(m => this.map.removeLayer(m));
    this.routeMarkers = [];
    if (this.routeLayer) {
      this.map.removeLayer(this.routeLayer);
      this.routeLayer = undefined;
    }
    this.routeInfo = '';
  }

  goBack() { window.location.href = '/home'; }
}