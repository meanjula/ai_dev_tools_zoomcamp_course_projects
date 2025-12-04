import { Header } from '@/components/layout/Header';
import { CreateSessionDialog } from '@/components/session/CreateSessionDialog';
import { JoinSessionDialog } from '@/components/session/JoinSessionDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Code2, Users, Globe, Terminal, Shield, Codepen, Zap } from 'lucide-react';
const features = [{
  icon: Users,
  title: 'Real-time Collaboration',
  description: 'Code together with your team in real-time. See each other\'s cursors and changes instantly.'
}, {
  icon: Code2,
  title: 'Syntax Highlighting',
  description: 'Professional code editor with syntax highlighting for multiple programming languages.'
}, {
  icon: Zap,
  title: 'Instant Execution',
  description: 'Run your code directly in the browser and see results immediately.'
}, {
  icon: Globe,
  title: 'Share Anywhere',
  description: 'Share your session with a simple link. No sign-up required for guests.'
}, {
  icon: Terminal,
  title: 'Multiple Languages',
  description: 'Support for JavaScript, TypeScript, Python, HTML, CSS, and more.'
}, {
  icon: Shield,
  title: 'Secure Sandbox',
  description: 'Code runs in a safe, isolated environment to protect your system.'
}];
const Index = () => {
  return <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
          <div className="container mx-auto px-4 py-24 relative">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Codepen className="h-4 w-4" />
                Real-time collaborative coding
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                Code Together,{' '}
                <span className="text-primary">Build Together</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                The collaborative coding platform that brings developers together. 
                Create sessions, share code, and build amazing things in real-time.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <CreateSessionDialog />
                <JoinSessionDialog />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-card/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Everything you need to collaborate</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Powerful features designed for seamless collaboration and productivity.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {features.map(feature => <Card key={feature.title} className="bg-card border-border hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-muted-foreground">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>)}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="p-12 text-center">
                <h2 className="text-3xl font-bold mb-4">Ready to start coding?</h2>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                  Create your first session in seconds. No account required.
                </p>
                <CreateSessionDialog />
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 CodeCollab</p>
        </div>
      </footer>
    </div>;
};
export default Index;