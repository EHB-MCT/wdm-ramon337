FROM node:20-alpine as build

WORKDIR /app

COPY planner-frontend/package*.json ./
RUN npm install

COPY planner-frontend/ ./

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]