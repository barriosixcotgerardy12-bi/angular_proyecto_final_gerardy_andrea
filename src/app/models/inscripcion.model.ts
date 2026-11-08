export interface Inscripcion {
  id: string;             
  estudianteId: string;   
  periodoId: string;      
  cursoIds: string[];     
  jornadaId: string;
  modalidadId: string;
  estado: string;         
  observaciones: string;
  fechaRegistro: string;
}
export const MAX_CURSOS = 6;
export const MAX_CREDITOS = 24;