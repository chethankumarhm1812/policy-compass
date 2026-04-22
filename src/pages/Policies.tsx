import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter } from 'lucide-react';
import { POLICY_CATEGORIES } from '@/lib/policyData';
import { rankPolicies, type Policy, type UserProfile } from '@/lib/eligibilityEngine';
import PolicyCard from '@/components/PolicyCard';
import { motion } from 'framer-motion';
import { fetchUserProfile } from '@/lib/profileService';

export default function PoliciesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || '');
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
  const filtered = ranked.filter(p => {
    if (category && p.category !== category) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-heading">All Policies</h1>
        <p className="text-muted-foreground">Browse and filter government schemes</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search policies..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant={category === '' ? 'default' : 'outline'} size="sm" onClick={() => setCategory('')}>All</Button>
          {POLICY_CATEGORIES.map(c => (
            <Button key={c.id} variant={category === c.id ? 'default' : 'outline'} size="sm" onClick={() => setCategory(c.id)} className="gap-1">
              {c.icon} {c.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12">Loading policies...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">No policies found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p, i) => (
            <PolicyCard key={p.id} policy={p} eligibilityStatus={p.eligibility.status} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
