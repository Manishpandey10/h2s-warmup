-- Real official reference notes reviewed on 2026-10-17, not example user data.
-- These are deliberately limited summaries. Recheck the linked pages before submission.
-- They expire from AI retrieval after 180 days unless reviewed again.
begin;
insert into public.guidance_sources (title, url, category, content, jurisdiction, verified_on, status) values
('e-Shram: welfare awareness and registration', 'https://eshram.gov.in/faqs', 'schemes',
 'e-Shram One-Stop Solution brings together social security and welfare scheme information for unorganised workers. Existing e-Shram registrants do not need to register again; they can use their UAN to sign in. Registration is not a guarantee of every scheme benefit. This reference does not establish an individual worker''s eligibility or any payment amount.',
 'India', '2026-10-17', 'published'),
('myScheme: discover government schemes', 'https://www.myscheme.gov.in/about', 'schemes',
 'myScheme is a Government of India platform for discovering government schemes based on a citizen''s eligibility information. It helps users find scheme information and application guidance. Use the official platform to check the conditions of a specific scheme. This note does not establish eligibility, benefits, deadlines, or approval for any individual scheme.',
 'India', '2026-10-17', 'published'),
('e-Shram: registration document help', 'https://eshram.gov.in/faqs', 'documents',
 'The e-Shram FAQ lists an Aadhaar number and an Aadhaar-linked mobile number for registration. A worker without an Aadhaar-linked mobile number may visit a Common Service Centre or State Seva Kendra for biometric registration. Do not enter Aadhaar details in RozMitra. Use the official portal or visit the relevant centre. This note does not cover document requirements for other schemes.',
 'India', '2026-10-17', 'published'),
('Gig and platform workers: official social security overview', 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2200767', 'rights',
 'This Government of India backgrounder, published 9 December 2025, describes recognition of gig and platform workers under the Code on Social Security, e-Shram self-registration, and provisions for government-notified social security schemes. It says the appropriate Government may establish grievance support facilities. It does not confirm an individual entitlement, an operational grievance facility in a particular state, or a payment dispute deadline. Check applicable official notifications before acting.',
 'India', '2026-10-17', 'published'),
('Outdoor work: heat precautions', 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2262274', 'safety',
 'The official heat advisory includes shaded rest areas, regular hydration breaks, acclimatization for workers, and awareness of heat stress symptoms. It asks citizens to follow India Meteorological Department weather updates and take precautions during heatwave alerts. This is general prevention information, not diagnosis or treatment, and does not establish current weather conditions at the worker''s location.',
 'India', '2026-10-17', 'published');
commit;
