import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  UserPlus,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import { Course } from "@/types/course";
import { UserRole } from "@/types/auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Form schema for creating/editing courses
const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  thumbnail_url: z.string().url("Must be a valid URL").nullable().optional(),
  assigned_teacher_id: z.string().min(1, "Please select a teacher"),
});

type CourseFormData = z.infer<typeof courseSchema>;

const CourseManagementPage = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTeacherSheetOpen, setIsTeacherSheetOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const queryClient = useQueryClient();

  // Fetch courses
  const {
    data: courses,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("courses")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data as Course[];
      } catch (err) {
        console.error("Error fetching courses:", err);
        throw err;
      }
    },
  });
  // ...

  // Fetch teachers
  const {
    data: teachers,
    isLoading: isTeachersLoading,
    error: teachersError,
  } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email") // Assuming you have full_name field
        .eq("role", "teacher"); // Adjust this condition as per your schema

      if (error) throw error;
      return data;
    },
  });

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (course: CourseFormData) => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) throw new Error("Not authenticated");
        console.log(course, sessionData.session.user.id);

        const { data, error } = await supabase
          .from("courses")
          .insert({
            ...course,
            created_by: sessionData.session.user.id,
          })
          .select();

        if (error) throw error;
        return data[0];
      } catch (err) {
        console.error("Error creating course:", err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Course created",
        description: "The course has been created successfully.",
      });
    },
    onError: (error) => {
      console.error("Error creating course:", error);
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async ({
      id,
      course,
    }: {
      id: string;
      course: CourseFormData;
    }) => {
      try {
        const { data, error } = await supabase
          .from("courses")
          .update(course)
          .eq("id", id)
          .select();

        if (error) throw error;
        return data[0];
      } catch (err) {
        console.error("Error updating course:", err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setIsEditDialogOpen(false);
      setSelectedCourse(null);
      toast({
        title: "Course updated",
        description: "The course has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error updating course:", error);
      toast({
        title: "Error",
        description: "Failed to update course. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase.from("courses").delete().eq("id", id);

        if (error) throw error;
        return id;
      } catch (err) {
        console.error("Error deleting course:", err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({
        title: "Course deleted",
        description: "The course has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error("Error deleting course:", error);
      toast({
        title: "Error",
        description: "Failed to delete course. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Sync course with Google Classroom mutation
  const syncCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      try {
        const { data, error } = await supabase.functions.invoke("sync-course", {
          body: { courseId },
        });

        if (error) throw error;
        return data;
      } catch (err) {
        console.error("Error syncing course:", err);
        throw err;
      }
    },
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({
        title: "Course synced",
        description: "The course has been synced with Google Classroom.",
      });
    },
    onError: (error) => {
      console.error("Error syncing course:", error);
      toast({
        title: "Error",
        description:
          "Failed to sync course with Google Classroom. Please ensure you have connected your Google account.",
        variant: "destructive",
      });
    },
  });

  // Add course form
  const addCourseForm = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      thumbnail_url: "",
      assigned_teacher_id: "", // New field
    },
  });

  // Edit course form
  const editCourseForm = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      thumbnail_url: "",
    },
  });

  // Reset form and open add dialog
  const handleAddCourse = () => {
    addCourseForm.reset();
    setIsAddDialogOpen(true);
  };

  // Set form values and open edit dialog
  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    editCourseForm.reset({
      title: course.title,
      description: course.description,
      thumbnail_url: course.thumbnail_url || "",
    });
    setIsEditDialogOpen(true);
  };

  // Confirm before deleting a course
  const handleDeleteCourse = (course: Course) => {
    if (
      window.confirm(
        `Are you sure you want to delete the course "${course.title}"?`
      )
    ) {
      deleteCourseMutation.mutate(course.id);
    }
  };

  // Open teacher assignment sheet
  const handleAssignTeacher = (course: Course) => {
    setSelectedCourse(course);
    setIsTeacherSheetOpen(true);
  };

  // Sync course with Google Classroom
  const handleSyncCourse = (courseId: string) => {
    syncCourseMutation.mutate(courseId);
  };

  // Submit handlers
  const onAddSubmit = (data: CourseFormData) => {
    createCourseMutation.mutate(data);
  };

  const onEditSubmit = (data: CourseFormData) => {
    if (selectedCourse) {
      updateCourseMutation.mutate({ id: selectedCourse.id, course: data });
    }
  };

  return (
    <MainLayout requiredRole={["super_admin", "admin"] as UserRole[]}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Course Management</h1>
          <Button onClick={handleAddCourse}>
            <Plus className="mr-2 h-4 w-4" />
            Add Course
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-6">Loading courses...</div>
            ) : error ? (
              <div className="text-center py-6 text-red-500">
                Error loading courses
              </div>
            ) : courses && courses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Google Sync Status</TableHead>
                    <TableHead className="w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">
                        {course.title}
                      </TableCell>
                      <TableCell className="truncate max-w-[300px]">
                        {course.description}
                      </TableCell>
                      <TableCell>
                        {course.google_course_id ? (
                          <span className="text-green-600">Synced</span>
                        ) : (
                          <span className="text-gray-500">Not synced</span>
                        )}
                      </TableCell>
                      <TableCell className="space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCourse(course)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAssignTeacher(course)}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSyncCourse(course.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteCourse(course)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No courses found</p>
                <p className="text-sm">Get started by adding a new course</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Course Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Course</DialogTitle>
            </DialogHeader>
            <Form {...addCourseForm}>
              <form
                onSubmit={addCourseForm.handleSubmit(onAddSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={addCourseForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter course title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addCourseForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter course description"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addCourseForm.control}
                  name="assigned_teacher_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign Teacher</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full border rounded px-3 py-2"
                        >
                          <option value="">Select a teacher</option>
                          {isTeachersLoading && (
                            <option disabled>Loading teachers...</option>
                          )}
                          {teachers?.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.email}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addCourseForm.control}
                  name="thumbnail_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail URL (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter image URL for thumbnail"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCourseMutation.isPending}
                  >
                    {createCourseMutation.isPending
                      ? "Creating..."
                      : "Create Course"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Course Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
            </DialogHeader>
            <Form {...editCourseForm}>
              <form
                onSubmit={editCourseForm.handleSubmit(onEditSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={editCourseForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter course title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editCourseForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter course description"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editCourseForm.control}
                  name="thumbnail_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail URL (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter image URL for thumbnail"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateCourseMutation.isPending}
                  >
                    {updateCourseMutation.isPending
                      ? "Updating..."
                      : "Update Course"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Teacher Assignment Sheet - Placeholder UI */}
        <Sheet open={isTeacherSheetOpen} onOpenChange={setIsTeacherSheetOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Assign Teachers</SheetTitle>
            </SheetHeader>
            <div className="py-6">
              <p className="text-sm text-muted-foreground mb-4">
                Select teachers to assign to this course:
              </p>
              {/* Teacher assignment functionality would go here */}
              <div className="text-center py-4 text-muted-foreground">
                Teacher assignment functionality coming soon.
              </div>
            </div>
            <SheetFooter>
              <Button onClick={() => setIsTeacherSheetOpen(false)}>Done</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </MainLayout>
  );
};

export default CourseManagementPage;
