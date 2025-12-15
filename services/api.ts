import { createClient } from '@supabase/supabase-js';
import { AppData, Appointment, Professional, Service, Work, CareItem, Testimonial } from '../types';

// Keys provided by user
const supabaseUrl = "https://jsfvhgptbtehdarlihvj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzZnZoZ3B0YnRlaGRhcmxpaHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTk0ODYsImV4cCI6MjA4MDk5NTQ4Nn0.y3u1S5OKHNnoEwyZZ8oHHNQVgj5dsYThe2cohH1uIE4";
const supabase = createClient(supabaseUrl, supabaseKey);

// Default profile to fallback if DB is empty
const DEFAULT_PROFILE: Professional = {
  id: "1",
  nome: "Lumina Estética",
  bio: "Bem-vindo ao seu espaço de beleza e autocuidado. Oferecemos tratamentos personalizados para realçar sua melhor versão.",
  fotoPerfil: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=2070&auto=format&fit=crop",
  fotoBio: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop",
  logo: "",
  especializacao: "Estética Avançada",
  endereco: "Av. Paulista, 1000 - São Paulo, SP",
  linkMaps: "",
  whatsapp: "",
  theme: "rose"
};

export const api = {
  fetchData: async (): Promise<AppData> => {
    try {
      // 1. Fetch Profile
      let { data: profileData } = await supabase.from('profile').select('*').single();
      
      // 2. Fetch Services
      const { data: servicesData } = await supabase.from('services').select('*').order('id');
      
      // 3. Fetch Works
      const { data: worksData } = await supabase.from('works').select('*').order('created_at', { ascending: false });
      
      // 4. Fetch Appointments
      const { data: appointmentsData } = await supabase.from('appointments').select('*').order('date_time', { ascending: true });

      // 5. Fetch Testimonials
      const { data: testimonialsData } = await supabase.from('testimonials').select('*');

      // --- MAPPING ---

      const p = profileData || {};
      const professional: Professional = {
        id: p.id ? p.id.toString() : DEFAULT_PROFILE.id,
        nome: p.name || DEFAULT_PROFILE.nome,
        bio: p.bio || DEFAULT_PROFILE.bio,
        fotoPerfil: p.profile_photo_url || DEFAULT_PROFILE.fotoPerfil,
        fotoBio: p.bio_photo_url || DEFAULT_PROFILE.fotoBio,
        logo: p.logo_url || DEFAULT_PROFILE.logo,
        especializacao: p.specialization || DEFAULT_PROFILE.especializacao,
        endereco: p.address || DEFAULT_PROFILE.endereco,
        linkMaps: p.google_maps_link || DEFAULT_PROFILE.linkMaps,
        whatsapp: p.whatsapp || DEFAULT_PROFILE.whatsapp,
        theme: p.theme || 'rose'
      };

      const services: Service[] = (servicesData || []).map((s: any) => ({
        id: s.id.toString(),
        nome: s.name,
        preco: Number(s.price),
        duracao: s.duration_minutes ? `${s.duration_minutes} min` : '30 min',
        postCare: s.post_care
      }));

      const works: Work[] = (worksData || []).map((w: any) => ({
        id: w.id.toString(),
        urlImagem: w.image_url || w.image_before_url, // Fallback
        imageBeforeUrl: w.image_before_url,
        imageAfterUrl: w.image_after_url,
        titulo: w.title
      }));

      const appointments: Appointment[] = (appointmentsData || []).map((a: any) => {
        // Parse date_time string logic if needed, assuming stored as "DD/MM/YYYY (...) - HH:mm"
        const parts = a.date_time ? a.date_time.split(' - ') : ['', ''];
        return {
            id: a.id.toString(),
            data: parts[0] || '',
            hora: parts[1] || '',
            clienteNome: a.client_name,
            clienteTelefone: a.phone,
            servicos: a.service_name ? a.service_name.split(', ') : [], 
            valorTotal: 0
        };
      });
      
      const testimonials: Testimonial[] = (testimonialsData || []).map((t: any) => ({
          id: t.id.toString(),
          clientName: t.client_name,
          text: t.text,
          rating: t.rating
      }));

      return {
        professional,
        services,
        works,
        appointments,
        testimonials,
        careItems: [] // Not using DB for this yet
      };
    } catch (e) {
      console.error("Supabase Load Error", e);
      // Return default structure on failure to prevent crash
      return {
          professional: DEFAULT_PROFILE,
          services: [],
          works: [],
          appointments: [],
          careItems: []
      };
    }
  },

  postData: async (action: string, payload: any) => {
    switch(action) {
      case 'create_appointment':
         // payload: { data, hora, clienteNome, clienteTelefone, servicos, valorTotal }
         const dateTimeStr = `${payload.data} (${payload.weekday || ''}) - ${payload.hora}`;
         
         const { error: aptError } = await supabase.from('appointments').insert({
             client_name: payload.clienteNome,
             phone: payload.clienteTelefone,
             service_name: Array.isArray(payload.servicos) ? payload.servicos.join(', ') : payload.servicos,
             date_time: dateTimeStr
         });
         if (aptError) throw aptError;
         break;

      case 'delete_appointment':
         await supabase.from('appointments').delete().eq('id', payload.id);
         break;

      case 'update_services': {
         const services = payload as Service[];
         
         // 1. Get ALL current IDs from DB
         const { data: dbItems } = await supabase.from('services').select('id');
         const currentDbIds = dbItems ? dbItems.map(x => x.id) : [];

         // 2. Identify IDs coming from Frontend that are REAL (not temp timestamps)
         const payloadRealIds = services
            .filter(s => s.id.length <= 10) // Assuming DB IDs are shorter than timestamp strings
            .map(s => parseInt(s.id));

         // 3. Delete items that are in DB but NOT in the payload (User deleted them)
         const toDelete = currentDbIds.filter(id => !payloadRealIds.includes(id));
         if (toDelete.length > 0) {
             await supabase.from('services').delete().in('id', toDelete);
         }

         // 4. Update or Insert
         for (const s of services) {
             const record = {
                 name: s.nome,
                 price: s.preco,
                 duration_minutes: parseInt(s.duracao) || 30,
                 post_care: s.postCare
             };
             
             const isTempId = s.id.length > 10; 

             if (!isTempId) {
                 await supabase.from('services').update(record).eq('id', parseInt(s.id));
             } else {
                 // Insert NEW item (DB generates ID)
                 await supabase.from('services').insert(record);
             }
         }
         break;
      }

      case 'update_works': {
          const works = payload as Work[];
          
          // 1. Get ALL current IDs from DB
          const { data: dbItems } = await supabase.from('works').select('id');
          const currentDbIds = dbItems ? dbItems.map(x => x.id) : [];

          // 2. Identify Real IDs
          const payloadRealIds = works
             .filter(w => w.id.length <= 10)
             .map(w => parseInt(w.id));

          // 3. Delete items missing from payload
          const toDelete = currentDbIds.filter(id => !payloadRealIds.includes(id));
          if (toDelete.length > 0) {
              await supabase.from('works').delete().in('id', toDelete);
          }

          // 4. Update or Insert
          for (const w of works) {
              const record = {
                  title: w.titulo,
                  image_before_url: w.imageBeforeUrl,
                  image_after_url: w.imageAfterUrl,
                  image_url: w.urlImagem
              };
              
              const isTempId = w.id.length > 10;

              if (!isTempId) {
                  await supabase.from('works').update(record).eq('id', parseInt(w.id));
              } else {
                  await supabase.from('works').insert(record);
              }
          }
          break;
      }

      case 'update_profile':
          const p = payload as Professional;
          // We assume single profile with ID 1. Use Upsert.
          const { error: profError } = await supabase.from('profile').upsert({
              id: 1, // Enforce ID 1
              name: p.nome,
              bio: p.bio,
              specialization: p.especializacao,
              address: p.endereco,
              whatsapp: p.whatsapp,
              profile_photo_url: p.fotoPerfil,
              bio_photo_url: p.fotoBio,
              logo_url: p.logo,
              google_maps_link: p.linkMaps,
              theme: p.theme
          });
          if (profError) throw profError;
          break;
    }
  },
  
  uploadImage: async (file: File): Promise<string> => {
    if (file.size > 5 * 1024 * 1024) throw new Error("Arquivo muito grande. Máximo 5MB.");

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    // Ensure bucket exists in Supabase Storage named 'images' and is public
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, file);

    if (uploadError) {
      console.error(uploadError);
      throw new Error("Erro ao enviar imagem. Verifique se o bucket 'images' existe e é público.");
    }

    const { data } = supabase.storage.from('images').getPublicUrl(fileName);
    return data.publicUrl;
  },

  checkAdminPassword: async (password: string): Promise<boolean> => {
      const { data, error } = await supabase
        .from('profile')
        .select('admin_password')
        .eq('id', 1)
        .single();
      
      if (error || !data) return false;
      return data.admin_password === password;
  }
};