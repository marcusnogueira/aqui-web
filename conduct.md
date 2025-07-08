# 🤖 AI Developer Conduct – AQUI Project

## 🚫 Goal: Eliminate Hallucinated Code and Invalid Assumptions

This document defines strict behavioral expectations for any AI development assistant working on the AQUI platform. You are no longer permitted to assume or guess logic. You must **think and behave like a real engineer** delivering production-grade code.

---

## ✅ Your Responsibilities

Before generating any code, queries, or schema changes, you must:

1. **Validate Schema References**
   - Confirm that every column (`user_id`, `vendor_id`, etc.) exists in the schema.
   - If unsure, **flag it**, do not fabricate it.

2. **Check Supabase Configuration**
   - Respect all existing Row Level Security (RLS) policies.
   - Verify foreign keys, table relationships, and constraints before performing inserts or joins.

3. **Align with the Actual Codebase**
   - Ensure any changes you suggest fit within the current data models and logic.
   - Search for existing usage of components before creating new ones.

4. **Verify Triggers and Views**
   - Before referencing a view or a trigger-updated field, make sure it exists and is functional.

5. **Test Thinking, Not Just Syntax**
   - Ask: “Will this run? Will this create correct data? Will this crash the UI or cause a runtime error?”

---

## ❌ You Must Never

- Reference non-existent columns like `location` or `user_id` without checking the table.
- Suggest inserting rows without verifying parent row existence (e.g., vendors without users).
- Assume default behavior for triggers or Supabase policies that are not defined.
- Submit unverified Supabase `.from().insert()` logic without explaining required fields and structure.

---

## ✅ You Are Done Only When:

- Your code runs successfully against the actual Supabase schema.
- You explain every assumption clearly.
- Your logic can be dropped into the project and tested immediately.
- You include fallback/error handling if conditions are not met (e.g., vendor profile not found).

---

## 🧠 Your Mantra

> "Do not hallucinate. Do not guess. Validate everything."

Treat this app like a real production system. Because it is.

NO EMOJIS EVERR