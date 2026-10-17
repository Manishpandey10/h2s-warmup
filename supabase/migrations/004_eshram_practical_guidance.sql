-- Run after 003. Facts checked against https://eshram.gov.in/faqs on 2026-10-17.
-- Adds practical steps to the existing official e-Shram reference; no worker data.
begin;

update public.guidance_sources
set content = 'e-Shram is the Government of India database for unorganised workers. Registration gives a UAN card; it does not by itself prove enrolment in an insurance or other benefit. The e-Shram One-Stop Solution lists schemes, including insurance schemes such as PMJJBY and PMSBY, but each scheme has its own conditions. A registered worker can use their UAN to log in; they do not need to register again. After login, the homepage has Find Eligible Schemes and My Enrolled Schemes. Under Enrol for Government Schemes there is an Insurance category. For a scheme, Apply means the worker is not enrolled; View means enrolled and opens benefit details. The app cannot see a worker''s personal scheme status. If the worker cannot use the website, the official e-Shram helpdesk is 14434 and is available 9 AM–6 PM daily, including Sundays. Do not ask the worker to share their UAN, Aadhaar number, OTP, or password in RozMitra.',
    verified_on = '2026-10-17'
where title = 'e-Shram: welfare awareness and registration'
  and url = 'https://eshram.gov.in/faqs'
  and category = 'schemes'
  and status = 'published';

commit;
