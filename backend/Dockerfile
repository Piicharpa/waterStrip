FROM node:22-alpine AS base
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY . .

# ติดตั้ง dependencies
RUN npm ci
# สร้างโปรเจค
RUN npm run build

# ใช้ environment variables ที่ตั้งค่าใน .env
ENV NODE_ENV production
ENV PORT 3001

# ตรวจสอบฐานข้อมูล PostgreSQL ก่อนที่จะรันคำสั่ง db:push และ start
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# เพิ่มคำสั่งที่รัน migration ก่อนเริ่ม server
CMD ["/wait-for-it.sh", "waterStrip-db:5432", "--", "npm", "run", "db:push", "&&", "npm", "run", "start"]

EXPOSE 3001
