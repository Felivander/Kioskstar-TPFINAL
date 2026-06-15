# Geocoded Kiosks Seed Design

## Goal
Update the backend database seeder (`prisma/seed.ts`) to generate 40 kiosks with realistic addresses in Concordia, Entre Ríos, and use the Google Maps Geocoding API to ensure their `lat`/`lng` coordinates precisely match their physical address on the map.

## Context
Currently, the seeder generates random fictional addresses and pairs them with arbitrary mathematical coordinates. This results in markers on the map whose physical placement does not match the street address shown in the info window.

## Proposed Architecture

1. **Address Generation**:
   - The seeder will continue to generate addresses randomly but using a curated list of major Concordia streets (e.g., "Av. San Martín", "Urquiza", "Pellegrini").
   - The street numbers will be restricted to plausible ranges (e.g., 100 to 1000) to maximize the probability that Google Maps successfully resolves the address.

2. **Geocoding Process**:
   - For each generated address, the seeder will invoke the `geocodeAddress` service.
   - The query format will be strictly: `"{Street} {Number}, Concordia, Entre Ríos, Argentina"` to provide maximum context to the API.

3. **Fallback & Retry Logic**:
   - If `geocodeAddress` returns `null` (e.g., the address does not exist or the API fails), the seeder will discard that address and generate a new one until exactly 40 valid kiosks are successfully geocoded and saved.

4. **Branches**:
   - To avoid unnecessary API calls and keep the logic focused, each Kiosk will be seeded with exactly 1 Branch ("Sucursal Principal") located at the exact same geocoded coordinates and address as the Kiosk.

## Data Flow
`generateAddress()` -> `geocodeAddress(address)` -> `Success (save to DB)` or `Failure (retry)` -> `Loop until 40 kiosks are saved.`
