# AI Engineering Decisions — Habit Generation System

## Overview

This document explains the engineering decisions taken to integrate Large Language Models (LLMs) into the habit generation system while preserving determinism, structural consistency, and product reliability.

The goal is not simply to use AI to generate content, but to **govern AI outputs within a controlled backend architecture**.

The system is designed around the following principles:

- AI is treated as an **untrusted external dependency**
- Business logic remains **fully controlled by the backend**
- LLM outputs are constrained through **prompt structure, schema validation, and deterministic orchestration**

---

# System Architecture

The habit system is built around a three-stage generation pipeline.


User Test → Habit Series Generation → Action Generation


Each stage progressively reduces ambiguity and increases operational clarity.

## Stage 1 — Habit Series Generation

The first AI pass generates a **personalized habit series** from structured user responses.

The series contains:

- A title
- A strategic description
- Four executable actions

The objective of this stage is to establish the **conceptual and strategic foundation of the habit system**.

The description explains:

- why the habit matters
- how it relates to the user’s context
- how the actions create progress

Actions generated in this stage must already be **fully executable tasks**.

---

# Design Philosophy

The design intentionally separates two levels:

## Strategic layer
The series description explains the logic and purpose of the habit.

This layer allows reflective reasoning and contextual personalization.

## Operational layer
Actions must be strictly executable.

An action must always satisfy the following properties:

- concrete
- finite
- executable in a single session
- measurable
- clearly completable

If a user cannot clearly say *“I executed this”*, the action is invalid.

---

# Personalization Constraints

Habit generation is **strictly dependent on user test responses**.

The prompt explicitly forces the model to incorporate elements such as:

- profession
- motivations
- obstacles
- previous attempts
- environment
- emotional triggers

This prevents generic productivity advice.

The output must feel **written for a specific individual**, not a generic user.

---

# Domain Anchoring

The habit series must always revolve around a **concrete operational domain**.

Examples:

- chess training
- deep work
- software engineering practice
- writing discipline
- physical training

Generic domains such as:

- productivity
- discipline
- improvement

are explicitly forbidden as the core theme.

This constraint ensures that actions are tied to **real skill development**, not abstract self-help concepts.

---

# Action Generation System

Actions can be generated in two contexts:

1. During series creation
2. As additional actions extending an existing series

Both cases must produce **identical output structure**.

This prevents visible inconsistencies inside the product.

---

# Action Format Contract

Every generated action must follow the same structural contract:


Action name
Action description
Difficulty level


Description constraints:

- 35–60 words
- must explain execution clearly
- must define completion condition
- must explain practical benefit

Difficulty levels:


low
medium
high


---

# Difficulty Control

LLMs tend to default to **medium difficulty** when given freedom.

To avoid this bias, difficulty assignment is controlled at the **backend level**.

The backend injects the difficulty into the prompt when generating an action.

Example flow:


Backend selects difficulty
↓
Prompt receives forced difficulty
↓
LLM generates action consistent with that difficulty


This ensures balanced distribution and predictable behavior.

---

# Structural Consistency

When generating new actions for an existing series, the system enforces:

- thematic consistency
- stylistic consistency
- logical progression
- no duplication of existing actions

The new action must feel like a **natural continuation of the series protocol**.

---

# Prompt Engineering Strategy

Prompts are deliberately designed to enforce constraints.

Key techniques used:

### Domain anchoring
Forces the habit to revolve around a real capability.

### Execution standard
Defines strict criteria for valid actions.

### Output structure enforcement
Prevents markdown, JSON, or commentary.

### Personalization requirements
Forces integration of user context.

### Language enforcement
Ensures output consistency for multilingual support.

---

# Backend Responsibility

The backend remains responsible for:

- difficulty distribution
- schema validation
- persistence
- business rules
- execution tracking

The LLM is responsible only for **content generation within constraints**.

This separation preserves system reliability.

---

# Engineering Principle

The core principle of this system is:

> AI should assist generation, but **never control system logic**.

The backend defines structure and constraints.

The LLM fills that structure with contextual content.

---

# Result

The final result is a hybrid system combining:

- deterministic backend architecture
- constrained AI generation
- personalized user experiences

This approach enables scalable habit generation while preserving control over system behavior.