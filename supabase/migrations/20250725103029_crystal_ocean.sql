/*
  # Initial Schema Setup for Event Processing System

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `eventId` (text, unique) - Original event identifier
      - `timestamp` (datetime) - When the event occurred
      - `source` (text) - Event source (facebook|tiktok)
      - `funnelStage` (text) - Funnel stage (top|bottom)
      - `eventType` (text) - Type of event
      - `data` (json) - Complete event payload
      - `createdAt` (datetime) - Record creation time
      - `updatedAt` (datetime) - Record update time

    - `users`
      - `id` (uuid, primary key)
      - `userId` (text, unique) - Original user identifier
      - `source` (text) - User source (facebook|tiktok)
      - `userData` (json) - Complete user data
      - `createdAt` (datetime) - Record creation time
      - `updatedAt` (datetime) - Record update time

  2. Indexes
    - Performance indexes on commonly queried fields
    - Composite indexes for filtering operations

  3. Security
    - All tables use UUID primary keys
    - Unique constraints on business identifiers
    - Proper indexing for query performance
*/

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "funnelStage" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "userData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "events_eventId_key" ON "events"("eventId");

-- CreateIndex
CREATE INDEX "events_source_funnelStage_idx" ON "events"("source", "funnelStage");

-- CreateIndex
CREATE INDEX "events_eventType_idx" ON "events"("eventType");

-- CreateIndex
CREATE INDEX "events_timestamp_idx" ON "events"("timestamp");

-- CreateIndex
CREATE INDEX "events_source_timestamp_idx" ON "events"("source", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "users_userId_key" ON "users"("userId");

-- CreateIndex
CREATE INDEX "users_source_idx" ON "users"("source");