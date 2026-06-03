'use client';

import React, { useState } from 'react';
import { Send, Loader2, MessageCircle } from 'lucide-react';

/**
 * QuotationComments - Comments thread for quotation discussions
 * Allows buyers and sellers to communicate about quotations
 */
export default function QuotationComments({
  quotationId,
  comments = [],
  onAddComment = async () => {},
  currentUserId,
  loading = false,
  readOnly = false,
}) {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    await onAddComment({
      content: newComment,
      quotationId,
    });
    setSubmitting(false);
    setNewComment('');
  };

  const isOwnComment = (userId) => userId === currentUserId;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-2">
          <MessageCircle className="h-5 w-5 text-role-accent" />
          Comments & Discussion
        </h3>
        <p className="text-xs text-muted-foreground">
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </p>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin text-role-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Loading comments...</p>
            </div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 bg-card rounded-lg border border-border text-muted-foreground text-xs">
            No comments yet. Start a conversation!
          </div>
        ) : (
          comments.map(comment => (
            <div
              key={comment.id}
              className={`p-3 rounded-lg border transition ${
                isOwnComment(comment.userId)
                  ? 'bg-role-primary/5 border-role-primary/20 ml-8'
                  : 'bg-card border-border mr-8'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-sm text-foreground">
                    {comment.userName}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {comment.userRole && (
                      <span className="capitalize">
                        {comment.userRole} •{' '}
                      </span>
                    )}
                    {new Date(comment.createdAt).toLocaleString()}
                  </p>
                </div>
                {isOwnComment(comment.userId) && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-role-primary/10 text-role-primary">
                    You
                  </span>
                )}
              </div>

              <p className="text-sm text-foreground leading-relaxed break-words whitespace-pre-wrap">
                {comment.content}
              </p>

              {comment.attachments && comment.attachments.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/50 flex flex-wrap gap-2">
                  {comment.attachments.map((att, idx) => (
                    <a
                      key={idx}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition"
                    >
                      📎 {att.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Comment Input */}
      {!readOnly && (
        <form onSubmit={handleSubmit} className="space-y-2 pt-4 border-t border-border">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment or ask a question..."
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-role-primary/40 transition resize-none"
            rows={3}
            disabled={submitting}
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setNewComment('')}
              disabled={!newComment.trim() || submitting}
              className="px-3 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition disabled:opacity-50"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-role-primary text-role-primary-foreground font-semibold hover:bg-role-primary/90 transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Post Comment
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
