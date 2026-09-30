'use client';

import { CircleAlertIcon, RotateCcwIcon } from 'lucide-react';
import { useEffect } from 'react';

import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-xl items-center px-4">
      <Alert variant="destructive">
        <CircleAlertIcon />
        <AlertTitle>工具加载失败</AlertTitle>
        <AlertDescription>
          <p>当前工具未能正常加载，你的本地输入不会被上传。</p>
          <Button className="mt-4" onClick={reset} variant="outline">
            <RotateCcwIcon data-icon="inline-start" />
            重新加载
          </Button>
        </AlertDescription>
      </Alert>
    </main>
  );
}
