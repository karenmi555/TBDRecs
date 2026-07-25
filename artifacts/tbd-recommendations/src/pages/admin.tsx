import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  useListUsers,
  useDeleteUser,
  useListSuggestions,
  useDeleteSuggestion,
  getListUsersQueryKey,
  getListSuggestionsQueryKey,
  getGetSummaryQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Film, Tv, UtensilsCrossed, Trash2, Users, ArrowLeft, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const categoryIcon = (cat: string) => {
  if (cat === 'book') return <BookOpen className="w-3.5 h-3.5" />;
  if (cat === 'movie') return <Film className="w-3.5 h-3.5" />;
  if (cat === 'restaurant') return <UtensilsCrossed className="w-3.5 h-3.5" />;
  return <Tv className="w-3.5 h-3.5" />;
};

const categoryLabel = (cat: string) => {
  if (cat === 'book') return 'Book';
  if (cat === 'movie') return 'Movie';
  if (cat === 'restaurant') return 'Restaurant';
  return 'TV Show';
};

export default function Admin() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: users, isLoading: isLoadingUsers } = useListUsers();
  const { data: suggestions, isLoading: isLoadingSuggestions } = useListSuggestions();

  const deleteUser = useDeleteUser();
  const deleteSuggestion = useDeleteSuggestion();

  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [deletingSuggestionId, setDeletingSuggestionId] = useState<number | null>(null);

  const handleDeleteUser = (id: number) => {
    setDeletingUserId(id);
    deleteUser.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListSuggestionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
        setDeletingUserId(null);
      },
      onError: () => setDeletingUserId(null),
    });
  };

  const handleDeleteSuggestion = (id: number) => {
    setDeletingSuggestionId(id);
    deleteSuggestion.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSuggestionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
        setDeletingSuggestionId(null);
      },
      onError: () => setDeletingSuggestionId(null),
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-5xl">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/home')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div className="h-4 w-px bg-border" />
            <span className="font-serif font-semibold text-lg">Admin</span>
          </div>
          <Badge variant="secondary" className="text-xs">TBD Recommendations</Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-10 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-serif tracking-tight mb-1">Admin Panel</h1>
          <p className="text-muted-foreground text-sm">Manage members and recommendations.</p>
        </div>

        <Tabs defaultValue="suggestions">
          <TabsList className="mb-6">
            <TabsTrigger value="suggestions" data-testid="tab-suggestions">
              <BookOpen className="w-4 h-4 mr-2" />
              Recommendations
              {suggestions && (
                <Badge variant="secondary" className="ml-2 text-xs">{suggestions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />
              Members
              {users && (
                <Badge variant="secondary" className="ml-2 text-xs">{users.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Suggestions tab */}
          <TabsContent value="suggestions">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium text-muted-foreground">
                  All Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingSuggestions ? (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : !suggestions?.length ? (
                  <p className="text-center text-muted-foreground py-12 text-sm">No recommendations yet.</p>
                ) : (
                  <ul className="divide-y">
                    {suggestions.map((s) => (
                      <li
                        key={s.id}
                        data-testid={`suggestion-row-${s.id}`}
                        className="flex items-center justify-between px-6 py-4 gap-4"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="mt-0.5 shrink-0 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            {categoryIcon(s.category)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{s.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {categoryLabel(s.category)}
                              {s.city && (
                                <span className="inline-flex items-center ml-1"><MapPin className="w-3 h-3 inline mr-0.5" />{s.city}</span>
                              )}
                              {' · '}recommended by <span className="font-medium">{s.userName}</span>
                            </p>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0 text-muted-foreground hover:text-destructive"
                              data-testid={`delete-suggestion-${s.id}`}
                              disabled={deletingSuggestionId === s.id}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete recommendation?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete <strong>"{s.title}"</strong> and all its comments. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteSuggestion(s.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium text-muted-foreground">
                  All Members
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingUsers ? (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-14 w-full" />
                    ))}
                  </div>
                ) : !users?.length ? (
                  <p className="text-center text-muted-foreground py-12 text-sm">No members yet.</p>
                ) : (
                  <ul className="divide-y">
                    {users.map((u) => (
                      <li
                        key={u.id}
                        data-testid={`user-row-${u.id}`}
                        className="flex items-center justify-between px-6 py-4 gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{u.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0 text-muted-foreground hover:text-destructive"
                              data-testid={`delete-user-${u.id}`}
                              disabled={deletingUserId === u.id}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove {u.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove <strong>{u.name}</strong> and all of their recommendations and comments. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(u.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
