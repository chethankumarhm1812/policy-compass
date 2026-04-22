import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, ExternalLink, FileText, MapPin, Info } from 'lucide-react';
import { checkEligibility, type Policy, type UserProfile, type EligibilityResult } from '@/lib/eligibilityEngine';
import { POLICY_CATEGORIES } from '@/lib/policyData';
import { motion } from 'framer-motion';
import DREModal from '@/components/DREModal';
import { fetchUserProfile, updateUserProfile } from '@/lib/profileService';

export default function PolicyDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [profile, setProfile] = useState<UserProfile>({});
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [showDRE, setShowDRE] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    Promise.all([
      supabase.from('policies').select('*').eq('id', id).single(),
      fetchUserProfile(user.id),
    ]).then(([polRes, profRes]) => {
      if (polRes.data) {
        const p = polRes.data as unknown as Policy;
        setPolicy(p);
        const prof = profRes.data || {};
        setProfile(prof);
        setEligibility(checkEligibility(prof, p));
      }
      setLoading(false);
    });
  }, [user, id]);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  if (!policy) return <div className="text-center py-12 text-muted-foreground">Policy not found</div>;

  const cat = POLICY_CATEGORIES.find(c => c.id === policy.category);
  const statusConfig = {
    eligible: { color: 'bg-eligible', icon: CheckCircle, label: 'You are Eligible! ✅', textColor: 'text-eligible' },
    partial: { color: 'bg-partial', icon: AlertTriangle, label: 'Partially Eligible ⚠️', textColor: 'text-partial' },
    ineligible: { color: 'bg-ineligible', icon: XCircle, label: 'Not Eligible ❌', textColor: 'text-ineligible' },
  };
  const sc = eligibility ? statusConfig[eligibility.status] : null;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <Link to="/policies">
        <Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Policies</Button>
      </Link>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <span className="text-4xl">{cat?.icon || '📋'}</span>
          <div className="flex-1">
            <Badge variant="outline" className="mb-2">{policy.category}</Badge>
            <h1 className="text-2xl font-bold font-heading">{policy.title}</h1>
            <p className="text-muted-foreground mt-1">{policy.description}</p>
          </div>
        </div>

        {/* Eligibility Result */}
        {eligibility && sc && (
          <Card className="border-2" style={{ borderColor: `hsl(var(--${eligibility.status === 'eligible' ? 'eligible' : eligibility.status === 'partial' ? 'partial' : 'ineligible'}))` }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <sc.icon className={`h-6 w-6 ${sc.textColor}`} />
                <span className={`text-lg font-bold font-heading ${sc.textColor}`}>{sc.label}</span>
              </div>

              {/* Matched rules */}
              {Object.entries(eligibility.matchedRules).length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium mb-1">✅ Matched Criteria:</p>
                  {Object.entries(eligibility.matchedRules).map(([k, v]) => (
                    <p key={k} className="text-sm text-muted-foreground pl-4">• {v}</p>
                  ))}
                </div>
              )}

              {/* Reasons for ineligibility */}
              {eligibility.reasons.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium mb-1">❌ Not Matching:</p>
                  {eligibility.reasons.map((r, i) => (
                    <p key={i} className="text-sm text-muted-foreground pl-4">• {r}</p>
                  ))}
                </div>
              )}

              {/* Missing fields */}
              {eligibility.missingFields.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">⚠️ Missing Information:</p>
                  {eligibility.missingFields.map((f, i) => (
                    <p key={i} className="text-sm text-muted-foreground pl-4">• {f.replace('_', ' ')}</p>
                  ))}
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => setShowDRE(true)}>
                    Provide Missing Info
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Separator className="my-4" />

        {/* Benefits */}
        <Card>
          <CardHeader><CardTitle className="font-heading text-base flex items-center gap-2"><CheckCircle className="h-4 w-4 text-eligible" /> Benefits</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {policy.benefits?.map((b, i) => <li key={i} className="text-sm text-muted-foreground">• {b}</li>)}
            </ul>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className="mt-4">
          <CardHeader><CardTitle className="font-heading text-base flex items-center gap-2"><FileText className="h-4 w-4 text-accent" /> Required Documents</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {policy.required_documents?.map((d, i) => <li key={i} className="text-sm text-muted-foreground">• {d}</li>)}
            </ul>
          </CardContent>
        </Card>

        {/* Steps */}
        <Card className="mt-4">
          <CardHeader><CardTitle className="font-heading text-base flex items-center gap-2"><MapPin className="h-4 w-4 text-secondary" /> How to Apply</CardTitle></CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {policy.application_steps?.map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="font-bold text-foreground">{i + 1}.</span> {s}
                </li>
              ))}
            </ol>
            {policy.apply_link && (
              <a href={policy.apply_link} target="_blank" rel="noopener noreferrer">
                <Button className="mt-4" size="lg">
                  Apply Now <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {showDRE && eligibility && (
        <DREModal
          missingFields={eligibility.missingFields}
          onClose={() => setShowDRE(false)}
          onSubmit={async (data) => {
            if (!user) return;
            const updateData: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(data)) {
              if (['age', 'income', 'gender', 'occupation', 'state', 'district', 'category', 'is_rural', 'owns_land', 'full_name'].includes(k)) {
                updateData[k] = v;
              }
            }
            await updateUserProfile(
              user.id,
              updateData as { age?: number; income?: number; gender?: string; occupation?: string; state?: string; district?: string; category?: string; is_rural?: boolean; owns_land?: boolean; full_name?: string }
            );
            setProfile(prev => ({ ...prev, ...data }));
            const newResult = checkEligibility({ ...profile, ...data }, policy);
            setEligibility(newResult);
            setShowDRE(false);
          }}
        />
      )}
    </div>
  );
}
