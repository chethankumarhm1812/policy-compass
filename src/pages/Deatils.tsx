import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ExternalLink, FileText, MapPin, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import policiesText from '../../policies.md?raw';

interface MarkdownPolicy {
  title: string;
  documents: string;
  howToApply: string;
  applicationLink: string;
}

function parsePolicies(raw: string): MarkdownPolicy[] {
  return raw
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split(/\n/).map((line) => line.trim());
      const title = lines[0] || '';
      const documents = lines.find((line) => /^documents required:/i.test(line))?.replace(/^documents required:\s*/i, '') || '';
      const howToApply = lines.find((line) => /^how to apply:/i.test(line))?.replace(/^how to apply:\s*/i, '') || '';
      const applicationLink = lines.find((line) => /^application link:/i.test(line))?.replace(/^application link:\s*/i, '') || '';

      return {
        title,
        documents,
        howToApply,
        applicationLink,
      };
    });
}

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'education', label: 'Education', keywords: ['education', 'scholarship', 'school', 'college', 'aicte', 'rte', 'mid day meal', 'pratham', 'skill india'] },
  { key: 'bank', label: 'Bank', keywords: ['bank', 'loan', 'credit', 'account', 'financial', 'sidbi', 'mudra', 'kcc', 'cgtmse'] },
  { key: 'farmer', label: 'Farmer', keywords: ['farmer', 'farm', 'agriculture', 'kisan', 'krishi', 'soil', 'pgsindia', 'pm kisan'] },
  { key: 'health', label: 'Health', keywords: ['health', 'medical', 'tuberculosis', 'ayushman', 'poshan', 'nhm', 'nutrition', 'hospital'] },
];

export default function Deatils() {
  const policies = useMemo(() => parsePolicies(policiesText), []);
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const handleSearch = () => {
    setSearchTerm(search.trim());
  };

  const filteredPolicies = useMemo(() => {
    return policies.filter((policy) => {
      const query = searchTerm.toLowerCase();
      const title = policy.title.toLowerCase();
      const documents = policy.documents.toLowerCase();
      const howToApply = policy.howToApply.toLowerCase();

      if (searchTerm && ![title, documents, howToApply].some((field) => field.includes(query))) {
        return false;
      }

      if (activeFilter !== 'all') {
        const filter = CATEGORY_FILTERS.find((item) => item.key === activeFilter);
        if (filter) {
          return filter.keywords.some((keyword) =>
            title.includes(keyword) || documents.includes(keyword) || howToApply.includes(keyword),
          );
        }
      }

      return true;
    });
  }, [activeFilter, policies, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 shadow-sm">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Policy Deatils</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading">All policy information in one place</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Search and filter through the markdown policy list with a simple, neutral interface.
            </p>
          </div>
        </div>
        <Link to="/policies">
          <Button variant="outline" size="sm" className="whitespace-nowrap">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Policies
          </Button>
        </Link>
      </div>

      <Card className="border-border bg-background">
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1.8fr_0.8fr]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-11"
                value={search}
                placeholder="Search policies..."
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleSearch();
                }}
              />
            </div>
            <Button variant="default" size="sm" onClick={handleSearch} className="w-full">
              Search
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORY_FILTERS.map((filter) => (
              <Button
                key={filter.key}
                variant={activeFilter === filter.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(filter.key)}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>{filteredPolicies.length} policies found</span>
            {searchTerm && (
              <span>
                Showing results for <span className="font-medium text-foreground">"{searchTerm}"</span>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {filteredPolicies.map((policy, index) => (
          <motion.div
            key={`${policy.title}-${index}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
          >
            <Card className="h-full border border-border shadow-sm hover:shadow transition-shadow">
              <CardHeader className="space-y-2 pb-2">
                <CardTitle className="text-lg font-heading">{policy.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{policy.documents}</p>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-sm font-medium text-foreground">How to Apply</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{policy.howToApply}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  {policy.applicationLink ? (
                    <a href={policy.applicationLink} target="_blank" rel="noreferrer" className="w-full sm:w-auto">
                      <Button size="sm" className="w-full justify-center">
                        Open application link <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </a>
                  ) : (
                    <Button size="sm" variant="ghost" className="w-full justify-center" disabled>
                      No application link
                    </Button>
                  )}
                  <span className="text-xs text-muted-foreground">Policy entry {index + 1}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
