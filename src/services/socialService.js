import { supabase } from '../lib/supabaseClient';

export const searchUsers = async (query) => {
    try {
        if (!query || query.length < 3) return [];

        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, bio, email')
            .or(`username.ilike.%${query}%,full_name.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(10);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error searching users:', error);
        return [];
    }
};

export const followUser = async (currentUserId, targetUserId) => {
    try {
        const { error } = await supabase
            .from('relationships')
            .insert([{ follower_id: currentUserId, following_id: targetUserId }]);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error following user:', error);
        return false;
    }
};

export const unfollowUser = async (currentUserId, targetUserId) => {
    try {
        const { error } = await supabase
            .from('relationships')
            .delete()
            .match({ follower_id: currentUserId, following_id: targetUserId });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error unfollowing user:', error);
        return false;
    }
};

export const checkIsFollowing = async (currentUserId, targetUserId) => {
    try {
        const { data, error } = await supabase
            .from('relationships')
            .select('id')
            .match({ follower_id: currentUserId, following_id: targetUserId })
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "No rows returned", which is fine
        return !!data;
    } catch (error) {
        return false;
    }
};

export const getSocialStats = async (userId) => {
    try {
        // Count Followers
        const { count: followersCount, error: errFollowers } = await supabase
            .from('relationships')
            .select('id', { count: 'exact', head: true })
            .eq('following_id', userId);

        // Count Following
        const { count: followingCount, error: errFollowing } = await supabase
            .from('relationships')
            .select('id', { count: 'exact', head: true })
            .eq('follower_id', userId);

        if (errFollowers || errFollowing) throw (errFollowers || errFollowing);

        return {
            followers: followersCount || 0,
            following: followingCount || 0
        };
    } catch (error) {
        console.error('Error fetching stats:', error);
        return { followers: 0, following: 0 };
    }
};

export const getLeaderboard = async () => {
    try {
        const { data, error } = await supabase
            .from('leaderboard')
            .select('*')
            .limit(20); // Top 20

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
};

// --- LIKES ---

export const toggleLike = async (activityId, userId) => {
    try {
        // Check if liked
        const { data } = await supabase
            .from('likes')
            .select('id')
            .match({ activity_id: activityId, user_id: userId })
            .single();

        if (data) {
            // Unlike
            await supabase.from('likes').delete().eq('id', data.id);
            return false; // Liked = false
        } else {
            // Like
            await supabase.from('likes').insert([{ activity_id: activityId, user_id: userId }]);
            return true; // Liked = true
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        return null;
    }
};

export const getLikeStatus = async (activityId, userId) => {
    try {
        const { count, error } = await supabase
            .from('likes')
            .select('id', { count: 'exact', head: true })
            .eq('activity_id', activityId);

        let isLiked = false;
        if (userId) {
            const { data } = await supabase
                .from('likes')
                .select('id')
                .match({ activity_id: activityId, user_id: userId })
                .single();
            isLiked = !!data;
        }

        return { count: count || 0, isLiked };
    } catch (error) {
        return { count: 0, isLiked: false };
    }
};

// --- COMMENTS ---

export const addComment = async (activityId, userId, content) => {
    try {
        const { data, error } = await supabase
            .from('comments')
            .insert([{ activity_id: activityId, user_id: userId, content }])
            .select()
            .single();
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error adding comment:', error);
        return null;
    }
};

export const getComments = async (activityId) => {
    try {
        const { data, error } = await supabase
            .from('comments_with_profiles') // Use the VIEW
            .select('*')
            .eq('activity_id', activityId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching comments:', error);
        return [];
    }
};
