-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BookingRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shortId" TEXT,
    "packageId" TEXT,
    "packageName" TEXT NOT NULL,
    "guestCount" INTEGER NOT NULL DEFAULT 0,
    "venueType" TEXT NOT NULL,
    "calle" TEXT,
    "numero" TEXT,
    "colonia" TEXT,
    "zipCode" TEXT,
    "municipio" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'México',
    "isOutsideZone" BOOLEAN NOT NULL DEFAULT false,
    "viaticosAmount" REAL NOT NULL DEFAULT 0,
    "distanceKm" REAL,
    "durationSec" INTEGER,
    "tollCost" REAL,
    "fuelCost" REAL,
    "requiresManualQuote" BOOLEAN NOT NULL DEFAULT false,
    "mapsLink" TEXT,
    "requestedDate" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "baseAmount" REAL NOT NULL,
    "depositAmount" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "paymentRef" TEXT,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "clientEmail" TEXT,
    "clientUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNote" TEXT,
    "notifiedAdmin" BOOLEAN NOT NULL DEFAULT false,
    "notifiedMusicians" BOOLEAN NOT NULL DEFAULT false,
    "eventId" TEXT,
    "clientId" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "clientProvidesAudio" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'web',
    "followUpCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bandHours" INTEGER DEFAULT 0,
    "djHours" INTEGER DEFAULT 0,
    "isDjWithTvs" BOOLEAN DEFAULT false,
    "hasTemplete" BOOLEAN DEFAULT false,
    "hasPista" BOOLEAN DEFAULT false,
    "hasRobot" BOOLEAN DEFAULT false,
    "hasPantalla" BOOLEAN DEFAULT false,
    "quoteVersion" INTEGER NOT NULL DEFAULT 1,
    "stripePaymentIntentId" TEXT,
    "stripeSessionId" TEXT,
    "adminSignature" TEXT,
    "clientSignature" TEXT,
    "signedAt" DATETIME,
    "signedIp" TEXT,
    "discountAmount" REAL DEFAULT 0,
    "originalPrice" REAL DEFAULT 0,
    "invoice" BOOLEAN NOT NULL DEFAULT false,
    "customName" TEXT,
    "ceremonyType" TEXT,
    "arrivalTime" TEXT,
    "setupTime" TEXT,
    "dressCode" TEXT,
    "musicianNotes" TEXT,
    "sourceInquiryId" TEXT,
    CONSTRAINT "BookingRequest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BookingRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BookingRequest_sourceInquiryId_fkey" FOREIGN KEY ("sourceInquiryId") REFERENCES "ContactInquiry" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BookingRequest" ("address", "adminNote", "adminSignature", "arrivalTime", "bandHours", "baseAmount", "calle", "ceremonyType", "city", "clientEmail", "clientId", "clientName", "clientPhone", "clientProvidesAudio", "clientSignature", "clientUserId", "colonia", "createdAt", "customName", "depositAmount", "discountAmount", "distanceKm", "djHours", "dressCode", "durationSec", "endTime", "eventId", "followUpCount", "fuelCost", "guestCount", "hasPantalla", "hasPista", "hasRobot", "hasTemplete", "id", "invoice", "isDjWithTvs", "isOutsideZone", "isPublic", "mapsLink", "municipio", "musicianNotes", "notifiedAdmin", "notifiedMusicians", "numero", "originalPrice", "packageId", "packageName", "paymentMethod", "paymentRef", "paymentStatus", "quoteVersion", "requestedDate", "requiresManualQuote", "setupTime", "shortId", "signedAt", "signedIp", "source", "startTime", "state", "status", "stripePaymentIntentId", "stripeSessionId", "tollCost", "updatedAt", "venueType", "viaticosAmount", "zipCode") SELECT "address", "adminNote", "adminSignature", "arrivalTime", "bandHours", "baseAmount", "calle", "ceremonyType", "city", "clientEmail", "clientId", "clientName", "clientPhone", "clientProvidesAudio", "clientSignature", "clientUserId", "colonia", "createdAt", "customName", "depositAmount", "discountAmount", "distanceKm", "djHours", "dressCode", "durationSec", "endTime", "eventId", "followUpCount", "fuelCost", "guestCount", "hasPantalla", "hasPista", "hasRobot", "hasTemplete", "id", "invoice", "isDjWithTvs", "isOutsideZone", "isPublic", "mapsLink", "municipio", "musicianNotes", "notifiedAdmin", "notifiedMusicians", "numero", "originalPrice", "packageId", "packageName", "paymentMethod", "paymentRef", "paymentStatus", "quoteVersion", "requestedDate", "requiresManualQuote", "setupTime", "shortId", "signedAt", "signedIp", "source", "startTime", "state", "status", "stripePaymentIntentId", "stripeSessionId", "tollCost", "updatedAt", "venueType", "viaticosAmount", "zipCode" FROM "BookingRequest";
DROP TABLE "BookingRequest";
ALTER TABLE "new_BookingRequest" RENAME TO "BookingRequest";
CREATE UNIQUE INDEX "BookingRequest_shortId_key" ON "BookingRequest"("shortId");
CREATE UNIQUE INDEX "BookingRequest_eventId_key" ON "BookingRequest"("eventId");
CREATE UNIQUE INDEX "BookingRequest_stripeSessionId_key" ON "BookingRequest"("stripeSessionId");
CREATE UNIQUE INDEX "BookingRequest_sourceInquiryId_key" ON "BookingRequest"("sourceInquiryId");
CREATE INDEX "BookingRequest_clientId_idx" ON "BookingRequest"("clientId");
CREATE INDEX "BookingRequest_packageId_idx" ON "BookingRequest"("packageId");
CREATE INDEX "BookingRequest_status_idx" ON "BookingRequest"("status");
CREATE INDEX "BookingRequest_status_createdAt_idx" ON "BookingRequest"("status", "createdAt");
CREATE TABLE "new_ContactInquiry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT NOT NULL,
    "requestedDate" DATETIME,
    "eventType" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "matchedClientId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ContactInquiry" ("createdAt", "email", "eventType", "id", "matchedClientId", "message", "name", "phone", "requestedDate", "status", "updatedAt") SELECT "createdAt", "email", "eventType", "id", "matchedClientId", "message", "name", "phone", "requestedDate", "status", "updatedAt" FROM "ContactInquiry";
DROP TABLE "ContactInquiry";
ALTER TABLE "new_ContactInquiry" RENAME TO "ContactInquiry";
CREATE INDEX "ContactInquiry_status_idx" ON "ContactInquiry"("status");
CREATE INDEX "ContactInquiry_email_idx" ON "ContactInquiry"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
