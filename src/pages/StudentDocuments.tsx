import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
// Student pages use a minimal header instead of institute Navigation
import { Calendar, Download, Eye, FileText, GraduationCap, Award, BarChart3 } from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api";

interface DocumentDto {
  id: number;
  doc_type: string;
  name: string;
  number?: string; // stores UIN for doc/marksheet or deterministic id for certificate
  cert_id?: string; // computed server side
  issue_date: string;
  blockchain_hash: string;
  student_roll?: string;
  uin?: string;
}

export default function StudentDocuments() {
  const { roll } = useParams();
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState<string>("");
  const [docs, setDocs] = useState<DocumentDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // get name from localStorage students list
    try {
      const stored = localStorage.getItem("students");
      if (stored) {
        const list = JSON.parse(stored) as Array<{ rollNo: string; name: string }>;
        const match = list.find(s => s.rollNo.toLowerCase() === String(roll).toLowerCase());
        if (match) setStudentName(match.name);
      }
    } catch {}

    // fetch student docs using student session
    (async () => {
      try {
        const sess = JSON.parse(localStorage.getItem('student_session') || 'null');
        if (!sess) { setLoading(false); return; }
        const params = new URLSearchParams({ roll: sess.roll, institute_id: String(sess.institute_id), password: sess.password });
        const res = await fetch(`${API_BASE_URL}/student/documents?${params.toString()}`);
        const data = await res.json();
        setDocs(data.documents || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [roll]);

  const download = async (id: number, name: string) => {
    const sess = JSON.parse(localStorage.getItem('student_session') || 'null');
    if (!sess) return;
    const params = new URLSearchParams({ roll: sess.roll, institute_id: String(sess.institute_id), password: sess.password });
    const res = await fetch(`${API_BASE_URL}/documents/download/${id}?${params.toString()}`);
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
    const sess = JSON.parse(localStorage.getItem('student_session') || 'null');
    if (!sess) return;
    const params = new URLSearchParams({ roll: sess.roll, institute_id: String(sess.institute_id), password: sess.password });
    window.open(`${API_BASE_URL}/documents/view/${id}?${params.toString()}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-background p-6">
      {/* Minimal student header */}
      <header className="w-full border-b border-border/40 bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/50 mb-6">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/favicon.ico" alt="logo" className="h-6 w-6 rounded" />
            <span className="font-semibold tracking-tight">Student Portal</span>
          </div>
          <div>
            <a href="/student-login" className="text-sm text-muted-foreground hover:text-foreground">Go to Login</a>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto space-y-8">
        <Card className="bg-card/95 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-baseline gap-4">
                <span className="text-2xl font-bold text-foreground">{studentName || 'Student'}</span>
                <span className="text-sm text-muted-foreground">{roll}</span>
              </div>
              {/* No institute dashboard link on student pages */}
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
                      <TableCell><code className="text-xs font-mono text-primary">{d.doc_type === 'certificate' ? (d.cert_id || '—') : '—'}</code></TableCell>
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


