import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const SetupWarning = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (supabaseUrl && supabaseKey) {
    return null; // Everything is configured
  }

  return (
    <Alert variant="destructive" className="m-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Configuration Required</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="font-semibold mb-2">Missing environment variables!</p>
        <p className="mb-2">The app needs Supabase configuration to work.</p>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Create a <code className="bg-muted px-1 rounded">.env</code> file in the project root</li>
          <li>Add these variables:
            <pre className="bg-muted p-2 rounded mt-1 text-xs overflow-x-auto">
{`VITE_SUPABASE_URL=https://gwhhwrdcugcagtqkbzwp.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key`}
            </pre>
          </li>
          <li>Get your anon key from: <a href="https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/settings/api" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Supabase Dashboard → Settings → API</a></li>
          <li>Restart the dev server after creating the file</li>
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">
          See SETUP_GUIDE.md for detailed instructions.
        </p>
      </AlertDescription>
    </Alert>
  );
};
