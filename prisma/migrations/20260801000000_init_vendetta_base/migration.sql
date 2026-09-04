-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CLIENT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ClientProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT,
    "company" TEXT,
    "rfc" TEXT,
    "fiscalAddress" TEXT,
    "legalRepName" TEXT,
    "legalRepRole" TEXT,
    "legalRepPower" TEXT,
    "notificationAddress" TEXT,
    "billingData" TEXT,
    "notes" TEXT,
    "city" TEXT,
    "state" TEXT,
    "whatsapp" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MusicianProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "instrument" TEXT,
    "notes" TEXT,
    "role" TEXT,
    "whatsapp" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isTitular" BOOLEAN NOT NULL DEFAULT false,
    "availability" TEXT NOT NULL DEFAULT 'Disponible',
    "rating" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MusicianProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Substitute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "musicianProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "availability" TEXT NOT NULL DEFAULT 'Disponible',
    "rating" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Substitute_musicianProfileId_fkey" FOREIGN KEY ("musicianProfileId") REFERENCES "MusicianProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "references" TEXT,
    "spaceType" TEXT,
    "logisticsNotes" TEXT,
    "city" TEXT,
    "state" TEXT,
    "mapsLink" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "address" TEXT,
    "whatsapp" TEXT,
    "serviceType" TEXT NOT NULL,
    "contactInfo" TEXT,
    "services" TEXT,
    "cost" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "baseCostPerHour" REAL NOT NULL,
    "minDuration" INTEGER NOT NULL,
    "maxDuration" INTEGER DEFAULT 5,
    "description" TEXT,
    "includes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCustom" BOOLEAN DEFAULT false
);

-- CreateTable
CREATE TABLE "ServiceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Inclusión',
    "icon" TEXT DEFAULT 'Check',
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PackageService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "setupCost" REAL NOT NULL DEFAULT 0,
    "hourlyCost" REAL NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PackageService_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "language" TEXT,
    "genre" TEXT,
    "era" TEXT,
    "durationMinutes" REAL,
    "key" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Setlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SetlistSong" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "setlistId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SetlistSong_setlistId_fkey" FOREIGN KEY ("setlistId") REFERENCES "Setlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SetlistSong_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BandEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventDate" DATETIME NOT NULL,
    "eventMonth" TEXT NOT NULL,
    "eventYear" INTEGER NOT NULL,
    "clientName" TEXT NOT NULL,
    "baseIncome" REAL NOT NULL DEFAULT 0,
    "ivaAmount" REAL NOT NULL DEFAULT 0,
    "totalIncome" REAL NOT NULL DEFAULT 0,
    "eventType" TEXT NOT NULL DEFAULT 'show',
    "status" TEXT NOT NULL DEFAULT 'completado',
    "location" TEXT,
    "paymentMethod" TEXT,
    "paymentRef" TEXT,
    "invoice" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SiteMedia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "section" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'image',
    "url" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "stars" INTEGER NOT NULL DEFAULT 5,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'approved',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event" TEXT
);

-- CreateTable
CREATE TABLE "PublicBandMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "img" TEXT NOT NULL,
    "shortBio" TEXT NOT NULL,
    "fullBio" TEXT NOT NULL,
    "ig" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalEstimated" REAL NOT NULL DEFAULT 0,
    "guestCount" INTEGER NOT NULL DEFAULT 0,
    "ceremonyType" TEXT,
    "notes" TEXT,
    "eventDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "followUpCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuoteItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitCost" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT,
    "clientId" TEXT,
    "locationId" TEXT,
    "date" DATETIME NOT NULL,
    "startTime" TEXT,
    "packageId" TEXT,
    "amount" REAL NOT NULL DEFAULT 0,
    "deposit" REAL NOT NULL DEFAULT 0,
    "balance" REAL NOT NULL DEFAULT 0,
    "ivaAmount" REAL NOT NULL DEFAULT 0,
    "totalIncome" REAL NOT NULL DEFAULT 0,
    "depositMethod" TEXT,
    "paymentMethod" TEXT,
    "paymentRef" TEXT,
    "invoice" BOOLEAN NOT NULL DEFAULT false,
    "totalWithTax" REAL,
    "guestCount" INTEGER NOT NULL DEFAULT 0,
    "ceremonyType" TEXT,
    "dressCode" TEXT,
    "performanceStart" TEXT,
    "performanceEnd" TEXT,
    "logisticalNotes" TEXT,
    "arrivalTime" TEXT,
    "setupTime" TEXT,
    "musicianNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "googleCalendarId" TEXT,
    "bandEventId" TEXT,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "customName" TEXT,
    "mapsLink" TEXT,
    "venueType" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "clientProvidesAudio" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bitacora" TEXT,
    "audioEngineer" TEXT,
    CONSTRAINT "Event_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Event_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Event_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Event_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT,
    "bookingRequestId" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "method" TEXT NOT NULL,
    "provider" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reference" TEXT,
    "proofUrl" TEXT,
    "receiptUrl" TEXT,
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "stripeCustomerId" TEXT,
    "rawPayload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "BookingRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "signedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Contract_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "messageId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT,
    "template" TEXT,
    "bookingRequestId" TEXT,
    "errorDetails" TEXT,
    "retries" INTEGER NOT NULL DEFAULT 0,
    "lastRetryAt" DATETIME,
    "actorId" TEXT
);

-- CreateTable
CREATE TABLE "BookingRequest" (
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
    CONSTRAINT "BookingRequest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BookingRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rehearsal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "datetime" DATETIME NOT NULL,
    "locationId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Rehearsal_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RehearsalSong" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rehearsalId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RehearsalSong_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RehearsalSong_rehearsalId_fkey" FOREIGN KEY ("rehearsalId") REFERENCES "Rehearsal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RehearsalMusician" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rehearsalId" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RehearsalMusician_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "MusicianProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RehearsalMusician_rehearsalId_fkey" FOREIGN KEY ("rehearsalId") REFERENCES "Rehearsal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventMusician" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventMusician_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "MusicianProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventMusician_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GlobalConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'vendetta_config',
    "googleClientId" TEXT,
    "googleClientSecret" TEXT,
    "googleRefreshToken" TEXT,
    "googleCalendarId" TEXT,
    "lastCalendarSync" DATETIME,
    "evolutionUrl" TEXT,
    "evolutionApiKey" TEXT,
    "evolutionInstance" TEXT DEFAULT 'vendetta_admin',
    "adminWhatsapp" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "tiktokUrl" TEXT,
    "whatsappUrl" TEXT,
    "msgTemplateGig" TEXT,
    "msgTemplateQuote" TEXT,
    "msgTemplateEventClose" TEXT,
    "msgTemplateBarClose" TEXT,
    "zona2Rate" REAL DEFAULT 1500.0,
    "zona3Rate" REAL DEFAULT 3000.0,
    "zona2Cities" TEXT DEFAULT 'valle de bravo, avandaro, malinalco, ixtapan de la sal, tonatico, ciudad de mexico, cdmx, df, distrito federal, naucalpan, tlalnepantla, huixquilucan, interlomas, santa fe, cuajimalpa, alvaro obregon, coyoacan, tlalpan, tepotzotlan, atizapan, izcalli',
    "zona3Cities" TEXT DEFAULT 'cuernavaca, tepoztlan, jiutepec, morelos, queretaro, san juan del rio, juriquilla, puebla, cholula, atlixco, pachuca, hidalgo, tlaxcala',
    "bankName" TEXT,
    "bankAccount" TEXT,
    "bankClabe" TEXT,
    "bankBeneficiary" TEXT,
    "evolutionWebhookSecret" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "msgTemplateFollowUp" TEXT,
    "autoFollowUpEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoThanksEnabled" BOOLEAN NOT NULL DEFAULT true,
    "msgTemplateExpiring" TEXT,
    "msgExpiringActive" BOOLEAN NOT NULL DEFAULT true,
    "msgTemplateReminder" TEXT,
    "msgReminderActive" BOOLEAN NOT NULL DEFAULT true,
    "msgTemplateThanks" TEXT,
    "msgThanksActive" BOOLEAN NOT NULL DEFAULT true,
    "adminSignature" TEXT,
    "isSandbox" BOOLEAN NOT NULL DEFAULT false,
    "logInboundActive" BOOLEAN NOT NULL DEFAULT true,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImage" TEXT,
    "contractLegalText" TEXT,
    "contractBarLegalText" TEXT,
    "payMercadoPagoActive" BOOLEAN NOT NULL DEFAULT true,
    "payTransferenciaActive" BOOLEAN NOT NULL DEFAULT true,
    "payPersonalActive" BOOLEAN NOT NULL DEFAULT true,
    "payStripeActive" BOOLEAN NOT NULL DEFAULT false,
    "stripePublicKey" TEXT,
    "stripeSecretKey" TEXT,
    "stripeWebhookSecret" TEXT,
    "mercadoPagoAccessToken" TEXT,
    "mercadoPagoPublicKey" TEXT,
    "googleMapsApiKey" TEXT,
    "viaticosLocalRadius" REAL DEFAULT 50.0,
    "viaticosVehicleCount" INTEGER DEFAULT 2,
    "msgTodayReminderActive" BOOLEAN NOT NULL DEFAULT true,
    "msgTemplateTodayReminder" TEXT
);

-- CreateTable
CREATE TABLE "InboxItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "senderName" TEXT,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "assignedTo" TEXT,
    "clientId" TEXT,
    "bookingRequestId" TEXT,
    CONSTRAINT "InboxItem_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InboxItem_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "BookingRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PushToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PushToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SongSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "youtubeLink" TEXT,
    "spotifyLink" TEXT,
    "notes" TEXT,
    "suggestedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SongSuggestion_suggestedById_fkey" FOREIGN KEY ("suggestedById") REFERENCES "MusicianProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PackageToService" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PackageToService_A_fkey" FOREIGN KEY ("A") REFERENCES "Package" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PackageToService_B_fkey" FOREIGN KEY ("B") REFERENCES "ServiceItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ClientProfile_userId_key" ON "ClientProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MusicianProfile_userId_key" ON "MusicianProfile"("userId");

-- CreateIndex
CREATE INDEX "MusicianProfile_status_idx" ON "MusicianProfile"("status");

-- CreateIndex
CREATE INDEX "Substitute_musicianProfileId_idx" ON "Substitute"("musicianProfileId");

-- CreateIndex
CREATE INDEX "PackageService_packageId_idx" ON "PackageService"("packageId");

-- CreateIndex
CREATE INDEX "SetlistSong_setlistId_idx" ON "SetlistSong"("setlistId");

-- CreateIndex
CREATE INDEX "SetlistSong_songId_idx" ON "SetlistSong"("songId");

-- CreateIndex
CREATE INDEX "Quote_clientId_idx" ON "Quote"("clientId");

-- CreateIndex
CREATE INDEX "Quote_status_idx" ON "Quote"("status");

-- CreateIndex
CREATE INDEX "QuoteItem_quoteId_idx" ON "QuoteItem"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_quoteId_key" ON "Event"("quoteId");

-- CreateIndex
CREATE INDEX "Event_clientId_idx" ON "Event"("clientId");

-- CreateIndex
CREATE INDEX "Event_locationId_idx" ON "Event"("locationId");

-- CreateIndex
CREATE INDEX "Event_packageId_idx" ON "Event"("packageId");

-- CreateIndex
CREATE INDEX "Event_bandEventId_idx" ON "Event"("bandEventId");

-- CreateIndex
CREATE INDEX "Event_date_idx" ON "Event"("date");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeSessionId_key" ON "Payment"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Payment_eventId_idx" ON "Payment"("eventId");

-- CreateIndex
CREATE INDEX "Payment_bookingRequestId_idx" ON "Payment"("bookingRequestId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Contract_eventId_idx" ON "Contract"("eventId");

-- CreateIndex
CREATE INDEX "Notification_eventId_idx" ON "Notification"("eventId");

-- CreateIndex
CREATE INDEX "Notification_bookingRequestId_idx" ON "Notification"("bookingRequestId");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BookingRequest_shortId_key" ON "BookingRequest"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingRequest_eventId_key" ON "BookingRequest"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingRequest_stripeSessionId_key" ON "BookingRequest"("stripeSessionId");

-- CreateIndex
CREATE INDEX "BookingRequest_clientId_idx" ON "BookingRequest"("clientId");

-- CreateIndex
CREATE INDEX "BookingRequest_packageId_idx" ON "BookingRequest"("packageId");

-- CreateIndex
CREATE INDEX "BookingRequest_status_idx" ON "BookingRequest"("status");

-- CreateIndex
CREATE INDEX "BookingRequest_status_createdAt_idx" ON "BookingRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Rehearsal_locationId_idx" ON "Rehearsal"("locationId");

-- CreateIndex
CREATE INDEX "Rehearsal_datetime_idx" ON "Rehearsal"("datetime");

-- CreateIndex
CREATE INDEX "RehearsalSong_rehearsalId_idx" ON "RehearsalSong"("rehearsalId");

-- CreateIndex
CREATE INDEX "RehearsalSong_songId_idx" ON "RehearsalSong"("songId");

-- CreateIndex
CREATE INDEX "RehearsalMusician_rehearsalId_idx" ON "RehearsalMusician"("rehearsalId");

-- CreateIndex
CREATE INDEX "RehearsalMusician_musicianId_idx" ON "RehearsalMusician"("musicianId");

-- CreateIndex
CREATE INDEX "EventMusician_eventId_idx" ON "EventMusician"("eventId");

-- CreateIndex
CREATE INDEX "EventMusician_musicianId_idx" ON "EventMusician"("musicianId");

-- CreateIndex
CREATE INDEX "InboxItem_status_idx" ON "InboxItem"("status");

-- CreateIndex
CREATE INDEX "InboxItem_clientId_idx" ON "InboxItem"("clientId");

-- CreateIndex
CREATE INDEX "InboxItem_bookingRequestId_idx" ON "InboxItem"("bookingRequestId");

-- CreateIndex
CREATE INDEX "InboxItem_createdAt_idx" ON "InboxItem"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PushToken_token_key" ON "PushToken"("token");

-- CreateIndex
CREATE INDEX "PushToken_userId_idx" ON "PushToken"("userId");

-- CreateIndex
CREATE INDEX "SongSuggestion_suggestedById_idx" ON "SongSuggestion"("suggestedById");

-- CreateIndex
CREATE INDEX "SongSuggestion_status_idx" ON "SongSuggestion"("status");

-- CreateIndex
CREATE UNIQUE INDEX "_PackageToService_AB_unique" ON "_PackageToService"("A", "B");

-- CreateIndex
CREATE INDEX "_PackageToService_B_index" ON "_PackageToService"("B");

