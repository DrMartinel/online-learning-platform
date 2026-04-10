"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
class User {
    id;
    fullName;
    role;
    createdAt;
    constructor(id, fullName, role, createdAt) {
        this.id = id;
        this.fullName = fullName;
        this.role = role;
        this.createdAt = createdAt;
    }
    isInstructor() {
        return this.role === 'instructor' || this.role === 'admin';
    }
    isAdmin() {
        return this.role === 'admin';
    }
    updateFullName(newName) {
        if (newName.trim().length === 0) {
            throw new Error('Full name cannot be empty');
        }
        this.fullName = newName.trim();
    }
}
exports.User = User;
