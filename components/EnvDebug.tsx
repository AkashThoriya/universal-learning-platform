// Environment variables debug test
console.log('Environment Variables Debug:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
console.log('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
console.log('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID);
console.log('NEXT_PUBLIC_FIREBASE_APP_ID:', process.env.NEXT_PUBLIC_FIREBASE_APP_ID);

export default function EnvDebug() {
  return (
    <div className="p-4 bg-gray-100 rounded">
      <h2 className="text-lg font-bold mb-2">Environment Variables Debug</h2>
      <div className="space-y-1">
        <p>
          <strong>NODE_ENV:</strong> {process.env.NODE_ENV}
        </p>
        <p>
          <strong>API_KEY:</strong> {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Found' : 'Missing'}
        </p>
        <p>
          <strong>AUTH_DOMAIN:</strong> {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'Found' : 'Missing'}
        </p>
        <p>
          <strong>PROJECT_ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'Found' : 'Missing'}
        </p>
        <p>
          <strong>STORAGE_BUCKET:</strong> {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? 'Found' : 'Missing'}
        </p>
        <p>
          <strong>MESSAGING_SENDER_ID:</strong>{' '}
          {process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? 'Found' : 'Missing'}
        </p>
        <p>
          <strong>APP_ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? 'Found' : 'Missing'}
        </p>
      </div>
    </div>
  );
}
