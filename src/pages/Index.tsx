import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Search, MessageCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 mb-6">
            <Shield className="h-12 w-12 text-primary" />
            <h1 className="text-4xl sm:text-5xl font-bold font-heading text-foreground">PolicyLens AI</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Understand government policies that matter to you. Get personalized eligibility analysis powered by AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 gap-2">
                Get Started <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
          {[
            { icon: Search, title: 'Smart Search', desc: 'Find relevant policies using natural language' },
            { icon: CheckCircle, title: 'Eligibility Check', desc: 'Instant personalized eligibility analysis' },
            { icon: MessageCircle, title: 'AI Assistant', desc: 'Ask questions and get clear answers' },
          ].map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
              <div className="p-6 rounded-xl bg-card border border-border">
                <f.icon className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-bold font-heading mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
