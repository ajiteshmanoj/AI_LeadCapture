import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Payments</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming in Phase 4</CardTitle>
          <CardDescription>
            Stripe + PayNow integration, monthly fee reminders, and a payment overview will land here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Phase 1 covers chat + RAG + classes + FAQs. Once the MVP is signed off, payments are next.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
