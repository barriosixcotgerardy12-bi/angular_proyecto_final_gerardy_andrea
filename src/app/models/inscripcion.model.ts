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