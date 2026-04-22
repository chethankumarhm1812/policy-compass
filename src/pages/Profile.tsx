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
    
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('public_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error('Profile fetch error:', error);
          // This is expected if profile doesn't exist yet (auto-created on signup)
          if (error.code !== 'PGRST116') {
            toast({ 
              title: 'Error loading profile', 
              description: error.message,
              variant: 'destructive' 
            });
          }
          return;
        }
        
        if (data) {
          setProfile({
            ...data,
            is_rural: data.rural,
            owns_land: data.own_land,
          });
        }
      } catch (err) {
        console.error('Unexpected error fetching profile:', err);
      }
    };
    
    fetchProfile();
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error('[saveProfile] Failed to get authenticated user:', authError);
        throw new Error('Authentication error. Please log in again.');
      }

      if (!authUser?.id) {
        console.error('[saveProfile] No authenticated user found');
        throw new Error('You must be logged in to save your profile.');
      }

      const payload = {
        user_id: authUser.id,
        full_name: profile.full_name?.trim() || null,
        age: typeof profile.age === 'number' ? profile.age : null,
        gender: profile.gender || null,
        income: typeof profile.income === 'number' ? profile.income : null,
        occupation: profile.occupation || null,
        category: profile.category || null,
        state: profile.state || null,
        district: profile.district || null,
        rural: typeof profile.is_rural === 'boolean' ? profile.is_rural : null, // map is_rural -> rural
        own_land: typeof profile.owns_land === 'boolean' ? profile.owns_land : null, // map owns_land -> own_land
      };

      console.log('[saveProfile] Upserting profile payload:', payload);

      const { data, error } = await supabase
        .from('public_profiles')
        .upsert(payload)
        .select()
        .single();

      if (error) {
        console.error('[saveProfile] Supabase upsert failed:', error);
        throw new Error(error.message || 'Failed to save profile.');
      }

      console.log('[saveProfile] Profile saved successfully:', data);

      // Keep UI state aligned with DB field naming.
      if (data) {
        setProfile((prev) => ({
          ...prev,
          ...data,
          is_rural: data.rural,
          owns_land: data.own_land,
        }));
      }

      toast({
        title: 'Success!',
        description: 'Your profile has been saved.',
      });
    } catch (err) {
      console.error('[saveProfile] Error:', err);
      toast({ 
        title: 'Error', 
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
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
