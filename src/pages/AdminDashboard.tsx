import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, LogOut, Building2, FileText, Users, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Institute {
  id: number;
  name: string;
  email: string;
  created_at: string;
  document_count: number;
  student_count: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const API_BASE_URL = "http://localhost:5000/api";
  
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingInstitute, setRemovingInstitute] = useState<number | null>(null);

  useEffect(() => {
    fetchInstitutes();
  }, []);

  const fetchInstitutes = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const res = await fetch(`${API_BASE_URL}/admin/institutes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('admin_token');
          navigate('/admin/login');
          return;
        }
        throw new Error('Failed to fetch institutes');
      }

      const data = await res.json();
      setInstitutes(data.institutes || []);
    } catch (error) {
      console.error('Error fetching institutes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch institutes data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/');
  };

  const handleRegisterInstitute = () => {
    navigate('/admin/register-institute');
  };

  const handleRemoveInstitute = async (instituteId: number, instituteName: string) => {
    setRemovingInstitute(instituteId);
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const res = await fetch(`${API_BASE_URL}/admin/remove-institute/${instituteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('admin_token');
          navigate('/admin/login');
          return;
        }
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to remove institute');
      }

      const data = await res.json();
      
      // Remove from local state
      setInstitutes(prev => prev.filter(inst => inst.id !== instituteId));
      
      toast({
        title: "Success",
        description: data.message || "Institute removed successfully",
      });
    } catch (error) {
      console.error('Error removing institute:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove institute",
        variant: "destructive",
      });
    } finally {
      setRemovingInstitute(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Institute Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleRegisterInstitute}
                className="bg-gradient-primary hover:shadow-glow"
              >
                <Plus className="h-4 w-4 mr-2" />
                Register Institute
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-border/50 hover:bg-muted/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card/95 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Institutes
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{institutes.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Documents
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {institutes.reduce((sum, inst) => sum + inst.document_count, 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Students
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {institutes.reduce((sum, inst) => sum + inst.student_count, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Institutes Table */}
        <Card className="bg-card/95 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Registered Institutes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {institutes.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Institutes Found</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by registering your first institute.
                </p>
                <Button onClick={handleRegisterInstitute} className="bg-gradient-primary hover:shadow-glow">
                  <Plus className="h-4 w-4 mr-2" />
                  Register Institute
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">No.</TableHead>
                      <TableHead>Institution Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Documents Issued</TableHead>
                      <TableHead className="text-center">Students</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                      <TableHead className="text-right w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {institutes.map((institute, index) => (
                      <TableRow key={institute.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-medium">{institute.name}</TableCell>
                        <TableCell className="text-muted-foreground">{institute.email}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            {institute.document_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                            {institute.student_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(institute.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="border-green-500/20 text-green-600">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                                disabled={removingInstitute === institute.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Institute</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove <strong>{institute.name}</strong>? 
                                  This action will permanently delete:
                                  <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>The institute account and login credentials</li>
                                    <li>All documents issued by this institute ({institute.document_count} documents)</li>
                                    <li>All student records ({institute.student_count} students)</li>
                                    <li>All blockchain ledger entries for this institute</li>
                                  </ul>
                                  <strong className="text-destructive">This action cannot be undone.</strong>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveInstitute(institute.id, institute.name)}
                                  className="bg-destructive hover:bg-destructive/90"
                                  disabled={removingInstitute === institute.id}
                                >
                                  {removingInstitute === institute.id ? 'Removing...' : 'Remove Institute'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
