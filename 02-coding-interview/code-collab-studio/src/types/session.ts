export interface User {
  id: string;
  name: string;
  color: string;
  cursor?: { line: number; column: number };
}

export interface Session {
  id: string;
  name: string;
  language: string;
  code: string;
  createdAt: Date;
  owner: User;
  participants: User[];
}

export interface ExecutionResult {
  output: string;
  error?: string;
  executionTime: number;
}

export type SupportedLanguage = 
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'html'
  | 'css'
  | 'json';

export const LANGUAGES: { value: SupportedLanguage; label: string; extension: string }[] = [
  { value: 'javascript', label: 'JavaScript', extension: '.js' },
  { value: 'typescript', label: 'TypeScript', extension: '.ts' },
  { value: 'python', label: 'Python', extension: '.py' },
  { value: 'html', label: 'HTML', extension: '.html' },
  { value: 'css', label: 'CSS', extension: '.css' },
  { value: 'json', label: 'JSON', extension: '.json' },
];

export const DEFAULT_CODE: Record<SupportedLanguage, string> = {
  javascript: `// Welcome to CodeCollab!
// Start coding together in real-time

function greet(name) {
  return \`Hello, \${name}! Welcome to collaborative coding.\`;
}

console.log(greet('World'));
`,
  typescript: `// Welcome to CodeCollab!
// TypeScript enabled

interface User {
  name: string;
  role: string;
}

function greet(user: User): string {
  return \`Hello, \${user.name}! You are a \${user.role}.\`;
}

console.log(greet({ name: 'World', role: 'Developer' }));
`,
  python: `# Welcome to CodeCollab!
# Start coding together in real-time

def greet(name):
    return f"Hello, {name}! Welcome to collaborative coding."

print(greet("World"))
`,
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CodeCollab</title>
</head>
<body>
  <h1>Welcome to CodeCollab!</h1>
  <p>Start coding together in real-time.</p>
</body>
</html>
`,
  css: `/* Welcome to CodeCollab!
   Style your projects together */

body {
  font-family: 'Inter', sans-serif;
  background: linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%);
  color: white;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

h1 {
  font-size: 3rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}
`,
  json: `{
  "name": "CodeCollab",
  "version": "1.0.0",
  "description": "Collaborative coding platform",
  "features": [
    "Real-time editing",
    "Multiple languages",
    "Code execution"
  ]
}
`,
};
