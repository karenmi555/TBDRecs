import { useLocation, Link } from 'wouter';
import { useGetSummary } from '@workspace/api-client-react';
import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Film, Tv, LogOut } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, logout, isLoaded } = useSession();
  const { data: summary, isLoading } = useGetSummary();

  useEffect(() => {
    if (isLoaded && !user) {
      setLocation('/');
    }
  }, [user, isLoaded, setLocation]);

  if (!isLoaded || !user) {
    return null;
  }

  const categories = [
    {
      id: 'book',
      title: 'Books',
      description: 'Stories that kept us turning pages',
      icon: BookOpen,
      count: summary?.books || 0,
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    },
    {
      id: 'movie',
      title: 'Movies',
      description: 'Films we couldn\'t stop thinking about',
      icon: Film,
      count: summary?.movies || 0,
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    },
    {
      id: 'tv',
      title: 'TV Shows',
      description: 'Series we binged in one weekend',
      icon: Tv,
      count: summary?.tv || 0,
      color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-5xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <span className="font-serif font-semibold text-lg hidden sm:inline-block">TBD Recs</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              Hello, <strong className="text-foreground font-medium">{user.name}</strong>
            </span>
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-2" />
              Switch user
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-12 max-w-5xl">
        <div className="max-w-2xl mb-12">
          <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-4">
            What are we enjoying?
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Browse our curated collections of favorite reads and watches. Find your next obsession or share what you just finished.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/category/${cat.id}`}>
              <Card className="h-full hover-elevate transition-all duration-300 cursor-pointer border-transparent hover:border-primary/20 bg-white/50 shadow-sm hover:shadow-md group">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${cat.color}`}>
                    <cat.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-2xl font-serif group-hover:text-primary transition-colors">{cat.title}</CardTitle>
                  <CardDescription className="text-base mt-2">{cat.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground">
                      {cat.count} {cat.count === 1 ? 'suggestion' : 'suggestions'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
