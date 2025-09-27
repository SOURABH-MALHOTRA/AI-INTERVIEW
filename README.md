AI Interview Assistant 🎯

An AI-powered interview platform that automates technical interviews for Full-Stack (React/Node) roles. The system manages the entire flow — from resume parsing, to candidate Q&A with timers, to interviewer dashboards with scoring and summaries.

📖 Overview

AI Interview Assistant is a web app designed to streamline the technical interview process.

Candidates upload their resume (PDF/DOCX).

Missing fields (like phone/email) are auto-detected, and the chatbot asks for them before starting.

AI dynamically generates 6 interview questions (2 Easy → 2 Medium → 2 Hard) with timers.

After completion, a final score + summary is generated.

Interviewers can view candidate performance via a dashboard, including search/sort and detailed responses.

🚀 Features
👤 Interviewee Side

Resume Upload: Supports PDF/DOCX. Extracts Name, Email, Phone.

Missing Fields Prompt: AI chatbot asks for missing details.

Interview Flow:

6 questions in total (2 Easy, 2 Medium, 2 Hard).

Dynamic AI-generated questions.

One question at a time in chat format.

Timers per question: Easy (20s), Medium (60s), Hard (120s).

Auto-submit when time runs out.

Persistence: Answers, timers, and progress saved in local storage.

Candidate can refresh/reopen without losing progress.

“Welcome Back” modal for unfinished sessions.

🧑‍💼 Interviewer Side (Dashboard)

Candidate list with final scores + summaries.

Detailed candidate view with all questions, answers, and AI scores.

Search & sort functionality to quickly filter candidates.

🛠️ Tech Stack

Frontend: React, Vite, Ant Design (antd)

State Management: Redux Toolkit + Persist

AI Integration: OpenAI API (via openaiService.js)

Resume Parsing: Custom parser (resumeParser.js)

Persistence: Local Storage (via Redux Persist)
