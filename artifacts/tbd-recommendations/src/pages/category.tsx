import { useState, useEffect } from 'react';
import { useLocation, useParams, Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useListSuggestions, 
  useCreateSuggestion, 
  getListSuggestionsQueryKey,
  useGetSummary,
  getGetSummaryQueryKey
} from '@workspace/api-client-react';
import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { BookOpen, Film, Tv, ArrowLeft, MessageCircle, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const CATEGORY_MAP = {
  book: { title: 'Books', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50' },
  movie: { title: 'Movies', icon: Film, color: 'text-purple-500', bg: 'bg-purple-50' },
  tv: { title: 'TV Shows', icon: Tv, color: 'text-indigo-500', bg: 'bg-indigo-50' },
} as const;

export default function Category() {
  const params = useParams();
  const categoryId = params.category as 'book' | 'movie' | 'tv';
  const [, setLocation] = useLocation();
  const { user, isLoaded } = useSession();
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const { data: suggestions, isLoading } = useListSuggestions(
    { category: categoryId }, 
    { query: { queryKey: getListSuggestionsQueryKey({ category: categoryId }), enabled: !!categoryId } }
  );

  const createSuggestion = useCreateSuggestion();

  useEffect(() => {
    if (isLoaded && !user) {
      setLocation('/');
    }
    if (categoryId && !['book', 'movie', 'tv'].includes(categoryId)) {
      setLocation('/home');
    }
  }, [user, isLoaded, setLocation, categoryId]);

  if (!isLoaded || !user || !CATEGORY_MAP[categoryId]) {
    return null;
  }

  const catInfo = CATEGORY_MAP[categoryId];
  const Icon = catInfo.icon;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    createSuggestion.mutate({
      data: {
        userId: user.id,
        category: categoryId,
        title: newTitle.trim(),
        description: newDesc.trim()
      }
    }, {
      onSuccess: () => {
        setIsAddOpen(false);
        setNewTitle('');
        setNewDesc('');
        queryClient.invalidateQueries({ queryKey: getListSuggestionsQueryKey({ category: categoryId }) });
        queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-4xl">
          <Link href="/home" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Categories
          </Link>
          <div className="font-serif font-medium">{catInfo.title}</div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-10 max-w-4xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${catInfo.bg}`}>
              <Icon className={`w-8 h-8 ${catInfo.color}`} />
            </div>
            <div>
              <h1 className="text-4xl font-serif tracking-tight">{catInfo.title}</h1>
              <p className="text-muted-foreground mt-1">
                {suggestions?.length || 0} {suggestions?.length === 1 ? 'recommendation' : 'recommendations'}
              </p>
            </div>
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-full shadow-md hover:shadow-lg transition-all">
                <Plus className="w-5 h-5 mr-2" />
                Add Recommendation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleAdd}>
                <DialogHeader>
                  <DialogTitle>Add a {catInfo.title.slice(0, -1)}</DialogTitle>
                  <DialogDescription>
                    Share something you loved with the group.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input 
                      id="title" 
                      placeholder={`e.g., The Midnight Library`} 
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desc">Why should we {categoryId === 'book' ? 'read' : 'watch'} this?</Label>
                    <Textarea 
                      id="desc" 
                      placeholder="Tell us what you loved about it..." 
                      className="min-h-[120px] resize-none"
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddOpen(false)}
                    disabled={createSuggestion.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={!newTitle.trim() || !newDesc.trim() || createSuggestion.isPending}
                  >
                    {createSuggestion.isPending ? 'Adding...' : 'Add to list'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="opacity-50">
                <CardHeader>
                  <Skeleton className="h-6 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-1/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : suggestions?.length === 0 ? (
          <div className="text-center py-20 px-4 rounded-2xl border border-dashed bg-muted/30">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${catInfo.bg} mb-4`}>
              <Icon className={`w-8 h-8 ${catInfo.color} opacity-50`} />
            </div>
            <h3 className="text-xl font-serif mb-2">No recommendations yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Be the first to share a {catInfo.title.toLowerCase().slice(0, -1)} you love.
            </p>
            <Button onClick={() => setIsAddOpen(true)} variant="outline">
              Add the first one
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {suggestions?.map((suggestion) => (
              <Link key={suggestion.id} href={`/suggestions/${suggestion.id}`}>
                <Card className="hover-elevate transition-all duration-200 cursor-pointer border-transparent hover:border-primary/20 shadow-sm hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <CardTitle className="text-xl font-serif text-primary mb-1">
                          {suggestion.title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-foreground">Recommended by {suggestion.userName}</span>
                          <span className="text-muted-foreground/50">•</span>
                          <span>{new Date(suggestion.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                      "{suggestion.description}"
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0 text-sm text-muted-foreground font-medium flex items-center">
                    <MessageCircle className="w-4 h-4 mr-1.5" />
                    {suggestion.commentCount} {suggestion.commentCount === 1 ? 'comment' : 'comments'}
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
