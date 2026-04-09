# Requirements Document

## Introduction

Fitur pagination memungkinkan user memuat lebih banyak komentar secara incremental tanpa reload halaman. API sudah mengembalikan `nextPageToken` namun UI belum memanfaatkannya.

## Status: Done

## Requirements

### Requirement 1: Load More Comments

**User Story:** As a user, I want to load more comments incrementally, so that I can access all comments without reloading the page.

#### Acceptance Criteria

1. WHEN the API response contains `nextPageToken`, THE Web SHALL display a "Muat lebih banyak" button below the comments list
2. WHEN the user clicks "Muat lebih banyak", THE Web SHALL fetch the next page using `pageToken` and append the new comments to the existing list
3. WHEN loading more comments, THE Web SHALL disable the button and show a loading state
4. WHEN there is no `nextPageToken` in the response, THE Web SHALL hide the "Muat lebih banyak" button
5. THE Web SHALL display a counter showing `X dari Y komentar` where X is loaded count and Y is total
6. WHEN exporting CSV or JSON, THE export SHALL include all loaded comments, not just the first page
