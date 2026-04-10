"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const GetUserProfile_1 = require("../../application/use-cases/user/GetUserProfile");
const UpdateUserProfile_1 = require("../../application/use-cases/user/UpdateUserProfile");
const SupabaseUserRepository_1 = require("../../infrastructure/supabase/repositories/SupabaseUserRepository");
/**
 * Acts as the Facade/Controller for the User domain.
 * The consuming application (like Next.js) instantiates this
 * by passing its configured SupabaseClient (with appropriate auth context).
 */
class UserController {
    getUserProfile;
    updateUserProfile;
    constructor(supabaseClient) {
        const userRepository = new SupabaseUserRepository_1.SupabaseUserRepository(supabaseClient);
        this.getUserProfile = new GetUserProfile_1.GetUserProfileUseCase(userRepository);
        this.updateUserProfile = new UpdateUserProfile_1.UpdateUserProfileUseCase(userRepository);
    }
    async getProfile(userId) {
        return this.getUserProfile.execute(userId);
    }
    async updateProfile(dto) {
        return this.updateUserProfile.execute(dto);
    }
}
exports.UserController = UserController;
