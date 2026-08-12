CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "roles_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "portal_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"hubspot_contact_id" text NOT NULL,
	"hubspot_company_id" text NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"role_id" integer NOT NULL,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "portal_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "user_location_access" (
	"id" serial PRIMARY KEY NOT NULL,
	"portal_user_id" integer NOT NULL,
	"hubspot_location_id" text NOT NULL,
	"can_order" boolean DEFAULT true NOT NULL,
	CONSTRAINT "user_location_access_portal_user_id_hubspot_location_id_unique" UNIQUE("portal_user_id","hubspot_location_id")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"portal_user_id" integer NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"sku" text NOT NULL,
	"shopify_product_id" text,
	"shopify_variant_id" text,
	"name" text NOT NULL,
	"product_line" text NOT NULL,
	"description" text NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"image_url" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"sku_snapshot" text NOT NULL,
	"name_snapshot" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"line_total_cents" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"hubspot_company_id" text NOT NULL,
	"hubspot_location_id" text NOT NULL,
	"hubspot_contact_id" text NOT NULL,
	"portal_user_id" integer NOT NULL,
	"placed_by_role" text NOT NULL,
	"po_number" text NOT NULL,
	"order_notes" text,
	"ship_snapshot" jsonb NOT NULL,
	"billing_snapshot" jsonb NOT NULL,
	"payment_terms_snapshot" text NOT NULL,
	"net_days_snapshot" integer,
	"payment_status" text NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"shipping_cents" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"shopify_order_id" text,
	"shopify_order_number" text,
	"hubspot_po_id" text,
	"hubspot_po_status" text DEFAULT 'pending' NOT NULL,
	"ordered_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "location_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"hubspot_company_id" text NOT NULL,
	"requested_by_user_id" integer NOT NULL,
	"nickname" text NOT NULL,
	"address1" text NOT NULL,
	"address2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip" text NOT NULL,
	"phone" text,
	"validated" boolean DEFAULT false NOT NULL,
	"place_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"resolved_by" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"to_address" text NOT NULL,
	"cc_address" text,
	"subject" text NOT NULL,
	"body_text" text NOT NULL,
	"category" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"system" text NOT NULL,
	"operation" text NOT NULL,
	"direction" text DEFAULT 'outbound' NOT NULL,
	"payload_json" jsonb NOT NULL,
	"result_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hs_companies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"org_type" text NOT NULL,
	"allow_admin_billing_edit" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hs_billing_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"address1" text NOT NULL,
	"address2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip" text NOT NULL,
	"ap_email" text NOT NULL,
	"ap_phone" text,
	"payment_terms" text NOT NULL,
	"net_days" integer,
	"is_default" boolean DEFAULT false NOT NULL,
	"validated" boolean DEFAULT true NOT NULL,
	"place_id" text
);
--> statement-breakpoint
CREATE TABLE "hs_locations" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"billing_profile_id" text NOT NULL,
	"nickname" text NOT NULL,
	"address1" text NOT NULL,
	"address2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip" text NOT NULL,
	"phone" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"validated" boolean DEFAULT true NOT NULL,
	"place_id" text,
	"validation_source" text DEFAULT 'mock' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hs_contact_emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" text NOT NULL,
	"email" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	CONSTRAINT "hs_contact_emails_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "hs_contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"role_title" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "portal_users" ADD CONSTRAINT "portal_users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_location_access" ADD CONSTRAINT "user_location_access_portal_user_id_portal_users_id_fk" FOREIGN KEY ("portal_user_id") REFERENCES "public"."portal_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_portal_user_id_portal_users_id_fk" FOREIGN KEY ("portal_user_id") REFERENCES "public"."portal_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_portal_user_id_portal_users_id_fk" FOREIGN KEY ("portal_user_id") REFERENCES "public"."portal_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_requests" ADD CONSTRAINT "location_requests_requested_by_user_id_portal_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."portal_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_log" ADD CONSTRAINT "integration_log_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hs_billing_profiles" ADD CONSTRAINT "hs_billing_profiles_company_id_hs_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."hs_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hs_locations" ADD CONSTRAINT "hs_locations_company_id_hs_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."hs_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hs_locations" ADD CONSTRAINT "hs_locations_billing_profile_id_hs_billing_profiles_id_fk" FOREIGN KEY ("billing_profile_id") REFERENCES "public"."hs_billing_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hs_contact_emails" ADD CONSTRAINT "hs_contact_emails_contact_id_hs_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."hs_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hs_contacts" ADD CONSTRAINT "hs_contacts_company_id_hs_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."hs_companies"("id") ON DELETE no action ON UPDATE no action;