import { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description?: string;
  icon?: ReactNode;
}

export default function PlaceholderPage({ title, description, icon }: PlaceholderPageProps) {
  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          {icon || <AlertCircle className="w-16 h-16 text-muted-foreground" />}
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-muted-foreground text-lg max-w-md">
          {description || 'This page is coming soon. Feel free to continue exploring other sections of the app.'}
        </p>
      </div>
    </div>
  );
}
