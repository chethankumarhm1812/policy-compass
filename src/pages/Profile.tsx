import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { INDIAN_STATES, OCCUPATIONS, CATEGORIES } from '@/lib/policyData';
import { Save, User } from 'lucide-react';
import { motion } from 'framer-motion';
import type { UserProfile } from '@/lib/eligibilityEngine';

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({});

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) setProfile(data);
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: profile.full_name,
      age: profile.age,
      gender: profile.gender,
      income: profile.income,
      occupation: profile.occupation,
      state: profile.state,
      district: profile.district,
      category: profile.category,
      is_rural: profile.is_rural,
      owns_land: profile.owns_land,
    }).eq('user_id', user.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Error saving profile', variant: 'destructive' });
    } else {
      toast({ title: 'Profile saved!' });
    }
  };

  const update = (field: keyof UserProfile, value: unknown) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading">Your Profile</h1>
            <p className="text-sm text-muted-foreground">Complete your profile for personalized policy recommendations</p>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="font-heading">Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input className="mt-1" placeholder="Enter your name" value={profile.full_name || ''} onChange={e => update('full_name', e.target.value)} />
              </div>
              <div>
                <Label>Age</Label>
                <Input className="mt-1" type="number" placeholder="25" value={profile.age || ''} onChange={e => update('age', parseInt(e.target.value) || null)} />
              </div>
              <div>
                <Label>Gender</Label>
                <Select value={profile.gender || ''} onValueChange={v => update('gender', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Annual Income (₹)</Label>
                <Input className="mt-1" type="number" placeholder="200000" value={profile.income || ''} onChange={e => update('income', parseInt(e.target.value) || null)} />
              </div>
              <div>
                <Label>Occupation</Label>
                <Select value={profile.occupation || ''} onValueChange={v => update('occupation', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select occupation" /></SelectTrigger>
                  <SelectContent>
                    {OCCUPATIONS.map(o => <SelectItem key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={profile.category || ''} onValueChange={v => update('category', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>State</Label>
                <Select value={profile.state || ''} onValueChange={v => update('state', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>District</Label>
                <Input className="mt-1" placeholder="Your district" value={profile.district || ''} onChange={e => update('district', e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 pt-2">
              <div className="flex items-center gap-3">
                <Switch checked={profile.is_rural || false} onCheckedChange={v => update('is_rural', v)} />
                <Label>Rural area</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={profile.owns_land || false} onCheckedChange={v => update('owns_land', v)} />
                <Label>Own land</Label>
              </div>
            </div>

            <Button size="lg" onClick={save} disabled={saving} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
