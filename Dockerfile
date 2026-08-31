FROM node:20-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
copy package*.json ./
copy prisma ./prisma/
RUN npm install 
RUN npx prisma generate 
copy . .
run npm run build 
expose 3000 
cmd ["npm" , "start"]