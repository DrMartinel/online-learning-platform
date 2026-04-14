-- Add DELETE policy for user_progress
CREATE POLICY "Users can delete own progress" ON user_progress FOR DELETE USING (auth.uid() = user_id);
