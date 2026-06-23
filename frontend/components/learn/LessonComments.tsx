"use client";

import { useState, useTransition } from "react";
import { MessageSquare, Send, CornerDownRight, Edit2, Trash2, MoreVertical, X } from "lucide-react";

interface Comment {
  id: string;
  lessonId: string;
  userId: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  updatedAt?: string;
  userFullName?: string;
  userAvatarUrl?: string;
}

interface LessonCommentsProps {
  lessonId: string;
  currentUserId: string;
  initialComments: Comment[];
}

export default function LessonComments({
  lessonId,
  currentUserId,
  initialComments,
}: LessonCommentsProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Helper to format Date
  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 600);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Vừa xong";
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return date.toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Gần đây";
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // Group comments: Root comments (parentId === null) and their replies
  const rootComments = comments.filter((c) => !c.parentId);
  const repliesMap = comments.reduce((acc, c) => {
    if (c.parentId) {
      if (!acc[c.parentId]) acc[c.parentId] = [];
      acc[c.parentId].push(c);
    }
    return acc;
  }, {} as Record<string, Comment[]>);

  // Sort comments by date (oldest first or newest first? Usually oldest first for conversational flow)
  rootComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  Object.keys(repliesMap).forEach((parentId) => {
    repliesMap[parentId].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || isPending) return;

    const textToSubmit = newCommentText;
    setNewCommentText("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId,
            content: textToSubmit,
            parentId: null,
          }),
        });

        if (!res.ok) throw new Error("Lỗi khi gửi bình luận");
        const newComment = await res.json();
        
        // Fetch comments again to get user profiles or manually append
        // Since backend doesn't return profile in create, let's refresh list
        await refreshComments();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Đã xảy ra lỗi");
      }
    });
  };

  const handleCreateReply = async (parentId: string) => {
    if (!replyText.trim() || isPending) return;

    const textToSubmit = replyText;
    setReplyText("");
    setReplyToId(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId,
            content: textToSubmit,
            parentId,
          }),
        });

        if (!res.ok) throw new Error("Lỗi khi phản hồi bình luận");
        await refreshComments();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Đã xảy ra lỗi");
      }
    });
  };

  const handleUpdateComment = async (id: string) => {
    if (!editText.trim() || isPending) return;

    const textToSubmit = editText;
    setEditingId(null);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/comments/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: textToSubmit,
          }),
        });

        if (!res.ok) throw new Error("Lỗi khi chỉnh sửa bình luận");
        await refreshComments();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Đã xảy ra lỗi");
      }
    });
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bình luận này?") || isPending) return;
    setActiveMenuId(null);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/comments/${id}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error("Lỗi khi xóa bình luận");
        setComments((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        alert(err instanceof Error ? err.message : "Đã xảy ra lỗi");
      }
    });
  };

  const refreshComments = async () => {
    try {
      const res = await fetch(`/api/comments/lesson/${lessonId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error("Lỗi refresh comments:", err);
    }
  };

  const renderCommentCard = (comment: Comment, isReply = false) => {
    const isOwner = comment.userId === currentUserId;
    const isEditing = editingId === comment.id;

    return (
      <div key={comment.id} className={`flex gap-3 group relative ${isReply ? "mt-3 pl-2 border-l border-gray-100 dark:border-gray-800" : "mt-5"}`}>
        {/* Avatar */}
        <div className="shrink-0">
          {comment.userAvatarUrl ? (
            <img
              src={comment.userAvatarUrl}
              alt={comment.userFullName || "Avatar"}
              className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/10 to-primary/30 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
              {getInitials(comment.userFullName)}
            </div>
          )}
        </div>

        {/* Content Box */}
        <div className="flex-1 min-w-0 bg-gray-50/50 dark:bg-gray-800/20 rounded-2xl p-3 border border-gray-100 dark:border-gray-800/80">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-gray-850 dark:text-gray-200 truncate">
              {comment.userFullName || "Người dùng"}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
              {formatTimeAgo(comment.createdAt)}
            </span>
          </div>

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary"
                rows={2}
              />
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => setEditingId(null)}
                  className="px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleUpdateComment(comment.id)}
                  disabled={isPending}
                  className="px-2.5 py-1 text-xs bg-primary text-white rounded-lg hover:bg-primary/95 transition-colors disabled:opacity-50"
                >
                  Lưu
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap leading-relaxed">
              {comment.content}
            </p>
          )}

          {/* Action Row */}
          {!isEditing && (
            <div className="flex items-center gap-4 mt-2">
              {!isReply && (
                <button
                  onClick={() => {
                    setReplyToId(comment.id);
                    setReplyText("");
                  }}
                  className="text-xs text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary font-medium transition-colors"
                >
                  Phản hồi
                </button>
              )}

              {isOwner && (
                <>
                  <button
                    onClick={() => {
                      setEditingId(comment.id);
                      setEditText(comment.content);
                    }}
                    className="text-xs text-gray-400 dark:text-gray-500 hover:text-amber-500 dark:hover:text-amber-400 font-medium transition-colors"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 font-medium transition-colors"
                  >
                    Xóa
                  </button>
                </>
              )}
            </div>
          )}

          {/* Reply Textbox */}
          {replyToId === comment.id && (
            <div className="mt-3 flex gap-2 items-start">
              <CornerDownRight size={14} className="text-gray-400 mt-2 shrink-0" />
              <div className="flex-1 space-y-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Phản hồi ${comment.userFullName}...`}
                  className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={2}
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={() => setReplyToId(null)}
                    className="px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => handleCreateReply(comment.id)}
                    disabled={isPending}
                    className="px-2.5 py-1 text-xs bg-primary text-white rounded-lg hover:bg-primary/95 transition-colors disabled:opacity-50"
                  >
                    Gửi
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Render nested replies */}
          {repliesMap[comment.id] && repliesMap[comment.id].length > 0 && (
            <div className="space-y-1">
              {repliesMap[comment.id].map((reply) => renderCommentCard(reply, true))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-2">
        <MessageSquare size={18} className="text-primary" />
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Thảo luận ({comments.length})
        </h3>
      </div>

      {/* New Comment Input */}
      <form onSubmit={handleCreateComment} className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20 shrink-0">
          Me
        </div>
        <div className="flex-1 flex gap-2">
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Đặt câu hỏi hoặc chia sẻ cảm nghĩ của bạn..."
            className="flex-1 text-sm p-3 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary placeholder-gray-400 resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleCreateComment(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!newCommentText.trim() || isPending}
            className="p-3 bg-primary text-white rounded-xl hover:bg-primary/95 transition-colors shrink-0 disabled:opacity-50 flex items-center justify-center shadow-lg shadow-primary/15"
          >
            <Send size={15} />
          </button>
        </div>
      </form>

      {/* Comment List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-850">
        {rootComments.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-6">
            Chưa có bình luận nào. Hãy là người đầu tiên thảo luận!
          </p>
        ) : (
          rootComments.map((comment) => renderCommentCard(comment))
        )}
      </div>
    </div>
  );
}
