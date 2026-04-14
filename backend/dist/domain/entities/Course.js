"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Course = void 0;
class Course {
    id;
    instructorId;
    title;
    description;
    thumbnailUrl;
    isPublished;
    createdAt;
    updatedAt;
    constructor(id, instructorId, title, description, thumbnailUrl, isPublished, createdAt, updatedAt) {
        this.id = id;
        this.instructorId = instructorId;
        this.title = title;
        this.description = description;
        this.thumbnailUrl = thumbnailUrl;
        this.isPublished = isPublished;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    publish() {
        this.isPublished = true;
    }
    unpublish() {
        this.isPublished = false;
    }
    updateTitle(title) {
        if (!title || title.trim().length === 0) {
            throw new Error('Title cannot be empty');
        }
        this.title = title;
    }
}
exports.Course = Course;
