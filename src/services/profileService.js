import { supabase } from '../lib/supabaseClient';

export const getProfile = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
};

export const updateProfile = async (userId, updates) => {
    try {
        const { error } = await supabase
            .from('profiles')
            .upsert({ id: userId, ...updates, updated_at: new Date() });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error updating profile:', error);
        return false;
    }
};

export const uploadAvatar = async (userId, file) => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error uploading avatar:', error);
        return null;
    }
};

export const updateUserPassword = async (newPassword) => {
    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error updating password:', error);
        return false;
    }
};
