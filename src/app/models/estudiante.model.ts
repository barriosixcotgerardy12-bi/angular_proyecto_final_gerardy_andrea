export interface Contacto {
  numero: string;
  tipo: string;     
  activo: boolean;
}

export interface Estudiante {
  id: string;               
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;  
  genero: string;           
  correo: string;
  direccion: string;
  carreraId: string;       
  observaciones: string;    
  contactos: Contacto[];    
  fechaRegistro: string;    
}