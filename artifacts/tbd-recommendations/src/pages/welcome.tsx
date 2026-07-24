import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useListUsers, useCreateUser } from '@workspace/api-client-react';
import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { user, login, isLoaded } = useSession();
  const [mode, setMode] = useState<'new' | 'existing'>('existing');
  const [name, setName] = useState('');
  const [selectedName, setSelectedName] = useState('');

  const { data: users, isLoading: isLoadingUsers } = useListUsers();
  const createUser = useCreateUser();

  // Redirect if already logged in
  useEffect(() => {
    if (isLoaded && user) {
      setLocation('/home');
    }
  }, [user, isLoaded, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = mode === 'new' ? name.trim() : selectedName;
    if (!finalName) return;

    createUser.mutate({ data: { name: finalName } }, {
      onSuccess: (newUser) => {
        login(newUser.id, newUser.name);
        setLocation('/home');
      }
    });
  };

  if (!isLoaded || user) {
    return null;
  }

  const hasUsers = users && users.length > 0;

  // Auto-switch to new mode if no users exist
  if (!isLoadingUsers && !hasUsers && mode === 'existing') {
    setMode('new');
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md shadow-xl border-white/50 backdrop-blur-sm bg-white/80 z-10">
        <CardHeader className="text-center pb-8 pt-10">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-4xl font-serif tracking-tight text-foreground mb-2">
            TBD<br />Recommendations
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground mt-4">
            A cozy space to share our favorite reads, watches, and streams.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {isLoadingUsers ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : hasUsers ? (
              <div className="space-y-4">
                <div className="flex justify-center space-x-4 mb-4 border-b pb-4">
                  <button
                    type="button"
                    className={`text-sm font-medium transition-colors ${mode === 'existing' ? 'text-primary border-b-2 border-primary -mb-[17px] pb-4' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setMode('existing')}
                  >
                    I'm returning
                  </button>
                  <button
                    type="button"
                    className={`text-sm font-medium transition-colors ${mode === 'new' ? 'text-primary border-b-2 border-primary -mb-[17px] pb-4' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setMode('new')}
                  >
                    I'm new
                  </button>
                </div>

                {mode === 'existing' ? (
                  <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                    <Label htmlFor="existing-name">Who are you?</Label>
                    <Select value={selectedName} onValueChange={setSelectedName}>
                      <SelectTrigger id="existing-name" className="h-12 bg-white">
                        <SelectValue placeholder="Select your name" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.name}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                    <Label htmlFor="new-name">What's your name?</Label>
                    <Input
                      id="new-name"
                      placeholder="Type your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 bg-white"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="first-name">What's your name?</Label>
                <Input
                  id="first-name"
                  placeholder="Type your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 bg-white"
                  autoFocus
                />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-medium" 
              disabled={createUser.isPending || (mode === 'new' ? !name.trim() : !selectedName)}
            >
              {createUser.isPending ? 'Entering...' : 'Enter'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
