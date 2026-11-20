# RD Studio — Web Development Project

A modern and responsive website built to showcase my web development skills and create a smooth user experience.

## Features
- Clean and responsive user interface
- Modern website design
- Contact form with EmailJS integration
- Supabase database integration for inquiries
- Optional Indian mobile number for contact, and admin-only contact actions and history

## Tech Stack
- HTML
- CSS
- JavaScript
- EmailJS
- Supabase

## Live Demo
https://mywebsite-xi-ashy.vercel.app/

## Contact actions setup

Before deploying the contact form and dashboard changes, run
[`supabase/contact-history.sql`](supabase/contact-history.sql) in the Supabase SQL Editor.
It adds an optional phone column and an admin-only contact history table, without
changing the existing inquiry policies. Ensure the existing public inquiry insert
permissions also allow the new `phone` column, and keep inquiry reads restricted
to the admin. Until this migration is applied, the dashboard reports the
missing phone column and displays existing inquiries without phone numbers.
Inquiries submitted without a phone can still be saved; inquiries with a phone
cannot be saved to the database until the migration is applied.

The form accepts Indian mobile numbers with or without the +91 prefix. Call,
WhatsApp, and email links open the relevant app for review; they do not make a
call or send a message. After completing contact, select the method and use
**Record completed contact** in the dashboard. Opening a link is not recorded.

## Developed By
Reshma Khatoon
