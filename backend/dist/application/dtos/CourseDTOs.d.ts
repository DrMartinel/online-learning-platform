export interface CreateCourseDTO {
    title: string;
    description?: string;
    thumbnailUrl?: string;
}
export interface UpdateCourseDTO {
    id: string;
    title?: string;
    description?: string;
    thumbnailUrl?: string;
    isPublished?: boolean;
}
export interface CourseResponseDTO {
    id: string;
    instructorId: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    isPublished: boolean;
    createdAt: Date;
}
export interface ListCoursesFilterDTO {
    published?: boolean;
    instructorId?: string;
}
//# sourceMappingURL=CourseDTOs.d.ts.map