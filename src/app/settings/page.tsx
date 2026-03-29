import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { PaymentInfoForm } from "@/components/payment-info-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true, venmo: true, zelle: true, cashapp: true, paypal: true },
  });

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-xl px-4 py-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and payment info.
        </p>

        {user?.username && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Username</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-mono">@{user.username}</p>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Payment Info</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentInfoForm
              venmo={user?.venmo ?? ""}
              zelle={user?.zelle ?? ""}
              cashapp={user?.cashapp ?? ""}
              paypal={user?.paypal ?? ""}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
