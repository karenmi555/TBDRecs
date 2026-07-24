import { useState, useEffect } from 'react';
import { useLocation, useParams, Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useGetSuggestion, 
  useCreateComment,
  getGetSuggestionQueryKey,
  getListSuggestionsQueryKey,
  getGetSummaryQueryKey,
  useDeleteSuggestion,
  useDeleteComment
} from '@workspace/api-client-react';
import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Trash2, MessageSquare, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export default function SuggestionDetail() {
  const params = useParams();
  const id = parseInt(params.id || '0', 10);
  const [, setLocation] = useLocation();
  const { user, isLoaded } = useSession();
  const queryClient = useQueryClient();

  const [newComment, setNewComment] = useState('');

  const { data: suggestion, isLoading, isError } = useGetSuggestion(id);
  const createComment = useCreateComment();
  const deleteSuggestion = useDeleteSuggestion();
  const deleteComment = useDeleteComment();

  useEffect(() => {
    if (isLoaded && !user) {
      setLocation('/');
    }
    if (isError) {
      setLocation('/home');
    }
  }, [user, isLoaded, setLocation, isError]);

  if (!isLoaded || !user || !id) {
    return null;
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    createComment.mutate({
      data: {
        suggestionId: id,
        userId: user.id,
        content: newComment.trim()
      }
    }, {
      onSuccess: () => {
        setNewComment('');
        queryClient.invalidateQueries({ queryKey: getGetSuggestionQueryKey(id) });
      }
    });
  };

  const handleDeleteSuggestion = () => {
    if (!confirm('Are you sure you want to delete this recommendation?')) return;
    
    deleteSuggestion.mutate({ id }, {
      onSuccess: () => {
        if (suggestion) {
          queryClient.invalidateQueries({ queryKey: getListSuggestionsQueryKey({ category: suggestion.category }) });
          queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
          setLocation(`/category/${suggestion.category}`);
        } else {
          setLocation('/home');
        }
      }
    });
  };

  const handleDeleteComment = (commentId: number) => {
    if (!confirm('Delete this comment?')) return;

    deleteComment.mutate({ id: commentId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSuggestionQueryKey(id) });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 max-w-3xl mx-auto space-y-8">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!suggestion) return null;

  const isOwner = suggestion.userId === user.id;

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-3xl">
          <Link href={`/category/${suggestion.category}`} className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {suggestion.category === 'book' ? 'Books' : suggestion.category === 'movie' ? 'Movies' : 'TV Shows'}
          </Link>
          
          {isOwner && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleDeleteSuggestion}
              disabled={deleteSuggestion.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 pt-10 max-w-3xl">
        <article className="mb-16">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-primary mb-4 leading-tight">
              {suggestion.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
              <span className="font-medium text-foreground">Recommended by {suggestion.userName}</span>
              <span>•</span>
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 inline" />
                {new Date(suggestion.createdAt).toLocaleDateString(undefined, { 
                  year: 'numeric', month: 'long', day: 'numeric' 
                })}
              </span>
            </div>
          </div>
          
          <div className="prose prose-lg dark:prose-invert prose-p:leading-relaxed max-w-none">
            <p className="text-xl italic text-muted-foreground border-l-4 border-primary/20 pl-6 py-2">
              "{suggestion.description}"
            </p>
          </div>
        </article>

        <Separator className="my-10" />

        <section className="space-y-8">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h3 className="text-2xl font-serif">Thoughts & Comments</h3>
            <span className="bg-secondary text-secondary-foreground text-sm py-0.5 px-2.5 rounded-full font-medium ml-2">
              {suggestion.comments?.length || 0}
            </span>
          </div>

          <div className="space-y-6">
            {suggestion.comments?.map(comment => (
              <div key={comment.id} className="group flex gap-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold font-serif shrink-0">
                  {comment.userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{comment.userName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    {comment.userId === user.id && (
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deleteComment.isPending}
                        className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all text-xs flex items-center"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}

            {suggestion.comments?.length === 0 && (
              <p className="text-muted-foreground italic">No comments yet. Start the conversation!</p>
            )}
          </div>

          <div className="pt-6 mt-8 border-t">
            <form onSubmit={handleAddComment} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold font-serif shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 space-y-3">
                <Textarea 
                  placeholder="Share your thoughts..." 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  className="min-h-[100px] resize-none focus-visible:ring-primary/20 bg-muted/20"
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={!newComment.trim() || createComment.isPending}
                    className="rounded-full px-6"
                  >
                    {createComment.isPending ? 'Posting...' : 'Post comment'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
