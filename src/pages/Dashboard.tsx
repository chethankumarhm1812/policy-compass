import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, MessageCircle, User, TrendingUp, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { POLICY_CATEGORIES } from '@/lib/policyData';
import { rankPolicies, type Policy, type UserProfile } from '@/lib/eligibilityEngine';
import PolicyCard from '@/components/PolicyCard';
import { fetchUserProfile } from '@/lib/profileService';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [profile, setProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('policies').select('*'),
      fetchUserProfile(user.id),
    ]).then(([polRes, profRes]) => {
      if (polRes.data) setPolicies(polRes.data as unknown as Policy[]);
      if (profRes.data) setProfile(profRes.data);
      setLoading(false);
    });
  }, [user]);

  const ranked = rankPolicies(profile, policies);
  const filtered = search
    ? ranked.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()))
    : ranked;

  const profileComplete = profile.full_name && profile.age && profile.income;
  const eligibleCount = ranked.filter(p => p.eligibility.status === 'eligible').length;
  const partialCount = ranked.filter(p => p.eligibility.status === 'partial').length;

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Welcome section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading">
              {profile.full_name ? `Hello, ${profile.full_name}!` : 'Welcome to PolicyLens AI'}
            </h1>
            <p className="text-muted-foreground mt-1">Discover government policies personalized for you</p>
          </div>
          {!profileComplete && (
            <Link to="/profile">
              <Button variant="outline" className="gap-2">
                <User className="h-4 w-4" /> Complete Profile
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
          <Input
            className="pl-12 h-12 text-base rounded-xl"
            placeholder="Search policies in natural language..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && search) navigate(`/chat?q=${encodeURIComponent(search)}`);
            }}
          />
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{policies.length}</div>
            <div className="text-xs text-muted-foreground">Total Policies</div>
          </CardContent>
        </Card>
        <Card className="bg-eligible/5 border-eligible/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-eligible">{eligibleCount}</div>
            <div className="text-xs text-muted-foreground">Eligible</div>
          </CardContent>
        </Card>
        <Card className="bg-partial/5 border-partial/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-partial">{partialCount}</div>
            <div className="text-xs text-muted-foreground">Partially Eligible</div>
          </CardContent>
        </Card>
        <Link to="/chat">
          <Card className="bg-accent/5 border-accent/20 cursor-pointer hover:shadow-md transition-shadow h-full">
            <CardContent className="p-4 text-center flex flex-col items-center justify-center h-full">
              <MessageCircle className="h-6 w-6 text-accent mb-1" />
              <div className="text-xs text-muted-foreground">Ask AI</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-lg font-semibold font-heading mb-3">Browse by Category</h2>
        <div className="flex flex-wrap gap-2">
          {POLICY_CATEGORIES.map(cat => (
            <Link key={cat.id} to={`/policies?category=${cat.id}`}>
              <Button variant="outline" size="sm" className="gap-2 rounded-full">
                {cat.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Recommended */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold font-heading flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Recommended for You
          </h2>
          <Link to="/policies">
            <Button variant="ghost" size="sm">View All <ArrowRight className="ml-1 h-4 w-4" /></Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.slice(0, 6).map((p, i) => (
            <PolicyCard key={p.id} policy={p} eligibilityStatus={p.eligibility.status} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
