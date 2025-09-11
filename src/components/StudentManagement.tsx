import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Plus, Edit2, Trash2, Users, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  rollNo: string;
  name: string;
  course: string;
  year: string;
  marks: number;
  certificateId: string;
}

interface StudentForm {
  rollNo: string;
  name: string;
  course: string;
  year: string;
  marks: string;
}

export default function StudentManagement() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([
    {
      id: "1",
      rollNo: "CS001",
      name: "John Doe",
      course: "Computer Science",
      year: "2024",
      marks: 85,
      certificateId: "CERT001"
    },
    {
      id: "2",
      rollNo: "EE002",
      name: "Jane Smith",
      course: "Electrical Engineering",
      year: "2023",
      marks: 92,
      certificateId: "CERT002"
    },
    {
      id: "3",
      rollNo: "ME003",
      name: "Mike Johnson",
      course: "Mechanical Engineering",
      year: "2024",
      marks: 78,
      certificateId: "CERT003"
    }
  ]);

  const [form, setForm] = useState<StudentForm>({
    rollNo: '',
    name: '',
    course: '',
    year: '',
    marks: ''
  });

  const [dragOver, setDragOver] = useState(false);

  const handleInputChange = (field: keyof StudentForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.rollNo || !form.name || !form.course || !form.year || !form.marks) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all fields."
      });
      return;
    }

    const newStudent: Student = {
      id: Date.now().toString(),
      rollNo: form.rollNo,
      name: form.name,
      course: form.course,
      year: form.year,
      marks: parseInt(form.marks),
      certificateId: `CERT${String(students.length + 1).padStart(3, '0')}`
    };

    setStudents(prev => [...prev, newStudent]);
    setForm({ rollNo: '', name: '', course: '', year: '', marks: '' });
    
    toast({
      title: "Student Added",
      description: `${newStudent.name} has been added successfully.`
    });
  };

  const handleDeleteStudent = (id: string) => {
    const student = students.find(s => s.id === id);
    setStudents(prev => prev.filter(s => s.id !== id));
    
    toast({
      title: "Student Removed",
      description: `${student?.name} has been removed from the list.`
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      toast({
        title: "CSV Upload",
        description: `File "${file.name}" uploaded successfully. Processing...`
      });
    } else {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please upload a valid CSV file."
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.type === 'text/csv');
    
    if (csvFile) {
      toast({
        title: "CSV Dropped",
        description: `File "${csvFile.name}" received. Processing...`
      });
    } else {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please drop a valid CSV file."
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Student Management</h1>
            <p className="text-muted-foreground">Manage student records and certificates</p>
          </div>
        </div>

        {/* Top Section: Upload & Add Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CSV Upload Card */}
          <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Import Students
              </CardTitle>
              <CardDescription>
                Upload a CSV file to bulk import student records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Drop CSV file here</p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse files
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <Button asChild variant="outline" className="border-primary/50 hover:bg-primary/10">
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    Choose File
                  </label>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Add Student Form */}
          <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Add New Student
              </CardTitle>
              <CardDescription>
                Manually add individual student records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rollNo">Roll Number</Label>
                    <Input
                      id="rollNo"
                      placeholder="CS001"
                      value={form.rollNo}
                      onChange={(e) => handleInputChange('rollNo', e.target.value)}
                      className="bg-input border-border/50 focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      placeholder="2024"
                      value={form.year}
                      onChange={(e) => handleInputChange('year', e.target.value)}
                      className="bg-input border-border/50 focus:border-primary/50"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-input border-border/50 focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <Input
                    id="course"
                    placeholder="Computer Science"
                    value={form.course}
                    onChange={(e) => handleInputChange('course', e.target.value)}
                    className="bg-input border-border/50 focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marks">Marks</Label>
                  <Input
                    id="marks"
                    type="number"
                    placeholder="85"
                    min="0"
                    max="100"
                    value={form.marks}
                    onChange={(e) => handleInputChange('marks', e.target.value)}
                    className="bg-input border-border/50 focus:border-primary/50"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Students Table */}
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-card">
          <CardHeader>
            <CardTitle>Student Records</CardTitle>
            <CardDescription>
              Complete list of all registered students ({students.length} total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">Roll No</TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Course</TableHead>
                    <TableHead className="font-semibold">Year</TableHead>
                    <TableHead className="font-semibold">Marks</TableHead>
                    <TableHead className="font-semibold">Certificate ID</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, index) => (
                    <TableRow 
                      key={student.id}
                      className={`transition-colors hover:bg-muted/30 ${
                        index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                      }`}
                    >
                      <TableCell className="font-medium text-primary">
                        {student.rollNo}
                      </TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.course}</TableCell>
                      <TableCell>{student.year}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          student.marks >= 90 
                            ? 'bg-green-500/20 text-green-400' 
                            : student.marks >= 75 
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {student.marks}%
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {student.certificateId}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStudent(student.id)}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}