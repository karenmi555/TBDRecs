import { useState, useEffect, useMemo } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Film, Tv, UtensilsCrossed, BedDouble, ArrowLeft, MessageCircle, Plus, MapPin, ArrowUpDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const CATEGORY_MAP = {
  book: { title: 'Books', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50' },
  movie: { title: 'Movies', icon: Film, color: 'text-purple-500', bg: 'bg-purple-50' },
  tv: { title: 'TV Shows', icon: Tv, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  restaurant: { title: 'Restaurants', icon: UtensilsCrossed, color: 'text-violet-500', bg: 'bg-violet-50' },
  hotel: { title: 'Hotels', icon: BedDouble, color: 'text-rose-500', bg: 'bg-rose-50' },
} as const;

type SortKey = 'newest' | 'title' | 'city' | 'person';

export default function Category() {
  const params = useParams();
  const categoryId = params.category as 'book' | 'movie' | 'tv' | 'restaurant' | 'hotel';
  const [, setLocation] = useLocation();
  const { user, isLoaded } = useSession();
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCity, setNewCity] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('newest');

  const { data: suggestions, isLoading } = useListSuggestions(
    { category: categoryId }, 
    { query: { queryKey: getListSuggestionsQueryKey({ category: categoryId }), enabled: !!categoryId } }
  );

  const createSuggestion = useCreateSuggestion();

  useEffect(() => {
    if (isLoaded && !user) {
      setLocation('/');
    }
    if (categoryId && !['book', 'movie', 'tv', 'restaurant', 'hotel'].includes(categoryId)) {
      setLocation('/home');
    }
  }, [user, isLoaded, setLocation, categoryId]);

  const isCityCategory = categoryId === 'restaurant' || categoryId === 'hotel';
  const titleLabel = isCityCategory ? 'Name' : 'Title';

  // City filter options
  const allCities = isCityCategory
    ? Array.from(new Set((suggestions ?? []).map(s => s.city ?? '').filter(Boolean))).sort()
    : [];

  // Filter by city, then sort — must be before any early return
  const visibleSuggestions = useMemo(() => {
    let list = suggestions ?? [];
    if (isCityCategory && selectedCity) {
      list = list.filter(s => s.city === selectedCity);
    }
    return [...list].sort((a, b) => {
      switch (sortKey) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'city':
          return (a.city ?? '').localeCompare(b.city ?? '') || a.title.localeCompare(b.title);
        case 'person':
          return a.userName.localeCompare(b.userName) || a.title.localeCompare(b.title);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [suggestions, selectedCity, sortKey, isCityCategory]);

  if (!isLoaded || !user || !CATEGORY_MAP[categoryId]) {
    return null;
  }

  const catInfo = CATEGORY_MAP[categoryId];
  const Icon = catInfo.icon;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;
    if (isCityCategory && !newCity.trim()) return;

    createSuggestion.mutate({
      data: {
        userId: user.id,
        category: categoryId,
        title: newTitle.trim(),
        description: newDesc.trim(),
        ...(isCityCategory ? { city: newCity.trim() } : {}),
      }
    }, {
      onSuccess: () => {
        setIsAddOpen(false);
        setNewTitle('');
        setNewDesc('');
        setNewCity('');
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
                  <DialogTitle>Add a {categoryId === 'restaurant' ? 'Restaurant' : categoryId === 'hotel' ? 'Hotel' : catInfo.title.slice(0, -1)}</DialogTitle>
                  <DialogDescription>
                    Share something you loved with the group.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">{categoryId === 'restaurant' ? 'Restaurant name' : categoryId === 'hotel' ? 'Hotel name' : 'Title'}</Label>
                    <Input 
                      id="title" 
                      placeholder={categoryId === 'restaurant' ? 'e.g., Nobu' : categoryId === 'hotel' ? 'e.g., Hôtel du Cap-Eden-Roc' : 'e.g., The Midnight Library'} 
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      autoFocus
                    />
                  </div>
                  {isCityCategory && (
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input 
                        id="city" 
                        placeholder="e.g., New York" 
                        value={newCity}
                        onChange={e => setNewCity(e.target.value)}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="desc">Why do you recommend it?</Label>
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
                    disabled={!newTitle.trim() || !newDesc.trim() || (isCityCategory && !newCity.trim()) || createSuggestion.isPending}
                  >
                    {createSuggestion.isPending ? 'Adding...' : 'Add to list'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Controls row: city filter + sort */}
        {!isLoading && (suggestions?.length ?? 0) > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            {/* City filter pills */}
            {isCityCategory && allCities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCity(null)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    selectedCity === null
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  All cities
                </button>
                {allCities.map(city => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city === selectedCity ? null : city)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      selectedCity === city
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            ) : (
              <div /> /* spacer so sort stays right-aligned */
            )}

            {/* Sort dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <Select value={sortKey} onValueChange={v => setSortKey(v as SortKey)}>
                <SelectTrigger className="w-44 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Most recent</SelectItem>
                  <SelectItem value="title">{titleLabel} A–Z</SelectItem>
                  {isCityCategory && <SelectItem value="city">City A–Z</SelectItem>}
                  <SelectItem value="person">Who shared it</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

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
              Be the first to share a {categoryId === 'restaurant' ? 'restaurant' : categoryId === 'hotel' ? 'hotel' : catInfo.title.toLowerCase().slice(0, -1)} you love.
            </p>
            <Button onClick={() => setIsAddOpen(true)} variant="outline">
              Add the first one
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {visibleSuggestions.map((suggestion) => (
              <Link key={suggestion.id} href={`/suggestions/${suggestion.id}`}>
                <Card className="hover-elevate transition-all duration-200 cursor-pointer border-transparent hover:border-primary/20 shadow-sm hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <CardTitle className="text-xl font-serif text-primary mb-1">
                          {suggestion.title}
                        </CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-2 text-sm">
                          {suggestion.city && (
                            <>
                              <span className="flex items-center font-medium text-foreground">
                                <MapPin className="w-3.5 h-3.5 mr-1" />
                                {suggestion.city}
                              </span>
                              <span className="text-muted-foreground/50">•</span>
                            </>
                          )}
                          <span className="font-medium text-foreground">Shared by {suggestion.userName}</span>
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
