"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupabaseClientForRequest = createSupabaseClientForRequest;
const supabase_js_1 = require("@supabase/supabase-js");
function createSupabaseClientForRequest(authorizationHeader) {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
        throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    }
    const token = extractBearerToken(authorizationHeader);
    return (0, supabase_js_1.createClient)(url, anonKey, {
        global: {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
    });
}
function extractBearerToken(header) {
    if (!header)
        return undefined;
    const match = header.match(/^Bearer\s+(.+)$/i);
    return match?.[1]?.trim() || undefined;
}
