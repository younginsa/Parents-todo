import { SignIn } from "@clerk/nextjs";
import { APP_NAME } from "@/lib/config";

interface LoginPageProps {
  searchParams: Promise<{ reason?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { reason } = await searchParams;
  const notInvited = reason === "not-invited";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="font-display text-display text-foreground">
            {APP_NAME}
          </h1>
          <p className="mt-2 text-body-sm text-muted">
            어른이를 위한 todo
          </p>
        </div>

        {notInvited ? (
          <div className="w-full rounded-md border border-line bg-danger-soft/60 p-4 text-body-sm text-foreground">
            <p className="font-medium text-danger">초대된 사용자만 사용할 수 있어요.</p>
            <p className="mt-1 text-muted">
              관리자가 이메일을 추가해야 접근할 수 있습니다.
            </p>
          </div>
        ) : null}

        <SignIn
          routing="hash"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-md border border-line bg-surface rounded-lg",
            },
          }}
        />
      </div>
    </main>
  );
}
