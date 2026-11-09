# Ulab universal identity graph v1

## Database

This version uses the existing isolated **Identity Lab** Supabase project, separate from Filmshow.

- public.idlab_identity_graphs: latest graph per account owner and professional subject.
- public.idlab_identity_graph_runs: historical graph snapshots and change summaries.

Both tables were created in the live Identity Lab database. RLS is enabled. Anonymous users have no table privileges. Authenticated users may access only graphs they own; inserts of run snapshots verify graph ownership. Historical runs are append-only from the signed-in user's client.

Security advisor review reported no findings. This file documents the live schema; future structural schema changes should be applied through a reviewed migration.

## Identity graph model

The graph includes a person root, optional starting URL, public source nodes, provenance edges, observed factual claims, and correction candidates. Every statement and link retains evidence and uncertainty.

A name match alone never verifies an identity. An official-profile link does not demonstrate control of an external account. The software does not treat its own proposed correction as approved, submitted or published.

## Maintenance

Each research rerun creates a graph snapshot and a comparison to the previous run. Supported observations include new source leads, changes in classification, missing-in-this-scan references, newly observed claims, observed source-text changes, and new correction candidates.

Missing in a scan is NOT the same as publicly deleted. Search coverage changes can generate false alerts. No background schedule is enabled by this version.

## Account and privacy

Graphs and comparisons are saved to browser-local storage for the pilot. Export creates a JSON document containing all four graph snapshots and comparisons.

An optional authenticated save/restore implementation writes to the private tables using the Supabase publishable key and authenticated user's session. It never uses service-role credentials in the browser. Account controls are hidden unless the existing Ulab accounts feature flag is enabled. Accounts are invite-only and currently disabled; no cloud sync occurs in the pilot until account onboarding is enabled.

## Outside platform actions

All graph repairs remain research candidates. Third-party writes require owner-authorized exact changes, appropriate platform integration and independent public verification. No automatic edits, submissions, Knowledge Panel actions, or paid backlink activities are performed.
