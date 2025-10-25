-- CreateTable
CREATE TABLE "USER" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "birth_date" DATE NOT NULL,
    "phone_number" TEXT NOT NULL,
    "driving_license_number" TEXT NOT NULL,
    "license_obtained_date" DATE NOT NULL,
    "street" TEXT,
    "city" TEXT,
    "postal_code" TEXT,
    "country" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "USER_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CHAT_SESSION" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "transcript" TEXT,

    CONSTRAINT "CHAT_SESSION_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CHAT_MESSAGE" (
    "id" UUID NOT NULL,
    "chat_session_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_from_support" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CHAT_MESSAGE_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "USER_email_key" ON "USER"("email");

-- AddForeignKey
ALTER TABLE "CHAT_SESSION" ADD CONSTRAINT "CHAT_SESSION_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "USER"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CHAT_MESSAGE" ADD CONSTRAINT "CHAT_MESSAGE_chat_session_id_fkey" FOREIGN KEY ("chat_session_id") REFERENCES "CHAT_SESSION"("id") ON DELETE CASCADE ON UPDATE CASCADE;
