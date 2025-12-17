
import { createClient } from '@supabase/supabase-js';
import { AppData, Appointment, Professional, Service, Work, CareItem, Testimonial } from '../types';

// Keys provided by user
const supabaseUrl = "https://jsfvhgptbtehdarlihvj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzZnZoZ3B0YnRlaGRhcmxpaHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTk0ODYsImV4cCI6MjA4MDk5NTQ4Nn0.y3u1S5OKHNnoEwyZZ8oHHNQVgj5dsYThe2cohH1uIE4";
const supabase = createClient(supabaseUrl, supabaseKey);

// --- CONSTANTS ---
// Users in this list are ALWAYS Super Admins, regardless of DB state (Safety Net)
const ADMIN_WHITELIST = ['charllys777@gmail.com', 'charlys111@gmail.com'];

const DEFAULT_HOURS = {
  'Seg': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
  'Ter': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
  'Qua': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
  'Qui': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
  'Sex': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
  'Sáb': ['09:00', '10:00', '11:00', '12:00'],
  'Dom': []
};

const DEFAULT_PROFILE: Professional = {
  id: "temp",
  nome: "Novo Estúdio",
  bio: "Bem-vindo ao seu novo espaço. Configure seu perfil no painel.",
  fotoPerfil: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=2070&auto=format&fit=crop",
  fotoBio: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop",
  logo: "",
  especializacao: "Estética & Beleza",
  endereco: "",
  linkMaps: "",
  whatsapp: "",
  theme: "rose",
  status: 'active',
  slug: '',
  workHours: DEFAULT_HOURS
};

export const api = {
  // --- AUTH ---
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

  // --- ADMIN LOGIC ---
  isSuperAdmin: async (userId: string, userEmail?: string): Promise<boolean> => {
      // 1. Whitelist Check (Priority)
      if (userEmail && ADMIN_WHITELIST.includes(userEmail)) {
        // Self-Healing: Ensure DB reflects this permission
        try {
            const { data } = await supabase.from('profile').select('id, is_super_admin').eq('user_id', userId).maybeSingle();
            
            if (!data) {
                // User doesn't exist in profile table yet. Create them.
                await supabase.from('profile').insert({
                    user_id: userId,
                    is_super_admin: true,
                    status: 'active',
                    name: 'Super Admin',
                    work_hours: DEFAULT_HOURS
                });
            } else if (!data.is_super_admin) {
                // User exists but flag is false. Update it.
                await supabase.from('profile').update({ is_super_admin: true }).eq('user_id', userId);
            }
        } catch (e) {
            console.warn("Auto-fix admin failed (likely network)", e);
        }
        return true;
      }

      // 2. Database Check (For admins created via dashboard)
      try {
        const { data, error } = await supabase.from('profile').select('is_super_admin').eq('user_id', userId).single();
        if (error || !data) return false;
        return !!data.is_super_admin;
      } catch (e) {
        return false;
      }
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
      // 1. Create Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({ 
          email, password, options: { data: { display_name: name } }
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar usuário.");

      // 2. Insert Profile as Admin immediately
      const { error: profileError } = await supabase.from('profile').insert({
          user_id: authData.user.id, name: name, is_super_admin: true, status: 'active', work_hours: DEFAULT_HOURS
      });

      if (profileError) {
          // If insert fails (maybe trigger collision), try update
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

      // UUID Regex
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdOrSlug);

      if (isUuid) {
          const { data } = await supabase.from('profile').select('*').eq('user_id', userIdOrSlug).maybeSingle();
          profileData = data;
      } else {
          // It's a slug, fetch by slug to find UUID
          const { data } = await supabase.from('profile').select('*').eq('slug', userIdOrSlug).maybeSingle();
          if (data) {
              profileData = data;
              userId = data.user_id; 
          } else {
               // Slug not found
               console.warn("Slug not found:", userIdOrSlug);
               return { professional: { ...DEFAULT_PROFILE, id: 'temp' }, services: [], works: [], appointments: [], careItems: [], testimonials: [] };
          }
      }

      // If we have a UUID but no profile row yet (first login), return defaults so they can "Create" via dashboard save
      if (!profileData && isUuid) {
          return { professional: { ...DEFAULT_PROFILE, id: userId }, services: [], works: [], appointments: [], careItems: [], testimonials: [] };
      }

      if (!profileData) {
         return { professional: DEFAULT_PROFILE, services: [], works: [], appointments: [], careItems: [], testimonials: [] };
      }

      const targetId = profileData.user_id;

      // Load related data
      const [servicesRes, worksRes, aptRes, testRes] = await Promise.all([
          supabase.from('services').select('*').eq('user_id', targetId).order('id'),
          supabase.from('works').select('*').eq('user_id', targetId).order('created_at', { ascending: false }),
          supabase.from('appointments').select('*').eq('user_id', targetId).order('date_time', { ascending: true }),
          supabase.from('testimonials').select('*').eq('user_id', targetId)
      ]);

      // --- MAPPERS (Safely convert DB snake_case to App camelCase) ---
      
      const services = (servicesRes.data || []).map((s: any) => ({
        id: s.id.toString(),
        nome: s.name,
        preco: Number(s.price),
        duracao: s.duration_minutes ? `${s.duration_minutes} min` : '30 min',
        postCare: s.post_care
      }));

      const works = (worksRes.data || []).map((w: any) => ({
        id: w.id.toString(),
        urlImagem: w.image_url || w.image_before_url, // Fallback
        imageBeforeUrl: w.image_before_url,
        imageAfterUrl: w.image_after_url,
        titulo: w.title
      }));

      const appointments = (aptRes.data || []).map((a: any) => {
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

      const testimonials = (testRes.data || []).map((t: any) => ({
          id: t.id.toString(),
          clientName: t.client_name,
          text: t.text,
          rating: t.rating
      }));

      return {
          professional: {
            id: profileData.id?.toString() || userId,
            nome: profileData.name || DEFAULT_PROFILE.nome,
            bio: profileData.bio || DEFAULT_PROFILE.bio,
            fotoPerfil: profileData.profile_photo_url || DEFAULT_PROFILE.fotoPerfil,
            fotoBio: profileData.bio_photo_url || DEFAULT_PROFILE.fotoBio,
            logo: profileData.logo_url || DEFAULT_PROFILE.logo,
            especializacao: profileData.specialization || DEFAULT_PROFILE.especializacao,
            endereco: profileData.address || DEFAULT_PROFILE.endereco,
            linkMaps: profileData.google_maps_link || DEFAULT_PROFILE.linkMaps,
            whatsapp: profileData.whatsapp || DEFAULT_PROFILE.whatsapp,
            theme: profileData.theme || 'rose',
            status: profileData.status || 'active',
            isSuperAdmin: profileData.is_super_admin || false,
            slug: profileData.slug || '',
            workHours: profileData.work_hours || DEFAULT_HOURS
          },
          services,
          works,
          appointments,
          testimonials,
          careItems: []
      };

    } catch (e) {
      console.error("Fetch Data Error", e);
      throw e; 
    }
  },

  // --- SAVING ---
  postData: async (action: string, payload: any, userId: string) => {
    if (!userId) throw new Error("Usuário não autenticado");

    try {
        switch(action) {
        case 'create_appointment': {
            const dateTimeStr = `${payload.data} (${payload.weekday || ''}) - ${payload.hora}`;
            const { error } = await supabase.from('appointments').insert({
                user_id: userId,
                client_name: payload.clienteNome,
                phone: payload.clienteTelefone,
                service_name: Array.isArray(payload.servicos) ? payload.servicos.join(', ') : payload.servicos,
                date_time: dateTimeStr
            });
            if (error) throw error;
            break;
        }
        case 'delete_appointment': {
            await supabase.from('appointments').delete().eq('id', payload.id).eq('user_id', userId);
            break;
        }
        case 'update_services': {
             const services = payload as Service[];
             
             for (const s of services) {
                 const dbPayload = {
                     user_id: userId,
                     name: s.nome,
                     price: s.preco,
                     duration_minutes: parseInt(s.duracao) || 30,
                     post_care: s.postCare
                 };
                 
                 if (s.id.startsWith('temp_')) {
                     await supabase.from('services').insert(dbPayload);
                 } else {
                     await supabase.from('services').update(dbPayload).eq('id', s.id).eq('user_id', userId);
                 }
             }
             // Optional: Handle deletion logic here or via separate endpoint as currently implemented in UI
             break;
        }
        case 'update_works': {
             const works = payload as Work[];
             for (const w of works) {
                 const dbPayload = {
                     user_id: userId,
                     title: w.titulo,
                     image_before_url: w.imageBeforeUrl,
                     image_after_url: w.imageAfterUrl,
                     image_url: w.urlImagem
                 };
                 if (w.id.startsWith('temp_')) {
                     await supabase.from('works').insert(dbPayload);
                 } else {
                     await supabase.from('works').update(dbPayload).eq('id', w.id).eq('user_id', userId);
                 }
             }
             break;
        }
        case 'update_testimonials': {
             const items = payload as Testimonial[];
             for (const t of items) {
                 const dbPayload = {
                     user_id: userId,
                     client_name: t.clientName,
                     text: t.text,
                     rating: t.rating
                 };
                 if (t.id.startsWith('temp_')) {
                     await supabase.from('testimonials').insert(dbPayload);
                 } else {
                     await supabase.from('testimonials').update(dbPayload).eq('id', t.id).eq('user_id', userId);
                 }
             }
             break;
        }
        case 'update_profile': {
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
  }
};
