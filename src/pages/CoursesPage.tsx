import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import MainLayout from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/types/auth";
import { Book } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import type { Course } from "@/types/course";
import { fetchGoogleClassroomCourses } from "@/utils/googleApiUtils";
import { log } from "node:console";
import { set } from "date-fns";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  onSelect: () => void;
}

const CourseCard = ({
  id,
  title,
  description,
  thumbnail,
  onSelect,
}: CourseCardProps) => {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-unisphere-gray flex items-center justify-center">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Book className="h-12 w-12 text-unisphere-blue/30" />
        )}
      </div>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={onSelect}>
          View Materials
        </Button>
      </CardFooter>
    </Card>
  );
};

const CoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.session.user.id)
          .single();

        if (profileData) {
          setUserRole(profileData.role as UserRole);
        }
      }
    };

    const fetchCourses = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session) return;

        const userId = session.session.user.id;

        // For students, fetch only enrolled courses
        // For teachers, fetch courses they're assigned to
        // For admin/super_admin, fetch all courses
        let query;
        console.log(userRole);
        
        const classroom_course = await fetchGoogleClassroomCourses(userId);
        console.log("classroom_course", classroom_course);

        if (userRole === "student") {
          // 1. Fetch courses from Google Classroom
          const classroomCourses = await fetchGoogleClassroomCourses(userId);
          console.log("Fetched Google Classroom courses:", classroomCourses);

          if (!classroomCourses) {
            toast({
              title: "Error",
              description: "Failed to load Google Classroom courses",
              variant: "destructive",
            });
            return;
          }

          // 2. Extract all Google course IDs
          const googleCourseIds = classroomCourses.map((course) => course.id);

          // 3. Query Supabase to get only courses that match those Google IDs
          const { data: supabaseCourses, error } = await supabase
            .from("courses")
            .select("*"); // Make sure your Supabase table has this column
          console.log("gc"+googleCourseIds);
          console.log("c"+supabaseCourses);

          if (error) {
            console.error(
              "Error fetching matching courses from Supabase:",
              error
            );
            toast({
              title: "Error",
              description: "Failed to load your enrolled courses",
              variant: "destructive",
            });
            return;
          }

          // 4. Set only the courses that are present in both
          setCourses(supabaseCourses as Course[]);
        }

        // if (userRole === "student") {
        //   // Join course_enrollments with courses to get enrolled courses
        //   const { data, error } = await supabase
        //     .from("course_enrollments")
        //     .select("courses(*)")
        //     .eq("student_id", userId);

        //   if (error) {
        //     console.error("Error fetching enrolled courses:", error);
        //     toast({
        //       title: "Error",
        //       description: "Failed to load courses",
        //       variant: "destructive",
        //     });
        //   } else if (data) {
        //     // Fix: When using select("courses(*)"), each item contains a nested courses object
        //     // We need to extract each course object properly
        //     const enrolledCourses = data.map(enrollment => enrollment.courses as unknown as Course);
        //     setCourses(enrolledCourses);
        //   }
        // }
        else if (userRole === "teacher") {
          // For teachers, fetch courses they're assigned to
          query = supabase.from("courses").select("*").eq("assigned_teacher_id", userId);
          const { data, error } = await query;

          if (error) {
            console.error("Error fetching courses:", error);
            toast({
              title: "Error",
              description: "Failed to load courses",
              variant: "destructive",
            });
          } else if (data) {
            setCourses(data as Course[]);
          }
        } else if (userRole === "admin" || userRole === "super_admin") {
          // For admins, fetch all courses
          query = supabase.from("courses").select("*");
          const { data, error } = await query;

          if (error) {
            console.error("Error fetching courses:", error);
            toast({
              title: "Error",
              description: "Failed to load courses",
              variant: "destructive",
            });
          } else if (data) {
            setCourses(data as Course[]);
          }
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    (async function (){
      await fetchUserRole();
    setTimeout(() => {
      fetchCourses();
    }, 100);})() // Small delay to ensure userRole is set
  }, [userRole, toast]);

  const handleSelectCourse = (courseId: string) => {
    navigate(`/courses/${courseId}/materials`);
  };

  const handleCreateCourse = () => {
    navigate("/courses/new");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Courses</h1>
{/* 
          {(userRole === "teacher" ||
            userRole === "admin" ||
            userRole === "super_admin") && (
            <Button asChild>
              <a href="/courses/new">Create Course</a>
            </Button>
          )} */}
        </div>

        {loading ? (
          <p>Loading courses...</p>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium mb-2">No courses found</h2>
            <p className="text-muted-foreground mb-6">
              {userRole === "student"
                ? "You are not enrolled in any courses yet"
                : userRole === "teacher" ||
                  userRole === "admin" ||
                  userRole === "super_admin"
                ? "Create your first course to get started"
                : "No courses are available at the moment"}
            </p>

            {/* {(userRole === "teacher" ||
              userRole === "admin" ||
              userRole === "super_admin") && (
              <Button onClick={handleCreateCourse}>Create Course</Button>
            )} */}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description}
                thumbnail={course.thumbnail_url}
                onSelect={() => handleSelectCourse(course.google_course_id)}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CoursesPage;
