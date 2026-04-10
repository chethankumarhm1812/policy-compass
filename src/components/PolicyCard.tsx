import { Policy } from '@/lib/eligibilityEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { POLICY_CATEGORIES } from '@/lib/policyData';

interface Props {
  policy: Policy;
  eligibilityStatus?: 'eligible' | 'partial' | 'ineligible';
  index?: number;
}

export default function PolicyCard({ policy, eligibilityStatus, index = 0 }: Props) {
  const cat = POLICY_CATEGORIES.find(c => c.id === policy.category);

  const statusColors = {
    eligible: 'bg-eligible text-primary-foreground',
    partial: 'bg-partial text-primary-foreground',
    ineligible: 'bg-ineligible text-primary-foreground',
  };

  const statusLabels = {
    eligible: 'Eligible',
    partial: 'Partially Eligible',
    ineligible: 'Not Eligible',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Card className="h-full hover:shadow-md transition-shadow border-border">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{policy.category}</Badge>
            </div>
            {eligibilityStatus && (
              <Badge className={statusColors[eligibilityStatus]}>
                {statusLabels[eligibilityStatus]}
              </Badge>
            )}
          </div>
          <CardTitle className="text-lg font-heading leading-snug mt-2">{policy.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">{policy.description}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            <span>{policy.required_documents?.length || 0} documents needed</span>
          </div>
          <Link to={`/policy/${policy.id}`}>
            <Button variant="outline" size="sm" className="w-full">
              View Details <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
