# Claude Code Instructions for This Project

**This is an Idea Factory project.**

## When I Start a Session

1. **If the user says "continue":**
   - Read `.claude/current_state.md` FIRST (rolling summary, 1-2 pages)
   - Read `.idea-factory/working-guide.md` for full protocol
   - Check GitHub issues: `gh issue list`
   - Greet the user with current status from current_state.md
   - ONLY dig into `.claude/insights/_index.json` if user asks specific historical questions

2. **If the user gives a task directly:**
   - Just do the task
   - Follow the working guide for tool usage, git workflow, and conversation style

## When I End a Session

**ALWAYS before ending:**
1. Check for uncommitted work: `git status`
2. If there are changes:
   - `git add -A`
   - `git commit -m "type(scope): description"`
   - `git push`
3. Confirm: `git status` should show "up to date with origin"

**Never end a session with uncommitted or unpushed work.**

## Core Principles

**From `.idea-factory/working-guide.md`:**
- Don't code until readiness ≥ 70%
- Use readiness-driven development (exploring → designing → building)
- Track insights automatically (decisions, assumptions, blockers)
- Be brief by default, elaborate when asked
- Use Task tools for multi-step tasks
- Update readiness after major conversations
- **Commit and push at end of every session**

## The Working Guide

All methodology details are in `.idea-factory/working-guide.md`. Read it when:
- User says "continue"
- You need clarification on process
- You're about to commit, create PR, or run experiments

## Quick Reference

**Key files (read in this order):**
- `.claude/current_state.md` - **READ FIRST** (rolling summary, always current)
- `.idea-factory/working-guide.md` - How we work together
- `.idea-factory/idea-context.json` - Project metadata
- `.claude/state/readiness.json` - Detailed readiness breakdown
- `.claude/insights/_index.json` - Decisions, assumptions, blockers
- `.claude/archives/` - Historical sessions (only if needed)

**Project-specific context:**
This is a **board intelligence platform for nonprofit schools**.

**Authoritative reference documents:**
- `publicfunding.md` - DOE/Medicaid optimization strategy (treat as authoritative source for SSHSP billing, NYSED rates, NYC DOE Medicaid operations)
- `privatefunding.md` - Transformational philanthropy strategy (treat as authoritative source for major gifts, DAFs, campaign architecture)

When discussing funding strategy, compliance requirements, or billing codes, reference these documents directly.

## Domain-Specific Rules

### Medicaid Compliance
- SSHSP billing codes and rates change periodically - always note "verify current rates with NYC DOE Medicaid Operations"
- Six required documentation elements: IEP inclusion, credentials, parental consent, written orders, supervision docs, encounter notes
- Six-year record retention requirement

### Nonprofit Terminology
- "853 schools" = NYSED-approved private special education schools
- SSHSP = Preschool/School Supportive Health Services Program (NY Medicaid)
- DAF = Donor-Advised Fund
- CASE = Council for Advancement and Support of Education (campaign counting standards)

### Financial Accuracy
- When discussing revenue scenarios, always state assumptions explicitly
- Distinguish between "what DOE pays directly to school" vs. "what DOE claims from Medicaid upstream"
- Be conservative with revenue estimates

---

**Last synced from:** `~/Desktop/projects/idea_factory/templates/CLAUDE.md`
**Project-specific version:** 1.0
**Last updated:** 2026-02-10
