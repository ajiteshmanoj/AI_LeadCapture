import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NoOrgPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <Card className="max-w-sm text-center">
        <CardHeader>
          <CardTitle>No centre linked to this account</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Your invite link may have expired, or this account hasn&apos;t been set up yet.</p>
          <p>Contact us and we&apos;ll get you sorted.</p>
        </CardContent>
      </Card>
    </div>
  );
}
