# Seed 40 Geocoded Kiosks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify the Prisma seed script to generate exactly 40 Kiosks in Concordia using real street addresses verified by the Google Maps Geocoding API.

**Architecture:** We will update `backend/prisma/seed.ts` to import `geocodeAddress`, generate addresses using a realistic array of streets, query the Google Maps API until 40 valid addresses are geocoded, and then create 1 Kiosk and 1 Branch per valid address.

**Tech Stack:** Node.js, Prisma, Google Maps API

---

### Task 1: Update Prisma Seeder Script

**Files:**
- Modify: `c:\Users\feliv\Documents\Kioskstar-TPFINAL\backend\prisma\seed.ts`

- [ ] **Step 1: Write the updated seed code**

First, import the geocoding service at the top of the file:

```typescript
import { geocodeAddress } from '../src/services/maps.service';
```

Replace the kiosk generation loop (around lines 224-274) with the following exact implementation:

```typescript
  // ── 40 Kioscos Geocodificados en Concordia ──
  const usedNames = new Set<string>();
  const allBranches: { id: number; kioskId: number }[] = [];
  let validKiosksCount = 0;
  let attempts = 0;

  console.log('🌍 Geocodificando direcciones para 40 kioscos...');

  while (validKiosksCount < 40 && attempts < 200) {
    attempts++;
    
    // Generate unique name
    let name = '';
    do {
      name = generateKioskName(validKiosksCount);
    } while (usedNames.has(name));

    // Generate address
    const calle = randomItem(calles);
    const numero = Math.floor(Math.random() * 900) + 100; // 100 to 1000
    const address = `${calle} ${numero}`;
    const fullAddress = `${address}, Concordia, Entre Ríos, Argentina`;

    // Geocode the address
    const coords = await geocodeAddress(fullAddress);
    
    if (!coords) {
      // If geocoding fails or address doesn't exist, skip and try another one
      continue;
    }

    usedNames.add(name);

    // Create Kiosk
    const kiosk = await prisma.kiosk.create({
      data: {
        name,
        ownerId: admin.id,
        address,
        city: 'Concordia',
        postalCode: '3200',
        province: 'Entre Ríos',
        lat: coords.lat,
        lng: coords.lng,
      },
    });

    // Create exactly 1 branch for the kiosk
    const branch = await prisma.branch.create({
      data: {
        kioskId: kiosk.id,
        name: 'Sucursal Principal',
        address: address,
        lat: coords.lat,
        lng: coords.lng,
      },
    });
    
    allBranches.push({ id: branch.id, kioskId: kiosk.id });
    validKiosksCount++;

    if (validKiosksCount % 10 === 0) console.log(`   🏪 ${validKiosksCount}/40 kioscos geocodificados...`);
  }

  console.log(`🏪 ${validKiosksCount} kioscos creados con ${allBranches.length} sucursales`);
```

- [ ] **Step 2: Run the script to verify success**

Run: `cmd.exe /c "npm run db:seed"` from the `backend/` directory.
Expected: The script should log the progress and finish successfully, creating the 40 geocoded kiosks.

- [ ] **Step 3: Commit the changes**

```bash
git add backend/prisma/seed.ts
git commit -m "chore: update seeder to generate 40 geocoded kiosks"
```
