# Task 3: Dynamic To-Do List App - TaskFlow

A feature-rich, fully responsive dynamic To-Do application built with **Vanilla JavaScript**. This project was developed as part of the Frontend Developer Internship program at Auspify Technologies.

## 🚀 Live Demo
*(Tambahkan link GitHub Pages Anda di sini nanti, contoh: [Live Demo](https://kusnadi34.github.io/Task-3-Dynamic-ToDo-List-App/))*

## ✨ Features

- **Task Management:** Add, edit, delete, and mark tasks as completed.
- **Subtasks:** Break down larger tasks into smaller, manageable sub-items.
- **Lists & Tags:** Organize tasks into custom lists (e.g., Personal, Work) and assign tags for better filtering.
- **Views:** Multiple ways to view your tasks: *Today*, *Upcoming*, *Deadline*, *Calendar*, and *Journey (Sticky Notes)*.
- **Local Storage Persistence:** All tasks, lists, tags, and settings are automatically saved to your browser's `localStorage`. Your data won't be lost on refresh.
- **Data Management:** Export your data as a JSON file and import it back later (Backup & Restore).
- **Customization:** Toggle between Light/Dark mode, change the accent color, and enable a "Compact Mode" to reduce spacing.
- **Responsive Design:** A clean, modern UI that adapts seamlessly to mobile phones, tablets, and desktops.
- **Mock Authentication:** A simulated login system to demonstrate user session management (stored locally).

## 🛠 Tech Stack

- **HTML5:** Semantic structure.
- **CSS3:** Custom properties (CSS Variables), Flexbox, CSS Grid, and Media Queries for a Mobile-First approach.
- **Vanilla JavaScript (ES6+):** 
  - Object-Oriented approach (Classes for `Store` and `UI`).
  - DOM Manipulation & Event Delegation.
  - `localStorage` for data persistence.
  - `crypto.randomUUID()` for unique ID generation.
  - Date handling for calendar and deadlines.

## 📁 Folder Structure

```text
Task-3-Dynamic-ToDo-List-App/
├── assets/               # Icons and images
├── index.html            # Main HTML structure
├── script.js             # Application logic and state management
└── style.css             # Styling and responsive design
