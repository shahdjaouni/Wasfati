import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>طبختي</title>
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: 'html, body, #root { height: 100%; background: #FFF9F5; direction: rtl; } body { margin: 0; }',
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
