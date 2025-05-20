import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import MainLayout from "@/components/layout/MainLayout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileUp,
  Link as LinkIcon,
  FileText,
  Video,
  Eye,
  List,
} from "lucide-react";
import type { Course, CourseMaterial } from "@/types/course";
import { UserRole } from "@/types/auth";
import { fetchGoogleClassroomCoursesMaterials } from "@/utils/googleApiUtils";
import { log } from "console";

const CourseMaterialsPage = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [materialType, setMaterialType] = useState<
    "document" | "video" | "link" | "assignment"
  >("document");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    file: null as File | null,
    link: "",
  });

  useEffect(() => {
    if (!courseId) return;

    const fetchUserRole = async () => {
      const { data } = await supabase.auth.getSession();
      const { data: session } = await supabase.auth.getSession();

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

    const fetchCourseDetails = async () => {
      try {
        // Fetch course details
        const { data } = await supabase.auth.getSession();
        const { data: session } = await supabase.auth.getSession();
        const userId = session.session.user.id;

        if (!session?.session) return;
        const { data: courseData, error: courseError } = await supabase
          .from("courses")
          .select("*")
          .eq("google_course_id", courseId)
          .single();

        if (courseError) {
          throw courseError;
        }

        setCourse(courseData as Course);

        // Fetch course materials
        // const { data: materialsData, error: materialsError } = await supabase
        //   .from("course_materials")
        //   .select("*")
        //   .eq("google_course_id", courseId)
        //   .order("created_at", { ascending: false });
        const classroomMaterials = await fetchGoogleClassroomCoursesMaterials(
          userId,
          courseId
        );
        console.log("classroomMaterials", classroomMaterials);
        // if (materialsError) {
        //   throw materialsError;
        // }

        setMaterials(classroomMaterials as CourseMaterial[]);
      } catch (error) {
        console.error("Error fetching course details:", error);
        toast({
          title: "Error",
          description: "Failed to load course details",
          variant: "destructive",
        });
        // navigate("/courses");
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
    fetchCourseDetails();
  }, [courseId, navigate, toast]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleSubmit = async () => {
    if (!courseId) return;

    // Validate form
    if (!formData.title) {
      toast({
        title: "Missing information",
        description: "Please provide a title for the material",
        variant: "destructive",
      });
      return;
    }

    if (materialType === "link" && !formData.link) {
      toast({
        title: "Missing information",
        description: "Please provide a URL for the link",
        variant: "destructive",
      });
      return;
    }

    if (
      (materialType === "document" || materialType === "video") &&
      !formData.file
    ) {
      toast({
        title: "Missing file",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create form data for API call
      const apiFormData = new FormData();
      apiFormData.append("courseId", courseId);
      apiFormData.append("title", formData.title);
      apiFormData.append("description", formData.description || "");
      apiFormData.append("contentType", materialType);

      if (formData.file) {
        apiFormData.append("file", formData.file);
      }

      if (formData.link) {
        apiFormData.append("contentUrl", formData.link);
      }

      // In a real app, this would be a direct API call to your backend
      // Here we'll simulate the backend process with Supabase

      // 1. First, create a record in the course_materials table
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) throw new Error("Not authenticated");

      const contentUrl =
        materialType === "link"
          ? formData.link
          : `https://classroom.google.com/c/${courseId}/m/[material-id]`; // Placeholder URL

      const { data, error } = await supabase
        .from("course_materials")
        .insert({
          course_id: courseId,
          title: formData.title,
          description: formData.description || "",
          content_type: materialType,
          content_url: contentUrl,
          google_material_id: null, // This would be set by the backend after syncing
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;

      // Add the new material to the list
      if (data && data[0]) {
        setMaterials((prev) => [data[0] as CourseMaterial, ...prev]);
      }

      toast({
        title: "Material uploaded",
        description:
          "Your material has been uploaded and will be synced to Google Classroom",
      });

      // Reset form
      setFormData({ title: "", description: "", file: null, link: "" });
      setDialogOpen(false);
    } catch (error) {
      console.error("Error uploading material:", error);
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your material",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "link":
        return <LinkIcon className="h-4 w-4" />;
      case "assignment":
        return <List className="h-4 w-4" />;
      default:
        return <FileUp className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p>Loading course materials...</p>
        </div>
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p>Course not found</p>
        </div>
      </MainLayout>
    );
  }

  const canUpload =
    userRole === "teacher" ||
    userRole === "admin" ||
    userRole === "super_admin";

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/courses")}
              className="mb-2"
            >
              Back to Courses
            </Button>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="text-muted-foreground">{course.description}</p>
          </div>

          {canUpload && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add Material</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Upload Course Material</DialogTitle>
                  <DialogDescription>
                    Add material to this course. It will be automatically synced
                    to Google Classroom.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="materialType">Material Type</Label>
                    <Select
                      value={materialType}
                      onValueChange={(value: any) => setMaterialType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select material type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="link">Link</SelectItem>
                        <SelectItem value="assignment">Assignment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>

                  {(materialType === "document" ||
                    materialType === "video" ||
                    materialType === "assignment") && (
                    <div>
                      <Label htmlFor="file">Upload File</Label>
                      <Input
                        id="file"
                        type="file"
                        onChange={handleFileChange}
                        required
                      />
                    </div>
                  )}

                  {materialType === "link" && (
                    <div>
                      <Label htmlFor="link">URL</Label>
                      <Input
                        id="link"
                        name="link"
                        type="url"
                        value={formData.link}
                        onChange={handleInputChange}
                        placeholder="https://example.com"
                        required
                      />
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isUploading}>
                    {isUploading ? "Uploading..." : "Upload to Classroom"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {materials.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium mb-2">No materials yet</h2>
            <p className="text-muted-foreground mb-6">
              {canUpload
                ? "Upload your first material to get started"
                : "No materials have been uploaded to this course yet"}
            </p>

            {canUpload && (
              <Button onClick={() => setDialogOpen(true)}>
                Upload Material
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                {/* <TableHead className="w-[120px]">Date Added</TableHead> */}
                {/* <TableHead className="text-right">Actions</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials?.map((material) => (
                <TableRow key={material.id}>
                  
                    <TableCell className="font-medium">
                      {getMaterialIcon(material.content_type)}
                    </TableCell>
                    <a
                  href={
                    material["materials"][0]["driveFile"]["driveFile"][
                      "alternateLink"
                    ]
                  }
                  target="_blank"
                  rel="noreferrer"
                ><TableCell>{material.title}</TableCell></a>
                    <TableCell className="line-clamp-1">
                      {material.description}
                    </TableCell>
                    {/* <TableCell>
                    {new Date(material.created_at).toLocaleDateString()}
                  </TableCell> */}
                    {/* <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </TableCell> */}
                  </TableRow>
                
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </MainLayout>
  );
};

export default CourseMaterialsPage;
