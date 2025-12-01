
import React, { useState, useRef, useEffect } from 'react';
import { PostIdea } from '../../types';

const SendIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
);

interface CommentModalProps {
    post: PostIdea;
    onClose: () => void;
    onAddComment: (commentText: string) => void;
}

const CommentModal: React.FC<CommentModalProps> = ({ post, onClose, onAddComment }) => {
    const [newComment, setNewComment] = useState('');
    const commentsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [post.comments]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(newComment);
            setNewComment('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-secondary rounded-lg shadow-xl w-full max-w-lg h-[80vh] max-h-[600px] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-primary">
                    <h2 className="text-xl font-bold text-light">Comentários em "{post.title}"</h2>
                    <button onClick={onClose} className="text-2xl text-gray-dark hover:text-light">&times;</button>
                </div>

                {/* Comments List */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {/* FIX: Safely map over comments, providing a fallback empty array if comments are undefined. */}
                    {(post.comments || []).map(comment => (
                        <div key={comment.id} className="flex items-start space-x-3">
                            <img src={comment.avatar} alt={comment.author} className="w-10 h-10 rounded-full" />
                            <div className="bg-primary p-3 rounded-lg flex-1">
                                <p className="font-semibold text-accent text-sm">{comment.author}</p>
                                <p className="text-gray-light text-sm mt-1">{comment.text}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={commentsEndRef} />
                </div>

                {/* Input Form */}
                <div className="p-4 border-t border-primary">
                    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Adicione um comentário..."
                            className="flex-1 bg-primary p-2 rounded-full border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                        />
                        <button type="submit" className="bg-accent p-2 rounded-full text-light hover:bg-blue-500 transition-colors" disabled={!newComment.trim()}>
                            <SendIcon className="w-5 h-5"/>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CommentModal;