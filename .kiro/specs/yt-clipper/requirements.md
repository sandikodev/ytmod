# Requirements Document

## Introduction

Fitur YT Clipper memungkinkan user menganalisa video YouTube menggunakan Gemini AI untuk menemukan momen yang berpotensi viral, kemudian memilih bagian mana yang ingin di-clip untuk format YouTube Shorts. Engine clipping menggunakan `clipper-rust` (Rust + ffmpeg) yang di-deploy secara terpisah.

## Glossary

- **Clipper Engine**: Binary Rust (`clipper-server`) yang menjalankan yt-dlp, Gemini AI analysis, dan ffmpeg
- **BYOK**: Bring Your Own Key — user menyediakan Gemini API key mereka sendiri
- **Clip**: Potongan video pendek (10-30 detik) untuk format YouTube Shorts
- **ngrok**: Tool untuk expose local server ke internet (untuk development/preview)
- **SSH Port Forward**: Metode expose port lokal via SSH tunnel (untuk dev server UII)

## Requirements

### Requirement 1: Analisa Video dengan AI

**User Story:** As a user, I want to analyze a YouTube video with AI to find viral-worthy moments, so that I can decide which parts to clip.

#### Acceptance Criteria

1. THE Web SHALL provide a form with input for YouTube video URL or video ID
2. THE Web SHALL provide an input field for the user's Gemini API key (BYOK)
3. WHEN the user submits the form, THE Web SHALL call the ytmod-api `/clipper/analyze` endpoint
4. THE API SHALL proxy the request to the Clipper Engine's `POST /analyze` endpoint
5. WHEN analysis is complete, THE Web SHALL display the suggested clips with start time, end time, and output filename
6. THE user SHALL be able to select which clips they want to process

### Requirement 2: Proses Clipping

**User Story:** As a user, I want to process selected clips from the analyzed video, so that I get the actual video files.

#### Acceptance Criteria

1. WHEN the user selects clips and clicks "Clip", THE Web SHALL call the ytmod-api `/clipper/clip` endpoint
2. THE API SHALL proxy the request to the Clipper Engine's `POST /clip` endpoint
3. WHEN clipping is complete, THE Web SHALL display the list of output files with success/failure status

### Requirement 3: Konfigurasi Engine URL

**User Story:** As a user, I want to configure the Clipper Engine URL, so that I can use my own deployed instance.

#### Acceptance Criteria

1. THE Web SHALL provide an input field for the Clipper Engine base URL
2. THE default URL SHALL be `https://api.konxc.space/v1/cliper-ai` (production)
3. THE user SHALL be able to override the URL for development/testing (e.g. ngrok URL)
4. THE URL SHALL be persisted in `localStorage`

### Requirement 4: Deploy Environment

**User Story:** As a developer, I want clear deployment instructions for each environment, so that the engine is accessible from the frontend.

#### Acceptance Criteria

1. **Development**: Clipper Engine dijalankan lokal, di-expose via SSH port forward dari dev server UII
2. **Preview**: Clipper Engine di-expose via ngrok untuk testing dengan URL publik sementara
3. **Production**: Clipper Engine berjalan di Docker, di-proxy via nginx ke `https://api.konxc.space/v1/cliper-ai`
4. THE ytmod-api SHALL proxy requests ke Clipper Engine URL yang dikonfigurasi via environment variable `CLIPPER_ENGINE_URL`
