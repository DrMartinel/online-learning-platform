export declare class Course {
    id: string;
    instructorId: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    isPublished: boolean;
    createdAt: Date;
    updatedAt?: Date | undefined;
    constructor(id: string, instructorId: string, title: string, description: string | null, thumbnailUrl: string | null, isPublished: boolean, createdAt: Date, updatedAt?: Date | undefined);
    publish(): void;
    unpublish(): void;
    updateTitle(title: string): void;
}
//# sourceMappingURL=Course.d.ts.map