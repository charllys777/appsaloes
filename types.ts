export interface Professional {
  id: string;
  nome: string;
  bio: string;
  fotoPerfil: string; // Header background
  fotoBio: string; // "Who am I" photo
  logo: string;
  especializacao: string;
  endereco: string;
  linkMaps: string;
  whatsapp: string; // Profissional's phone
  theme?: 'rose' | 'purple' | 'luxury' | 'ocean' | 'peach' | 'slate' | 'forest';
}

export interface Service {
  id: string; // Unique ID helpful for React keys
  nome: string;
  preco: number;
  duracao: string; // e.g., "60 min"
  postCare?: string; // New field for post-procedure care
}

export interface Work {
  id: string;
  urlImagem: string; // For backward compatibility if needed, though we use before/after now
  imageBeforeUrl?: string;
  imageAfterUrl?: string;
  titulo: string;
}

export interface Appointment {
  id: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:mm
  clienteNome: string;
  clienteTelefone: string;
  servicos: string[]; // List of service names
  valorTotal: number;
  status?: 'confirmed' | 'pending';
}

export interface CareItem {
  id: string;
  texto: string;
  serviceId?: string;
}

export interface Testimonial {
  id: string;
  clientName: string;
  text: string;
  rating: number;
}

export interface DaySlot {
  date: string;
  weekday: string;
  fullDate: string;
  times: string[];
}

export interface UserData {
  name: string;
  phone: string;
}

export interface AppData {
  professional: Professional;
  services: Service[];
  works: Work[];
  appointments: Appointment[];
  careItems: CareItem[];
  testimonials?: Testimonial[];
}

// API Response Wrappers
export interface ApiResponse {
  status: 'success' | 'error';
  data?: AppData;
  message?: string;
}