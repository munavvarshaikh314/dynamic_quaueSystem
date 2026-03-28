FROM node:18

WORKDIR /app

# Copy only package files first (for caching)
COPY package.json ./

# Install dependencies fresh for Linux
RUN npm install

# Copy rest of source
COPY . .

# Build app
RUN npm run build

EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host"]