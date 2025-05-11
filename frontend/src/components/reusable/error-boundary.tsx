import { Suspense, useEffect, useState } from "react";

export default function ErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [children]);

  if (hasError) {
    return (
      <div className="p-4 text-red-500">
        Something went wrong. Please refresh the page.
      </div>
    );
  }

  return <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>;
}
