import { ItemCatalogo } from '../models/catalogo.model';

export function nombreDe(lista: ItemCatalogo[], id: string): string {
  return lista.find(x => x.id === id)?.nombre ?? id;
}