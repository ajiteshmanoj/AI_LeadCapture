import { adminClient } from "@/lib/supabase/admin";
import { getCurrentOrgOrRedirect } from "@/lib/supabase/get-org";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentUploader } from "@/components/dashboard/DocumentUploader";
import { DeleteDocumentButton } from "@/components/dashboard/DeleteDocumentButton";

export default async function DocumentsPage() {
  const org = await getCurrentOrgOrRedirect();
  const { data: docs } = await adminClient()
    .from("documents")
    .select("id, filename, file_type, created_at")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Documents</h1>
      <Card>
        <CardHeader>
          <CardTitle>Upload</CardTitle>
          <CardDescription>
            Upload PDFs, TXT, CSV, or paste raw text. Content is chunked and embedded for the chatbot.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentUploader />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Uploaded ({docs?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr className="text-left">
                <th className="px-4 py-2 font-medium">Filename</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Uploaded</th>
                <th className="px-4 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {(docs ?? []).map((d) => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="px-4 py-2">{d.filename}</td>
                  <td className="px-4 py-2 uppercase text-muted-foreground">{d.file_type}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {new Date(d.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <DeleteDocumentButton id={d.id} filename={d.filename} />
                  </td>
                </tr>
              ))}
              {(docs ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    No documents yet. Upload your first one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
