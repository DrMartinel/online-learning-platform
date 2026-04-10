"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const SignUp_1 = require("../../application/use-cases/auth/SignUp");
const SignIn_1 = require("../../application/use-cases/auth/SignIn");
const SignOut_1 = require("../../application/use-cases/auth/SignOut");
const SupabaseAuthRepository_1 = require("../../infrastructure/supabase/repositories/SupabaseAuthRepository");
class AuthController {
    signUpUseCase;
    signInUseCase;
    signOutUseCase;
    constructor(supabaseClient) {
        const authRepository = new SupabaseAuthRepository_1.SupabaseAuthRepository(supabaseClient);
        this.signUpUseCase = new SignUp_1.SignUpUseCase(authRepository);
        this.signInUseCase = new SignIn_1.SignInUseCase(authRepository);
        this.signOutUseCase = new SignOut_1.SignOutUseCase(authRepository);
    }
    async signUp(dto) {
        return this.signUpUseCase.execute(dto);
    }
    async signIn(dto) {
        return this.signInUseCase.execute(dto);
    }
    async signOut() {
        return this.signOutUseCase.execute();
    }
}
exports.AuthController = AuthController;
