# Requirements Document

## Introduction

Fitur ini menampilkan judul video YouTube di UI setelah komentar berhasil diambil, sehingga user tidak perlu membuka YouTube secara manual untuk mengetahui video apa yang sedang diunduh komentarnya.

## Status: Done

## Requirements

### Requirement 1: Fetch Video Title dari API

**User Story:** As a user, I want to see the video title displayed after fetching comments, so that I can confirm I'm downloading comments from the correct video.

#### Acceptance Criteria

1. WHEN a valid `videoId` is provided, THE API SHALL fetch the video title from the YouTube Data API `videos` endpoint
2. THE API SHALL include `videoTitle` as an optional field in the `CommentsResponse`
3. IF the YouTube videos API call fails, THE API SHALL still return the comments response with `videoTitle` set to `undefined` (non-fatal)
4. THE Web SHALL display the video title above the comments list when `videoTitle` is present
5. THE display format SHALL be `"{videoTitle}" — {totalComments} komentar`
