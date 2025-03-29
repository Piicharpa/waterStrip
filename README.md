# **WaterStrip** 🌊💧  

A streamlined solution for managing water strips with a **backend & database setup** in Docker.  

## 🚀 **Setup Guide**  

### **1 Configure Environment**  
- Add your database **password** in `.env` file.  

### **2 Install Dependencies**  
```sh
cd backend && npm install
cd frontend && npm install
```

### **3 Build docker**
Run the following inside the backend Docker container:
```sh
docker compose up -d --build
```

### **4 Database Migration**
Run the following inside the backend Docker container:
go to exec
```sh
npm run db:push
```
### **5 Connect to Database**
Use DBeaver to build the database connection.
Now you're all set! 🎯 Happy coding! 🚀




