import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, Upload } from 'lucide-react';
import { INDIAN_STATES, OCCUPATIONS, CATEGORIES } from '@/lib/policyData';

interface Props {
  missingFields: string[];
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}

const FIELD_CONFIG: Record<string, { label: string; type: 'text' | 'number' | 'select' | 'toggle'; options?: string[] }> = {
  age: { label: 'Your Age', type: 'number' },
  income: { label: 'Annual Income (₹)', type: 'number' },
  gender: { label: 'Gender', type: 'select', options: ['male', 'female', 'other'] },
  occupation: { label: 'Occupation', type: 'select', options: OCCUPATIONS },
  state: { label: 'State', type: 'select', options: INDIAN_STATES },
  category: { label: 'Category', type: 'select', options: CATEGORIES },
  is_rural: { label: 'Do you live in a rural area?', type: 'toggle' },
  owns_land: { label: 'Do you own land?', type: 'toggle' },
};

export default function DREModal({ missingFields, onClose, onSubmit }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>({});

  const handleSubmit = () => {
    const data: Record<string, unknown> = {};
    missingFields.forEach(f => {
      if (values[f] !== undefined) data[f] = values[f];
    });
    onSubmit(data);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <AlertTriangle className="h-5 w-5 text-partial" />
            Additional Information Needed
          </DialogTitle>
          <DialogDescription>
            Please provide the following details to complete your eligibility check.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {missingFields.map(field => {
            const config = FIELD_CONFIG[field];
            if (!config) return null;

            if (config.type === 'toggle') {
              return (
                <div key={field} className="flex items-center justify-between">
                  <Label>{config.label}</Label>
                  <Switch checked={!!values[field]} onCheckedChange={v => setValues(prev => ({ ...prev, [field]: v }))} />
                </div>
              );
            }

            if (config.type === 'select') {
              return (
                <div key={field}>
                  <Label>{config.label}</Label>
                  <Select onValueChange={v => setValues(prev => ({ ...prev, [field]: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder={`Select ${config.label.toLowerCase()}`} /></SelectTrigger>
                    <SelectContent>
                      {config.options?.map(o => <SelectItem key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              );
            }

            return (
              <div key={field}>
                <Label>{config.label}</Label>
                <Input
                  className="mt-1"
                  type={config.type}
                  placeholder={`Enter ${config.label.toLowerCase()}`}
                  onChange={e => setValues(prev => ({ ...prev, [field]: config.type === 'number' ? Number(e.target.value) : e.target.value }))}
                />
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} className="flex-1">Check Eligibility</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
