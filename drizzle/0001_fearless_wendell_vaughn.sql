DROP INDEX "form_id_created_idx";--> statement-breakpoint
DROP INDEX "user_slug_idx";--> statement-breakpoint
DROP INDEX "ip_hash_created_idx";--> statement-breakpoint
DROP INDEX "form_id_order_idx";--> statement-breakpoint
CREATE INDEX "form_responses_form_id_created_at_idx" ON "form_responses" USING btree ("form_id","created_at");--> statement-breakpoint
CREATE INDEX "forms_user_slug_published_idx" ON "forms" USING btree ("user_id","slug","published");--> statement-breakpoint
CREATE INDEX "ip_rate_log_ip_hash_created_idx" ON "ip_rate_log" USING btree ("ip_hash","created_at");--> statement-breakpoint
CREATE INDEX "ip_rate_log_ip_hash_form_id_idx" ON "ip_rate_log" USING btree ("ip_hash","form_id");--> statement-breakpoint
CREATE INDEX "questions_form_order_idx" ON "questions" USING btree ("form_id","order_index");