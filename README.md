# Careva
Family health organiser: medicines, prescriptions, reports, doctor visits, family members.

## Run locally
    npm install
    npm run dev
With no `.env`, Careva runs in **demo mode** (data saved in your browser only).

## Connect Supabase
1. Create a project at supabase.com.
2. Run `supabase/schema.sql`, then `supabase/policies.sql` in the SQL editor.
3. Copy `.env.example` to `.env` and add your project URL and anon key.
4. Authentication > Providers: enable Email.

## Automatic prescription reading
Built in: uploads are read in the browser with OCR (tesseract.js), then the hospital, doctor, date, follow-up and medicines are filled in for you to check. It works best on clear, printed prescriptions; handwriting is often misread. The first upload downloads about 10 MB of language data, so it needs internet.

### Optional: higher accuracy with Claude
Deploy the edge function so uploads fill in date, hospital, medicines and follow-up:
    supabase secrets set ANTHROPIC_API_KEY=your_key
    supabase functions deploy extract-prescription
Without it, the upload form opens empty and you type the details.

## Before public launch
Review RLS policies, add email confirmation, and get legal advice on storing health data.
