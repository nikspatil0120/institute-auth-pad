import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Plus, Edit2, Trash2, Users, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import DemoModeBanner from "@/components/DemoModeBanner";
import { getCurrentInstituteName } from "@/lib/institute-utils";

interface Student {
  id: string;
  rollNo: string;
  name: string;
  course: string;
  year: string;
  institute_name: string;
}

interface StudentForm {
  rollNo: string;
  name: string;
  course: string;
  year: string;
}

export default function StudentManagement() {
  const { toast } = useToast();
  const { instituteName } = useParams<{ instituteName: string }>();
  const currentInstituteName = getCurrentInstituteName() || instituteName || 'Unknown Institute';
  
  const sortStudents = (list: Student[]) =>
    [...list].sort((a, b) => a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true, sensitivity: 'base' }));

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const stored = localStorage.getItem("students");
      if (stored) {
        const allStudents = JSON.parse(stored) as Student[];
        // Filter students for current institute only
        // Handle both old records (without institute_name) and new records (with institute_name)
        const instituteStudents = allStudents.filter(s => 
          !s.institute_name || s.institute_name === currentInstituteName
        );
        return sortStudents(instituteStudents);
      }
    } catch {}
    return sortStudents([
      {
        id: "1",
        rollNo: "23102A0001",
        name: "SWAROOP NAIK",
        course: "Computer Engineering",
        year: "2023",
        institute_name: currentInstituteName
      },
      {
        id: "2",
        rollNo: "23102A0002",
        name: "TANISHA GUPTA",
        course: "Computer Engineering",
        year: "2023",
        institute_name: currentInstituteName
      },
      {
        id: "3",
        rollNo: "24102A2001",
        name: "SIDDHI GAWADE",
        course: "Computer Engineering",
        year: "2024",
        institute_name: currentInstituteName
      }
    ]);
  });

  useEffect(() => {
    try {
      // Get all students from localStorage
      const stored = localStorage.getItem("students");
      let allStudents: Student[] = [];
      if (stored) {
        allStudents = JSON.parse(stored) as Student[];
      }
      
      // Add institute_name to students that don't have it (backward compatibility)
      const updatedAllStudents = allStudents.map(s => ({
        ...s,
        institute_name: s.institute_name || currentInstituteName
      }));
      
      // Remove current institute's students and add updated ones
      const otherInstituteStudents = updatedAllStudents.filter(s => s.institute_name !== currentInstituteName);
      const finalStudents = [...otherInstituteStudents, ...students];
      
      localStorage.setItem("students", JSON.stringify(finalStudents));
    } catch {}
  }, [students, currentInstituteName]);

  const [form, setForm] = useState<StudentForm>({
    rollNo: '',
    name: '',
    course: '',
    year: ''
  });

  const [dragOver, setDragOver] = useState(false);

  const handleInputChange = (field: keyof StudentForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.rollNo || !form.name || !form.course || !form.year) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all fields."
      });
      return;
    }

    // Enforce unique roll number
    const rollExists = students.some((s) => s.rollNo.toLowerCase() === form.rollNo.toLowerCase());
    if (rollExists) {
      toast({
        variant: "destructive",
        title: "Duplicate Roll Number",
        description: `A student with roll no \"${form.rollNo}\" already exists.`,
      });
      return;
    }

    const newStudent: Student = {
      id: Date.now().toString(),
      rollNo: form.rollNo,
      name: form.name,
      course: form.course,
      year: form.year,
      institute_name: currentInstituteName
    };

    setStudents(prev => sortStudents([...prev, newStudent]));
    setForm({ rollNo: '', name: '', course: '', year: '' });
    
    toast({
      title: "Student Added",
      description: `${newStudent.name} has been added successfully.`
    });
  };

  const handleDeleteStudent = (id: string) => {
    const student = students.find(s => s.id === id);
    setStudents(prev => sortStudents(prev.filter(s => s.id !== id)));
    
    toast({
      title: "Student Removed",
      description: `${student?.name} has been removed from the list.`
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const csv = event.target?.result as string;
        parseCSV(csv);
      };
      reader.readAsText(file);
    } else {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please upload a valid CSV file."
      });
    }
  };

  const parseCSV = (csvContent: string) => {
    try {
      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Expected headers: Sr No, Year, Roll No, Name, Course
      const expectedHeaders = ['Sr No', 'Year', 'Roll No', 'Name', 'Course'];
      const hasValidHeaders = expectedHeaders.every(header => 
        headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
      );

      if (!hasValidHeaders) {
        toast({
          variant: "destructive",
          title: "Invalid CSV Format",
          description: "CSV must contain columns: Sr No, Year, Roll No, Name, Course"
        });
        return;
      }

      const newStudents: Student[] = [];
      let duplicates = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= 5 && values[0] && values[1] && values[2] && values[3] && values[4]) {
          const student: Student = {
            id: Date.now().toString() + i,
            rollNo: values[2], // Roll No
            name: values[3],   // Name
            course: values[4], // Course
            year: values[1],   // Year
            institute_name: currentInstituteName
          };
          // Skip if roll number already exists in current or new list
          const existsInCurrent = students.some(s => s.rollNo.toLowerCase() === student.rollNo.toLowerCase());
          const existsInBatch = newStudents.some(s => s.rollNo.toLowerCase() === student.rollNo.toLowerCase());
          if (existsInCurrent || existsInBatch) {
            duplicates++;
          } else {
            newStudents.push(student);
          }
        }
      }

      if (newStudents.length > 0) {
        setStudents(prev => sortStudents([...prev, ...newStudents]));
        toast({
          title: "CSV Import Successful",
          description: `${newStudents.length} students imported successfully.${duplicates ? ` Skipped ${duplicates} duplicate roll nos.` : ''}`
        });
      } else {
        toast({
          variant: "destructive",
          title: "No Valid Data",
          description: duplicates ? `All rows were duplicates by roll no.` : "No valid student records found in the CSV file."
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "CSV Parse Error",
        description: "Failed to parse CSV file. Please check the format."
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
      const reader = new FileReader();
      reader.onload = (event) => {
        const csv = event.target?.result as string;
        parseCSV(csv);
      };
      reader.readAsText(csvFile);
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
        <Navigation />
        <DemoModeBanner />
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
            <div className="mt-3">
              <Button
                variant="outline"
                className="border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  if (confirm('This will remove all students. Continue?')) {
                    setStudents([]);
                    try { localStorage.setItem('students', JSON.stringify([])); } catch {}
                    toast({ title: 'All Students Removed', description: 'The student list has been cleared.' });
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove All
              </Button>
            </div>
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