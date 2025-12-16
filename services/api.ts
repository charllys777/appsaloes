
import { createClient } from '@supabase/supabase-js';
import { AppData, Appointment, Professional, Service, Work, CareItem, Testimonial } from '../types';

// Keys provided by user
const supabaseUrl = "https://jsfvhgptbtehdarlihvj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzZnZoZ3B0YnRlaGRhcmxpaHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTk0ODYsImV4cCI6MjA4MDk5NTQ4Nn0.y3u1S5OKHNnoEwyZZ8oHHNQVgj5dsYThe2cohH1uIE4";
const supabase = createClient(supabaseUrl, supabaseKey);

// Default Standard Hours
const DEFAULT_HOURS = {
  'Seg': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
  'Ter': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
  'Qua': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
  'Qui': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
  'Sex': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
  'Sáb': ['09:00', '10:00', '11:00', '12:00'],
  'Dom': []
};

// Default profile
const DEFAULT_PROFILE: Professional = {
  id: "temp",
  nome: "Seu Estúdio",
  bio: "Bem-vindo ao seu novo espaço. Configure seu perfil no painel de administração.",
  fotoPerfil: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=2070&auto=format&fit=crop",
  fotoBio: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop",
  logo: "",
  especializacao: "Estética & Beleza",
  endereco: "Endereço do Estúdio",
  linkMaps: "",
  whatsapp: "",
  theme: "rose",
  status: 'active',
  slug: '',
  workHours: DEFAULT_HOURS
};

export const api = {
  // --- AUTHENTICATION ---
  signUp: async (email: string, password: string) => {
    return await supabase.auth.signUp({ email, password });
  },

  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  },

  signOut: async () => {
    return await supabase.auth.signOut();
  },

  getSession: async () => {
    return await supabase.auth.getSession();
  },

  onAuthStateChange: (callback: (event: any, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  // --- SUPER ADMIN ---
  isSuperAdmin: async (userId: string, userEmail?: string): Promise<boolean> => {
      if (userEmail === 'charllys777@gmail.com') return true;
      const { data } = await supabase.from('profile').select('is_super_admin').eq('user_id', userId).single();
      return !!data?.is_super_admin;
  },

  fetchAllProfiles: async () => {
      const { data, error } = await supabase.from('profile').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
  },
  
  fetchAdmins: async () => {
      const { data, error } = await supabase.from('profile').select('*').eq('is_super_admin', true);
      if (error) throw error;
      return data;
  },

  toggleProfileStatus: async (profileId: string, currentStatus: string) => {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const { error } = await supabase.from('profile').update({ status: newStatus }).eq('id', profileId);
      if (error) throw error;
      return newStatus;
  },

  createSuperAdminUser: async (email: string, password: string, name: string) => {
      const { data: authData, error: authError } = await supabase.auth.signUp({ 
          email, password, options: { data: { display_name: name } }
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar usuário.");

      const { error: profileError } = await supabase.from('profile').insert({
          user_id: authData.user.id, name: name, is_super_admin: true, status: 'active'
      });

      if (profileError) {
          await supabase.from('profile').update({ is_super_admin: true }).eq('user_id', authData.user.id);
      }
      return authData;
  },

  // --- DATA FETCHING ---
  fetchData: async (userIdOrSlug?: string): Promise<AppData> => {
    if (!userIdOrSlug) return { professional: DEFAULT_PROFILE, services: [], works: [], appointments: [], careItems: [], testimonials: [] };

    try {
      let userId = userIdOrSlug;
      let profileData = null;

      // UUID check
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdOrSlug);

      if (isUuid) {
          const { data } = await supabase.from('profile').select('*').eq('user_id', userIdOrSlug).single();
          profileData = data;
      } else {
          // If it's a slug, find the real UUID
          const { data } = await supabase.from('profile').select('*').eq('slug', userIdOrSlug).single();
          if (data) {
              profileData = data;
              userId = data.user_id; // CRITICAL: Switch to the real UUID for next queries
          } else {
              // If searching by slug and not found, stop here to avoid UUID errors
              console.warn("Profile not found by slug:", userIdOrSlug);
              return { professional: DEFAULT_PROFILE, services: [], works: [], appointments: [], careItems: [], testimonials: [] };
          }
      }

      // Final check: Do we have a valid UUID to query related tables?
      const targetId = profileData ? profileData.user_id : (isUuid ? userId : null);

      if (!targetId) {
          return { professional: DEFAULT_PROFILE, services: [], works: [], appointments: [], careItems: [], testimonials: [] };
      }
      
      const { data: servicesData } = await supabase.from('services').select('*').eq('user_id', targetId).order('id');
      const { data: worksData } = await supabase.from('works').select('*').eq('user_id', targetId).order('created_at', { ascending: false });
      const { data: appointmentsData } = await supabase.from('appointments').select('*').eq('user_id', targetId).order('date_time', { ascending: true });
      const { data: testimonialsData } = await supabase.from('testimonials').select('*').eq('user_id', targetId);

      // Mapping
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
        theme: p.theme || 'rose',
        status: p.status || 'active',
        isSuperAdmin: p.is_super_admin || false,
        slug: p.slug || '',
        workHours: p.work_hours || DEFAULT_HOURS
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
        urlImagem: w.image_url || w.image_before_url,
        imageBeforeUrl: w.image_before_url,
        imageAfterUrl: w.image_after_url,
        titulo: w.title
      }));

      const appointments: Appointment[] = (appointmentsData || []).map((a: any) => {
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

      return { professional, services, works, appointments, testimonials, careItems: [] };
    } catch (e) {
      console.error("Supabase Load Error", e);
      return { professional: DEFAULT_PROFILE, services: [], works: [], appointments: [], careItems: [], testimonials: [] };
    }
  },

  // --- SAVING DATA ---
  postData: async (action: string, payload: any, userId: string) => {
    if (!userId) throw new Error("Usuário não autenticado");

    try {
        switch(action) {
        case 'create_appointment':
            const dateTimeStr = `${payload.data} (${payload.weekday || ''}) - ${payload.hora}`;
            const { error: aptError } = await supabase.from('appointments').insert({
                user_id: userId,
                client_name: payload.clienteNome,
                phone: payload.clienteTelefone,
                service_name: Array.isArray(payload.servicos) ? payload.servicos.join(', ') : payload.servicos,
                date_time: dateTimeStr
            });
            if (aptError) throw aptError;
            break;

        case 'delete_appointment':
            await supabase.from('appointments').delete().eq('id', payload.id).eq('user_id', userId);
            break;

        case 'update_services': {
            const services = payload as Service[];
            
            // Get current IDs in DB for this user as STRINGs for robust comparison
            const { data: dbItems, error: fetchError } = await supabase.from('services').select('id').eq('user_id', userId);
            if (fetchError) throw fetchError;
            
            const dbIds = dbItems ? dbItems.map(x => x.id.toString()) : [];

            const toInsert: any[] = [];
            const idsToKeep: string[] = [];

            for (const s of services) {
                const idStr = s.id.toString();
                const isTemp = idStr.startsWith('temp_');
                
                if (isTemp) {
                    toInsert.push({
                        user_id: userId,
                        name: s.nome,
                        price: s.preco,
                        duration_minutes: parseInt(s.duracao) || 30,
                        post_care: s.postCare
                    });
                } else {
                    idsToKeep.push(idStr);
                    const { error: updateError } = await supabase.from('services').update({
                        name: s.nome,
                        price: s.preco,
                        duration_minutes: parseInt(s.duracao) || 30,
                        post_care: s.postCare
                    }).eq('id', idStr).eq('user_id', userId);
                    if (updateError) throw updateError;
                }
            }

            // Delete removed items
            const toDelete = dbIds.filter(id => !idsToKeep.includes(id));
            if (toDelete.length > 0) {
                const { error: deleteError } = await supabase.from('services').delete().in('id', toDelete).eq('user_id', userId);
                if (deleteError) throw deleteError;
            }

            // Insert new items
            if (toInsert.length > 0) {
                const { error: insertError } = await supabase.from('services').insert(toInsert);
                if (insertError) throw insertError;
            }
            break;
        }

        case 'update_works': {
            const works = payload as Work[];
            const { data: dbItems, error: fetchError } = await supabase.from('works').select('id').eq('user_id', userId);
            if (fetchError) throw fetchError;

            const dbIds = dbItems ? dbItems.map(x => x.id.toString()) : [];

            const toInsert: any[] = [];
            const idsToKeep: string[] = [];

            for (const w of works) {
                const idStr = w.id.toString();
                const isTemp = idStr.startsWith('temp_');
                
                if (isTemp) {
                    toInsert.push({
                        user_id: userId,
                        title: w.titulo,
                        image_before_url: w.imageBeforeUrl,
                        image_after_url: w.imageAfterUrl,
                        image_url: w.urlImagem
                    });
                } else {
                    idsToKeep.push(idStr);
                    const { error: updateError } = await supabase.from('works').update({
                        title: w.titulo,
                        image_before_url: w.imageBeforeUrl,
                        image_after_url: w.imageAfterUrl,
                        image_url: w.urlImagem
                    }).eq('id', idStr).eq('user_id', userId);
                    if (updateError) throw updateError;
                }
            }

            const toDelete = dbIds.filter(id => !idsToKeep.includes(id));
            if (toDelete.length > 0) {
                const { error: deleteError } = await supabase.from('works').delete().in('id', toDelete).eq('user_id', userId);
                if (deleteError) throw deleteError;
            }
            
            if (toInsert.length > 0) {
                const { error: insertError } = await supabase.from('works').insert(toInsert);
                if (insertError) throw insertError;
            }
            break;
        }

        case 'update_testimonials': {
            const testimonials = payload as Testimonial[];
            const { data: dbItems, error: fetchError } = await supabase.from('testimonials').select('id').eq('user_id', userId);
            if (fetchError) throw fetchError;

            const dbIds = dbItems ? dbItems.map(x => x.id.toString()) : [];
            
            const toInsert: any[] = [];
            const idsToKeep: string[] = [];

            for (const t of testimonials) {
                const idStr = t.id.toString();
                const isTemp = idStr.startsWith('temp_');
                
                if (isTemp) {
                    toInsert.push({
                        user_id: userId,
                        client_name: t.clientName,
                        text: t.text,
                        rating: t.rating
                    });
                } else {
                    idsToKeep.push(idStr);
                    const { error: updateError } = await supabase.from('testimonials').update({
                        client_name: t.clientName,
                        text: t.text,
                        rating: t.rating
                    }).eq('id', idStr).eq('user_id', userId);
                    if (updateError) throw updateError;
                }
            }

            const toDelete = dbIds.filter(id => !idsToKeep.includes(id));
            if (toDelete.length > 0) {
                const { error: deleteError } = await supabase.from('testimonials').delete().in('id', toDelete).eq('user_id', userId);
                if (deleteError) throw deleteError;
            }

            if (toInsert.length > 0) {
                 const { error: insertError } = await supabase.from('testimonials').insert(toInsert);
                 if (insertError) throw insertError;
            }
            break;
        }

        case 'update_profile':
            const p = payload as Professional;
            const profileData = {
                user_id: userId,
                name: p.nome,
                bio: p.bio,
                specialization: p.especializacao,
                address: p.endereco,
                whatsapp: p.whatsapp,
                profile_photo_url: p.fotoPerfil,
                bio_photo_url: p.fotoBio,
                logo_url: p.logo,
                google_maps_link: p.linkMaps,
                theme: p.theme,
                slug: p.slug,
                work_hours: p.workHours
            };

            const { error } = await supabase.from('profile').upsert(profileData, { onConflict: 'user_id' });
            if (error) throw error;
            break;
        }
    } catch (e: any) {
        console.error("API POST Error:", e);
        throw e;
    }
  },
  
  uploadImage: async (file: File): Promise<string> => {
    if (file.size > 5 * 1024 * 1024) throw new Error("Arquivo muito grande. Máximo 5MB.");
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);
    if (uploadError) throw new Error("Erro ao enviar imagem. Verifique o bucket.");
    const { data } = supabase.storage.from('images').getPublicUrl(fileName);
    return data.publicUrl;
  },

  checkAdminPassword: async (password: string): Promise<boolean> => true
};
