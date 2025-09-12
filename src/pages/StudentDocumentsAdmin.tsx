import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { Calendar, Download, Eye, FileText, GraduationCap, Award, BarChart3 } from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api";

interface DocumentDto {
  id: number;
  doc_type: string;
  name: string;
  number?: string;
  cert_id?: string;
  issue_date: string;
  blockchain_hash: string;
  student_roll?: string;
  uin?: string;
}

export default function StudentDocumentsAdmin() {
  const { roll } = useParams();
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState<string>("");
  const [docs, setDocs] = useState<DocumentDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("students");
      if (stored) {
        const list = JSON.parse(stored) as Array<{ rollNo: string; name: string }>;
        const match = list.find(s => s.rollNo.toLowerCase() === String(roll).toLowerCase());
        if (match) setStudentName(match.name);
      }
    } catch {}

    (async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch(`${API_BASE_URL}/documents`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        const all: DocumentDto[] = data.documents || [];
        const filtered = all.filter(d => (d.student_roll || '').toLowerCase() === String(roll).toLowerCase());
        setDocs(filtered);
      } finally {
        setLoading(false);
      }
    })();
  }, [roll]);

  const download = async (id: number, name: string) => {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`${API_BASE_URL}/documents/download/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/[^a-zA-Z0-9_-]+/g, '_')}_${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  };

  const view = (id: number) => {
    window.open(`${API_BASE_URL}/documents/view/${id}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <Navigation />
        <Card className="bg-card/95 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-baseline gap-4">
                <span className="text-2xl font-bold text-foreground">{studentName || 'Student'}</span>
                <span className="text-sm text-muted-foreground">{roll}</span>
              </div>
              <Button variant="outline" onClick={() => navigate('/dashboard')} className="border-border/50">
                <BarChart3 className="h-4 w-4 mr-2" /> Back to Dashboard
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Certificate ID</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>UIN</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="capitalize flex items-center gap-2">
                        {d.doc_type === 'certificate' && <Award className="h-4 w-4" />}
                        {d.doc_type === 'marksheet' && <GraduationCap className="h-4 w-4" />}
                        {d.doc_type === 'document' && <FileText className="h-4 w-4" />}
                        {d.doc_type}
                      </TableCell>
                      <TableCell>{d.name}</TableCell>
                      <TableCell><code className="text-xs font-mono text-primary">{d.cert_id || '—'}</code></TableCell>
                      <TableCell className="text-sm flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(d.issue_date).toLocaleDateString()}</TableCell>
                      <TableCell><code className="text-xs font-mono">{d.doc_type !== 'certificate' ? (d.number || '—') : '—'}</code></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => view(d.id)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => download(d.id, d.name)}><Download className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


