
export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  google_course_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CourseMaterial {
  id: string;
  course_id: string;
  title: string;
  description: string;
  content_type: 'document' | 'video' | 'link' | 'assignment';
  content_url: string;
  google_material_id: string | null;
  created_at: string;
  updated_at: string;
}
