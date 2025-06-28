# 🚑 HOP-11: Nurse Shift Handoff Companion

**An AI-augmented clinical interface that ensures smooth and complete nurse shift handovers.**

---

## 📌 Overview

HOP-11 is a smart handoff solution designed for hospitals and nursing teams. It helps nurses transition patients more safely by combining AI-driven summarization, real-time updates, and intuitive patient dashboards. The focus is on **minimizing errors**, **saving time**, and **empowering empathy** in clinical communication.

---

## 🧠 Why HOP-11?

Nurse shift changes are often rushed. Verbal summaries can be incomplete or inconsistent. HOP-11 solves this with:

- ✍️ AI-generated handoff summaries
- 🗣️ Voice input support
- ⚠️ Risk and alert flags
- 💊 Medication tracking
- 📋 Smart patient overview

> Built with healthcare empathy at its core.

---

## 🛠 Tech Stack

| Layer         | Technology                                                                    |
| ------------- | ----------------------------------------------------------------------------- |
| Frontend      | [Next.js](https://nextjs.org/), [TypeScript](https://www.typescriptlang.org/) |
| Styling       | Tailwind CSS, ShadCN UI, Lucide Icons                                         |
| State / UI    | React hooks, useState, conditional UI                                         |
| Backend (dev) | Next.js API routes, In-memory mock data                                       |
| AI (planned)  | NLP-based summarization, rule-based checker                                   |
| Voice Input   | Web Speech API or Whisper (planned)                                           |

---

## 📁 Folder Structure

```bash
.
├── app/
│   ├── api/
│   │   └── patient-details/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── backend/
│   ├── api/
│   ├── lib/
│   ├── models/
│   ├── scripts/
│   ├── Server.ts
│   └── Users.ts
├── components/
│   ├── ui/
│   │   ├── add-medication-modal.tsx
│   │   ├── add-patient-modal.tsx
│   │   ├── clock.tsx
│   │   ├── edit-patient-modal.tsx
│   │   ├── patient-details-ai.tsx
│   │   ├── patient-details-client.tsx
│   │   ├── theme-provider.tsx
│   │   ├── update-vitals-modal.tsx
│   │   └── warm-patient-card.tsx
├── hooks/
├── lib/
├── public/
│   └── speech-web-api-wrapper/
├── styles/
├── types/
├── .gitignore
├── .hintrc
├── components.json
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
```

---

## 🧹 Core Features

- ✅ Add/Edit/View patients
- ✅ Add/Mark/Hold/Discontinue medications
- ✅ AI Assistant Modal (UX in place)
- ✅ Patient vitals + risk display
- 🧠 Handoff summary generation (NLP-based)
- 🗣️ Voice input for notes/summaries (planned)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/hop-11-nurse-handoff
cd hop-11-nurse-handoff
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Visit `http://localhost:3000` to view the application.

---

## 🧠 AI/ML in Use (Planned & In Progress)

| Module                 | AI/ML Usage Idea                                         |
| ---------------------- | -------------------------------------------------------- |
| 🧠 Summary Generator   | Convert brief inputs to full handoff summaries           |
| ✅ Checklist Validator | Ensure no critical info is missed (allergies, labs etc.) |
| 🗣️ Voice Input         | Use Web Speech API or Whisper to convert voice to text   |
| ⚠️ Risk Flagging       | Use heuristics/ML to highlight critical patients         |

---

## 🌟 Hackathon Goals (What to Tell Mentors)

- We're solving a **real-world clinical problem**: nurse shift handoff errors.
- Built with a **modular frontend**, plug-in AI logic, and secure local processing.
- Using **AI for NLP summaries and automated completeness checks**.
- Offline-first, no OpenAI dependency, designed with **privacy-first principles**.
- Focus on **human-first workflows**: intuitive, fast, and supportive for nurses.

---

## ✅ Milestones

- ***

## 👨‍⚕️ Authors

Created by **Ansh Tank** and team\
📧 Contact via [GitHub](https://github.com/AnshTank)

---

> “Great handoffs save lives. We built HOP-11 to make sure nothing gets missed.”
