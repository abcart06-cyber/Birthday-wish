# Analytics Platform Deployment Guide

This guide details the step-by-step instructions to configure, migrate, and deploy your new analytics dashboard to **Vercel** and connect it with **Supabase PostgreSQL**.

---

## Step 1: Create a PostgreSQL Database on Supabase

1. Go to [Supabase](https://supabase.com) and log in or create a free account.
2. Click **New Project** and select or create an organization.
3. Name your project (e.g., `Birthday-Wish-Analytics`), set a secure **Database Password** (save this password somewhere safe!), and choose the region closest to your Vercel deployment.
4. Wait a few minutes for the database to provision.
5. Once ready, go to **Project Settings** (gear icon) -> **Database**.
6. Scroll down to the **Connection strings** section. 
7. Copy the **URI** connection string. Under the **Transaction** tab (port `6543`), the connection string will look like this:
   ```
   postgresql://postgres.[YOUR_PROJECT_ID]:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   ```
   This will be your `DATABASE_URL` environment variable.
8. Switch to the **Session** tab (port `5432`). Copy the connection URI:
   ```
   postgresql://postgres.[YOUR_PROJECT_ID]:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```
   This will be your `DIRECT_URL` environment variable (required by Prisma to perform migrations directly, bypassing pgBouncer).

---

## Step 2: Initialize Database Migrations Locally

1. Open your terminal in the `analytics` project directory:
   ```bash
   cd analytics
   ```
2. Create a temporary `.env` file in the `analytics/` folder (do NOT commit this to Git!):
   ```bash
   touch .env
   ```
3. Add the connections strings copied from Step 1 (replace `[YOUR_PASSWORD]` with your actual password):
   ```env
   DATABASE_URL="postgresql://postgres.[YOUR_PROJECT_ID]:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
   DIRECT_URL="postgresql://postgres.[YOUR_PROJECT_ID]:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
   ```
4. Run the Prisma push command to create all tables and indexes directly on your Supabase instance:
   ```bash
   npx prisma db push
   ```
5. Generate the Prisma Client locally:
   ```bash
   npx prisma generate
   ```

---

## Step 3: Deploy to Vercel

1. Commit and push the new `analytics` directory changes to your GitHub repository:
   ```bash
   git add .
   git commit -m "add full-stack analytics platform"
   git push origin main
   ```
2. Go to [Vercel](https://vercel.com) and log in.
3. Click **Add New** -> **Project**.
4. Import your `Birthday-wish` repository.
5. In the **Project Configuration** panel:
   - Set **Root Directory** to `analytics` (click Edit and select the `analytics` folder).
   - Keep the default Build and Output settings (Next.js preset is automatically selected).
6. Under **Environment Variables**, add the following keys with the values from Step 1:
   - `DATABASE_URL`: *(Your Supabase PGBouncer URI from the Transaction tab)*
   - `DIRECT_URL`: *(Your Supabase direct connection URI from the Session tab)*
7. Click **Deploy**. Vercel will build the React dashboard frontend and automatically provision the serverless tracking API functions.
8. Once deployment succeeds, copy your deployed Vercel URL (e.g., `https://birthday-wish-analytics.vercel.app`).

---

## Step 4: Inject Tracking Script into Website

Now that your serverless backend is live, integrate the tracking code into your birthday wish website:

1. Open [index.html](file:///Users/abc/Desktop/Personal-Project/Her/index.html).
2. Insert the script tag in the `<head>` of the page, right below your script declarations (around line 60):
   ```html
   <!-- Website Analytics Tracker -->
   <script src="https://[YOUR_VERCEL_APP_URL]/analytics.js" defer></script>
   ```
   *(Replace `[YOUR_VERCEL_APP_URL]` with your actual Vercel deployment domain, e.g., `birthday-wish-analytics.vercel.app`)*
3. Commit and push the updated `index.html` to main:
   ```bash
   git add index.html
   git commit -m "integrate analytics tracking script"
   git push origin main
   ```

---

## Step 5: Test the Integration

To verify that analytics are logged correctly:
1. Open your deployed website URL in your browser.
2. Trigger some click events (flip the card, click "Celebrate", scroll down the page).
3. Navigate to your Vercel Dashboard URL `/` or `/dashboard` (e.g., `https://[YOUR_VERCEL_APP_URL]/dashboard`).
4. You should see:
   - The **Live Visitors** count increment to `1`.
   - Your device, browser, OS, and screen resolution correctly logged in the charts.
   - Your click actions showing up under **Top Visited Pages / Element Clicks**.

### Testing Campaign Acquisition (UTM Parameters)
You can test UTM campaign tracking by opening your website with UTM query strings:
```
https://[YOUR_WEBSITE_URL]/?utm_source=whatsapp&utm_medium=message&utm_campaign=birthday-day
```
Open the analytics dashboard, and the campaign name `birthday-day` will register instantly under **UTM Campaigns**!
