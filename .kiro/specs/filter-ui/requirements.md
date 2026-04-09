# Requirements Document

## Introduction

Fitur filter UI memungkinkan user mengontrol urutan komentar dan jumlah komentar per halaman sebelum melakukan fetch.

## Status: Done

## Requirements

### Requirement 1: Filter Controls

**User Story:** As a user, I want to control the sort order and number of comments per page, so that I can customize how I browse comments.

#### Acceptance Criteria

1. THE Web SHALL provide a dropdown for `order` with options "Paling Relevan" (`relevance`) and "Terbaru" (`time`)
2. THE Web SHALL provide a dropdown for `maxResults` with options 20, 50, and 100
3. THE default value for `order` SHALL be `relevance`
4. THE default value for `maxResults` SHALL be `20`
5. WHEN the user submits the form, THE Web SHALL use the selected filter values in the API request
6. WHEN a new fetch is initiated, THE Web SHALL reset `allComments` and `nextPageToken`
7. WHEN the user changes filters and fetches again, THE filter values SHALL persist across fetches
