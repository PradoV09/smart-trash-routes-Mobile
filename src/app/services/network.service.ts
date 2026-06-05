import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class NetworkService {
  private onlineSubject = new BehaviorSubject<boolean>(navigator.onLine);

  readonly online$: Observable<boolean> = this.onlineSubject.asObservable();
  readonly offline$: Observable<boolean> = this.online$.pipe(map(v => !v));

  constructor() {
    merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).subscribe(status => {
      console.log(`[Network] Estado: ${status ? 'ONLINE' : 'OFFLINE'}`);
      this.onlineSubject.next(status);
    });
  }

  get isOnline(): boolean {
    return this.onlineSubject.getValue();
  }

  get isOffline(): boolean {
    return !this.isOnline;
  }
}
