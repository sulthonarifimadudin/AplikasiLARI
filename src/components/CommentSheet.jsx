import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { getComments, addComment } from '../services/socialService';
import { useAuth } from '../contexts/AuthContext';

const CommentSheet = ({ activityId, onClose }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const commentsEndRef = useRef(null);

    useEffect(() => {
        const fetchComments = async () => {
            const data = await getComments(activityId);
            setComments(data);
            setLoading(false);
        };
        fetchComments();
    }, [activityId]);

    // Auto scroll to bottom
    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        // Optimistic UI could be added here, but for simplicity we await
        const comment = await addComment(activityId, user.id, newComment);

        if (comment) {
            // Need to fetch again or construct the object manually to show profile immediately. 
            // For now let's just re-fetch to be safe and get the View data
            const data = await getComments(activityId);
            setComments(data);
            setNewComment('');
        }
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-md bg-white dark:bg-navy-900 rounded-t-3xl h-[80vh] flex flex-col shadow-2xl animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-navy-800">
                    <h3 className="font-bold text-navy-900 dark:text-white">Komentar</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-full dark:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-navy-500" /></div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 text-sm">
                            Belum ada komentar. Jadilah yang pertama!
                        </div>
                    ) : (
                        comments.map(c => (
                            <div key={c.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                                    {c.avatar_url ? (
                                        <img src={c.avatar_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-navy-100 flex items-center justify-center font-bold text-navy-600 text-xs">
                                            {c.full_name?.[0] || 'U'}
                                        </div>
                                    )}
                                </div>
                                <div className="bg-gray-50 dark:bg-navy-800 p-3 rounded-2xl rounded-tl-none text-sm dark:text-white">
                                    <p className="font-bold text-xs mb-0.5 text-navy-900 dark:text-navy-200">{c.full_name || 'User'}</p>
                                    <p>{c.content}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">{new Date(c.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={commentsEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-100 dark:border-navy-800 bg-white dark:bg-navy-900 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Tulis komentar..."
                            disabled={submitting}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-800 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || submitting}
                            className="bg-navy-600 disabled:bg-gray-300 text-white p-3 rounded-xl transition-all"
                        >
                            {submitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CommentSheet;
