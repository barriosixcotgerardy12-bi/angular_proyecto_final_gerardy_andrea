import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PantallaService {
  private observador = inject(BreakpointObserver);
  readonly movil = toSignal(
    this.observador.observe('(max-width: 700px)').pipe(map(r => r.matches)),
    { initialValue: false }
  );
}